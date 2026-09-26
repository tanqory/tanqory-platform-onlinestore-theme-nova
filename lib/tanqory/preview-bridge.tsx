import React, { useEffect, useRef, useState, type FC, type ReactNode } from 'react'
import { SectionTree } from './SectionTree'
import { useData } from './data'
import type { ContentNode } from './types'
import { isAllowedStudioOrigin, resolvePreviewOrigins } from './preview-origins'
import { clearAll, clearHover, labelForType, showHover, showSelection } from './selection-overlay'

/**
 * Preview bridge — the EDIT-plane runtime that lives INSIDE the iframe.
 *
 * Unlike `?edit` (which mounts the whole editor inside the theme bundle), the
 * bridge ships no editor UI: it only (1) renders the content tree and (2) speaks
 * postMessage with the parent editor app. The editor chrome lives in a separate
 * app (apps/studio-editor) and drives this iframe.
 *
 * Protocol (namespaced `tq:`):
 *   iframe → parent : { type:'tq:ready', pages }       on mount
 *                     { type:'tq:select', path }       when a section is clicked
 *   parent → iframe : { type:'tq:set-content', page?, doc? }   render this tree
 *                     { type:'tq:select', path }               highlight a node
 */
const isMsg = (m: unknown): m is { type: string; [k: string]: unknown } =>
  !!m && typeof m === 'object' && typeof (m as { type?: unknown }).type === 'string'

export function PreviewBridge({
  pages,
  initialPage,
  Shell,
  allowedOrigins,
}: {
  pages: Record<string, ContentNode[]>
  initialPage: string
  Shell: FC<{ children: ReactNode }>
  /** Exact studio origins that may drive this canvas (see preview-origins.ts). */
  allowedOrigins?: readonly string[]
}): JSX.Element {
  const [tree, setTree] = useState<ContentNode[]>(pages[initialPage] ?? [])
  const [selected, setSelected] = useState<number[] | null>(null)
  const data = useData()
  const rules = useRef(
    resolvePreviewOrigins(allowedOrigins, typeof location !== 'undefined' ? location.hostname : ''),
  ).current
  // The origin the editor last spoke from. Until it does, messages go to every
  // allowed origin (a postMessage to a non-matching targetOrigin is dropped by
  // the browser, so this reaches exactly the frame that is the editor).
  const editorOrigin = useRef<string | null>(null)
  // Post to the parent AND the top window. The editor canvas may nest this
  // preview inside another iframe (e.g. the block-editor canvas iframe), in which
  // case `window.parent` is that intermediate frame, not the editor window that
  // listens for selection/content messages — so we also target `window.top`.
  // Never `'*'`: the messages carry the merchant's unsaved content.
  const send = (msg: object) => {
    const targets = editorOrigin.current ? [editorOrigin.current] : rules.allowed
    for (const origin of targets) {
      try {
        if (window.parent && window.parent !== window) window.parent.postMessage(msg, origin)
        if (window.top && window.top !== window.parent && window.top !== window) window.top.postMessage(msg, origin)
      } catch {
        /* cross-origin top access can throw — parent post already attempted */
      }
    }
  }
  // A command is honoured only from the frame that embeds this canvas, and only
  // when that frame's origin is a known studio host.
  const trusted = (e: MessageEvent): boolean => {
    if (e.source !== window.parent && e.source !== window.top) return false
    if (e.source === window) return false
    return isAllowedStudioOrigin(e.origin, rules)
  }

  // Keep the latest tree in a ref so the message handler can return it on
  // demand (the editor's Publish reads the LIVE-edited content straight from
  // the preview — the source of truth for "what's on screen").
  const treeRef = useRef<ContentNode[]>(tree)
  useEffect(() => { treeRef.current = tree }, [tree])

  // Write-through (write-through): on every content change, push the current
  // content to the editor host so it persists the draft immediately — no
  // explicit "save". `firstRender` skips the initial mount so we don't re-save
  // the just-loaded draft. The host debounces.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    send({ type: 'tanqory-content-changed', content: { sections: tree } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree])

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!isMsg(e.data)) return
      if (!trusted(e)) return
      editorOrigin.current = e.origin
      if (e.data.type === 'tanqory-get-content') {
        // reply with the current (live-edited) page content in theme-kit format
        send({ type: 'tanqory-content', requestId: e.data.requestId ?? null, content: { sections: treeRef.current } })
      } else if (e.data.type === 'tq:set-content') {
        if (Array.isArray(e.data.doc)) setTree(e.data.doc as ContentNode[])
        else if (typeof e.data.page === 'string' && pages[e.data.page]) setTree(pages[e.data.page])
      } else if (e.data.type === 'tq:select') {
        setSelected(Array.isArray(e.data.path) ? (e.data.path as number[]) : null)
      } else if (e.data.type === 'tanqory-preview-update-section') {
        // studio-editor edited a section's settings (and possibly its child
        // blocks) → merge + re-render live. The editor sends blocks in its
        // OWN shape (object map keyed by id + order[]) — convert to
        // theme-kit's array here so render code only ever sees arrays.
        const id = e.data.sectionId as string
        const s = (e.data.settings ?? {}) as Record<string, unknown>
        const rawBlocks = e.data.blocks as Record<string, ContentNode> | ContentNode[] | null
        const order = e.data.order as string[] | null
        let blocks: ContentNode[] | undefined
        if (Array.isArray(rawBlocks)) {
          blocks = rawBlocks
        } else if (rawBlocks && typeof rawBlocks === 'object') {
          const ids = Array.isArray(order) && order.length ? order : Object.keys(rawBlocks)
          blocks = ids
            .filter((bid) => rawBlocks[bid])
            .map((bid) => ({ ...rawBlocks[bid], id: rawBlocks[bid].id ?? bid }))
        }
        setTree((t) =>
          t.map((n) =>
            n.id === id
              ? { ...n, settings: { ...n.settings, ...s }, ...(blocks ? { blocks } : {}) }
              : n,
          ),
        )
      } else if (e.data.type === 'tanqory-preview-select') {
        const id = e.data.sectionId as string
        // Optional: the editor also names the BLOCK inside that section, so the
        // outline can land on the block the merchant actually picked rather
        // than on its parent. Absent for a plain section selection.
        const blockId = (e.data.blockId as string | null) ?? null
        setTree((t) => { const i = t.findIndex((n) => n.id === id); setSelected(i >= 0 ? [i] : null); return t })
        // Scroll the canvas to the clicked section (editor tree → preview, like
        // the commerce standard). The section wrapper is `display:contents` (no layout box), so
        // scroll its first real child element into view instead.
        if (typeof document !== 'undefined' && id) {
          const sel = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id
          requestAnimationFrame(() => {
            const wrap = document.querySelector<HTMLElement>(`[data-tq-section-id="${sel}"]`)
            const target = (wrap?.firstElementChild as HTMLElement | null) ?? wrap
            // Always scroll to the SECTION: a block sits inside it, and scrolling
            // to the block alone can leave the merchant with no idea which section
            // they are in.
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            // Selecting a row in the editor's tree used to scroll the canvas and
            // leave it looking untouched: the outline was painted only by a click
            // INSIDE the canvas, so the highlight ran one way. Both directions now
            // land on the same overlay.
            const blockSel =
              blockId && typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(blockId) : blockId
            const blockEl = blockSel
              ? wrap?.querySelector<HTMLElement>(`[data-tq-section-id="${blockSel}"]`)
              : null
            paintSelection(blockEl ?? wrap)
          })
        }
      } else if (e.data.type === 'tanqory-preview-reorder-sections') {
        // Reorder the EXISTING nodes in place (same object refs, keyed by id)
        // so React moves the DOM instead of rebuilding the whole tree — this is
        // what kills the flicker on drag/swap. A full `tq:set-content` would
        // re-mount every section. Any node the editor didn't list is preserved.
        const order = e.data.order as string[]
        if (Array.isArray(order)) {
          setTree((t) => {
            const byId = new Map(t.map((n) => [n.id, n]))
            const next = order.map((id) => byId.get(id)).filter(Boolean) as ContentNode[]
            for (const n of t) if (!order.includes(n.id as string)) next.push(n)
            return next.length ? next : t
          })
        }
      } else if (e.data.type === 'tanqory-preview-remove-section') {
        const id = e.data.sectionId as string
        setTree((t) => t.filter((n) => n.id !== id))
      } else if (e.data.type === 'tanqory-preview-insert-section') {
        // Splice ONE new node in after `afterSectionId` (or at the top) — no
        // full-tree replace. Blocks arrive as the editor's id-map + order array;
        // convert to theme-kit's array shape (same as update-section).
        const id = e.data.sectionId as string
        const rawBlocks = e.data.blocks as Record<string, ContentNode> | ContentNode[] | null
        const order = e.data.order as string[] | null
        let blocks: ContentNode[] | undefined
        if (Array.isArray(rawBlocks)) {
          blocks = rawBlocks
        } else if (rawBlocks && typeof rawBlocks === 'object') {
          const ids = Array.isArray(order) && order.length ? order : Object.keys(rawBlocks)
          blocks = ids
            .filter((bid) => rawBlocks[bid])
            .map((bid) => ({ ...rawBlocks[bid], id: rawBlocks[bid].id ?? bid }))
        }
        const node: ContentNode = {
          id,
          type: e.data.sectionType as string,
          settings: (e.data.settings ?? {}) as Record<string, unknown>,
          ...(blocks ? { blocks } : {}),
        }
        const after = e.data.afterSectionId as string | null
        setTree((t) => {
          if (t.some((n) => n.id === id)) return t
          const idx = after ? t.findIndex((n) => n.id === after) : -1
          const next = [...t]
          next.splice(idx + 1, 0, node)
          return next
        })
      } else if (e.data.type === 'tanqory-request-collections') {
        // Editor needs to populate a `type: 'collection'` picker — reply with
        // every collection the bootstrap query loaded so the merchant sees
        // their actual storefront catalogue, not a typed-in handle.
        const collections = data.allCollections().map((c) => ({
          handle: c.handle,
          title: c.title,
          productCount: c.products.length,
        }))
        send({ type: 'tanqory-collections', requestId: e.data.requestId ?? null, collections })
      } else if (e.data.type === 'tanqory-request-menus') {
        // Editor needs to populate a `type: 'link_list'` picker — reply with
        // every menu the store has (Dashboard → Navigation), so the merchant
        // picks a real menu instead of typing a handle.
        const requestId = e.data.requestId ?? null
        void Promise.resolve(data.listMenus?.() ?? [])
          .then((menus) => send({ type: 'tanqory-menus', requestId, menus }))
          .catch(() => send({ type: 'tanqory-menus', requestId, menus: [] }))
      } else if (e.data.type === 'tanqory-request-products') {
        // Same idea as collections — flatten every product across collections,
        // dedupe by handle (first occurrence wins, matching SectionTree's
        // canonical-handle rule), and hand the editor enough metadata to
        // render a search/filter picker without a second round-trip.
        const seen = new Set<string>()
        const products: Array<{ handle: string; title: string; price: string; image: string | null }> = []
        for (const c of data.allCollections()) {
          for (const p of c.products) {
            if (seen.has(p.handle)) continue
            seen.add(p.handle)
            products.push({
              handle: p.handle,
              title: p.title,
              price: p.price?.amount ?? '',
              image: p.featuredImage?.url ?? null,
            })
          }
        }
        send({ type: 'tanqory-products', requestId: e.data.requestId ?? null, products })
      }
    }
    window.addEventListener('message', onMsg)
    send({ type: 'tq:ready', pages: Object.keys(pages) })
    return () => window.removeEventListener('message', onMsg)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The overlay lives in the document, not in React's tree — it has to outlive
  // a re-render of the section it describes — so the component only has to take
  // it down when the canvas unmounts.
  useEffect(() => clearAll, [])

  /**
   * Outline a node wrapper. The wrapper is `display: contents` and has no box of
   * its own, so the overlay describes its first rendered child; a section that
   * renders nothing has nothing to outline and is skipped.
   */
  /**
   * The editor draws FloatingControls (artifact 29) over the canvas at the
   * selection — it cannot see inside this frame, so the rect is posted out,
   * in this frame's viewport coordinates, and again whenever the page
   * scrolls or resizes while something is selected. `null` clears it.
   */
  const paintedRef = useRef<HTMLElement | null>(null)
  const sendRect = (el: HTMLElement | null) => {
    if (!el) { send({ type: 'tanqory-selection-rect', rect: null }); return }
    const r = el.getBoundingClientRect()
    send({ type: 'tanqory-selection-rect', rect: { top: r.top, left: r.left, width: r.width, height: r.height } })
  }
  useEffect(() => {
    const onMove = () => { if (paintedRef.current) sendRect(paintedRef.current) }
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => { window.removeEventListener('scroll', onMove, true); window.removeEventListener('resize', onMove) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const paintSelection = (wrap: HTMLElement | null | undefined) => {
    if (!wrap) { paintedRef.current = null; sendRect(null); return clearAll() }
    const box = (wrap.firstElementChild as HTMLElement | null) ?? wrap
    // The SAME box the outline is drawn on — the wrapper itself is often
    // `display: contents` and measures 0×0, which put the controls off-screen.
    paintedRef.current = box
    sendRect(box)
    const isBlock = (wrap.dataset.tqPath ?? '').includes('.')
    // A selected block also shows its parent section, dashed: a block can be
    // small and identical to its siblings, and "which section is this in" is
    // the question the outline alone does not answer.
    const parentWrap = isBlock
      ? wrap.parentElement?.closest<HTMLElement>('[data-tq-section-id]')
      : null
    const parentBox = (parentWrap?.firstElementChild as HTMLElement | null) ?? parentWrap
    showSelection(
      box,
      labelForType(wrap.dataset.tqSectionType, isBlock ? 'Block' : 'Section'),
      isBlock ? 'block' : 'section',
      parentBox,
    )
  }

  /**
   * Hover feedback: what a click would select. The canvas is a live storefront,
   * so the thing under the pointer is often a link or a button that does
   * something else entirely — showing its bounds first is what makes clicking
   * predictable rather than a guess.
   *
   * Pointer events only. A touch device has no hover, and firing this on a tap
   * would paint a box the finger then immediately replaces with a selection.
   */
  const onPointerOver = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const wrap = (e.target as HTMLElement).closest<HTMLElement>('[data-tq-section-id]')
    if (!wrap) return clearHover()
    showHover((wrap.firstElementChild as HTMLElement | null) ?? wrap)
  }

  // Click any element inside a rendered section → report its identity so the
  // editor can highlight the matching row in the tree and surface its
  // settings panel. We send BOTH the legacy `tq:select` (with path) and the
  // editor's `tanqory-section-selected` (with sectionId) — the editor side
  // only listens to the latter, but external tooling may still be on tq:.
  //
  // Preview-mode click handling also short-circuits internal navigation:
  // anchors inside a section would otherwise pull the iframe off the page
  // the editor is editing. Section CTAs become "select this" while the
  // editor is open.
  const onClickCapture = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    // The innermost wrapper is the node actually clicked — a child BLOCK when the
    // click lands inside one (RenderNode wraps every node), otherwise the section.
    const nodeEl = target.closest<HTMLElement>('[data-tq-section-id]')
    if (!nodeEl) return
    const nodeId = nodeEl.dataset.tqSectionId
    const pathAttr = nodeEl.dataset.tqPath
    if (target.closest('a, button[type="submit"]')) {
      e.preventDefault()
    }
    // Visible selection feedback ON THE CANVAS. The node wrapper is
    // display:contents (no box of its own), so describe its first rendered child.
    // This is what makes a canvas click feel like an outline-tree selection.
    paintSelection(nodeEl)
    if (pathAttr) {
      const path = pathAttr.split('.').map(Number)
      setSelected(path)
      send({ type: 'tq:select', path })
    }
    // A nested path (e.g. "3.1") means a child BLOCK was clicked — select it
    // WITHIN its parent section so the editor opens the block's settings, not the
    // whole section's. The parent section is the node at the path's first segment.
    // blockId is the block's id (data-tq-section-id), which the editor keys blocks
    // by — so it resolves to the same block the outline + settings panel use.
    const container = e.currentTarget as HTMLElement
    const isBlock = !!pathAttr && pathAttr.includes('.')
    if (isBlock && nodeId) {
      const sectionPath = (pathAttr as string).split('.')[0]
      const sectionEl =
        container.querySelector<HTMLElement>(`[data-tq-path="${sectionPath}"]`) ??
        nodeEl.parentElement?.closest<HTMLElement>('[data-tq-section-id]')
      const sectionId = sectionEl?.dataset.tqSectionId
      if (sectionId) {
        send({ type: 'tanqory-block-selected', sectionId, blockId: nodeId })
        return
      }
    }
    if (nodeId) {
      send({ type: 'tanqory-section-selected', sectionId: nodeId })
    }
  }

  return (
    <div
      onClickCapture={onClickCapture}
      onPointerOver={onPointerOver}
      onPointerLeave={clearHover}
      data-tq-selected={selected?.join('.') ?? ''}
    >
      <Shell>
        <SectionTree tree={tree} />
      </Shell>
    </div>
  )
}
