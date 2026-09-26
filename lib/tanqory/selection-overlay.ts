/**
 * The canvas selection overlay — design artifact 28-CanvasSelection.
 *
 * This is the outline the merchant sees on the storefront, and it is the one
 * piece of editor UI that has to be drawn INSIDE the theme's own document: the
 * Studio is a different origin in another frame and cannot paint over this one.
 *
 * Two things it deliberately does NOT do:
 *
 * 1. **It never writes to the merchant's own elements.** The first version set
 *    `style.outline` on whatever element happened to be selected and relied on
 *    remembering to clear it again. A layer of our own cannot leak into the
 *    storefront's styles, and it cannot be lost when React re-renders the node.
 *
 * 2. **It introduces no new hue.** The treatment is a 2px accent line with a 3px
 *    accent-foreground halo just inside it. The pair is the point: a near-black
 *    line alone disappears on a dark hero and a near-white one disappears on a
 *    light page, but the two together read on either — and on a merchant's own
 *    brand colour, which a blue outline was indistinguishable from.
 *
 * Three boxes can be on screen at once, and they say different things:
 *
 * | box       | means                                    | weight        |
 * |-----------|------------------------------------------|---------------|
 * | selection | what the settings panel is editing       | solid, label  |
 * | parent    | the section a selected BLOCK lives in    | dashed, quiet |
 * | hover     | what a click would select instead        | thin, no label|
 *
 * The two colours mirror `--tq-accent` / `--tq-accent-fg` in
 * `@tanqory/editor-ui`. They are literals because a theme is self-contained and
 * cannot import the Studio's stylesheet, and they do not need to follow the
 * Studio's light/dark switch: that switch simply swaps the pair, and the pair is
 * symmetric, so the outline reads the same either way.
 */

const LAYER_ID = 'tq-selection-overlay'

/** Mirrors --tq-accent / --tq-accent-fg. */
const accent = '#14161A'
const accentFg = '#F2F4F7'

export type SelectionKind = 'section' | 'block'
type Role = 'sel' | 'parent' | 'hover'

interface Box {
	el: HTMLElement
	node: HTMLElement
}

/** One entry per role. A role with no entry has no box on screen. */
const boxes = new Map<Role, Box>()
let raf = 0
let observer: ResizeObserver | null = null
let listening = false

const CSS_TEXT = `
#${LAYER_ID} {
	position: fixed;
	inset: 0;
	z-index: 2147483000;
	pointer-events: none;
	contain: strict;
}
#${LAYER_ID} .tq-box {
	position: absolute;
	border-radius: 2px;
}
/* The selection: solid, and the only one that carries a name. */
#${LAYER_ID} .tq-box[data-role='sel'] {
	outline: 2px solid ${accent};
	outline-offset: -2px;
	box-shadow: inset 0 0 0 3px ${accentFg};
}
#${LAYER_ID} .tq-box[data-role='sel'][data-kind='block'] {
	outline-width: 1px;
	outline-offset: -1px;
	box-shadow: inset 0 0 0 2px ${accentFg};
}
/* The parent of a selected block: dashed and quiet. It is context, not a target
   — solid would read as a second selection. */
#${LAYER_ID} .tq-box[data-role='parent'] {
	outline: 1px dashed ${accent};
	outline-offset: -1px;
	box-shadow: inset 0 0 0 2px ${accentFg};
	opacity: 0.55;
}
/* Hover: thinner than the selection, so the two are never mistaken for each
   other when both are on screen. */
#${LAYER_ID} .tq-box[data-role='hover'] {
	outline: 1px solid ${accent};
	outline-offset: -1px;
	box-shadow: inset 0 0 0 2px ${accentFg};
	opacity: 0.8;
}
#${LAYER_ID} .tq-label {
	position: absolute;
	left: 0;
	top: 0;
	transform: translateY(-100%);
	display: inline-flex;
	align-items: center;
	max-width: 100%;
	padding: 2px 6px;
	border-radius: 4px 4px 0 0;
	background: ${accent};
	color: ${accentFg};
	font: 600 11px/1.4 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
	letter-spacing: 0.01em;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
/* A selection flush with the top of the page has nowhere to put the tag above
   it, so it drops inside instead of being clipped off-screen. */
#${LAYER_ID} .tq-box[data-flip='true'] .tq-label {
	transform: none;
	border-radius: 0 0 4px 4px;
}
@media (prefers-reduced-motion: no-preference) {
	#${LAYER_ID} .tq-box[data-role='sel'] {
		transition: top 0.12s ease, left 0.12s ease, width 0.12s ease, height 0.12s ease;
	}
}
`

function layer(): HTMLElement | null {
	if (typeof document === 'undefined') return null
	let el = document.getElementById(LAYER_ID)
	if (el) return el
	el = document.createElement('div')
	el.id = LAYER_ID
	// The overlay describes the canvas; it is not content. A screen reader gets
	// the section from the editor's outline tree instead.
	el.setAttribute('aria-hidden', 'true')
	const style = document.createElement('style')
	style.textContent = CSS_TEXT
	el.appendChild(style)
	document.body.appendChild(el)
	return el
}

/** Title-cases a section type: `image-with-text` → `Image With Text`. */
export function labelForType(type: string | undefined, fallback: string): string {
	if (!type) return fallback
	return type.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function place() {
	raf = 0
	for (const { el, node } of boxes.values()) {
		const r = node.getBoundingClientRect()
		// A node scrolled entirely out of view keeps its last box rather than
		// collapsing to 0,0 — the merchant scrolls back and it is where they left it.
		if (r.width === 0 && r.height === 0) continue
		el.style.top = `${r.top}px`
		el.style.left = `${r.left}px`
		el.style.width = `${r.width}px`
		el.style.height = `${r.height}px`
		// 20px is the tag's own height plus a little; below that there is no room
		// above the box and the tag goes inside it.
		el.dataset.flip = r.top < 20 ? 'true' : 'false'
	}
}

function schedule() {
	if (raf) return
	raf = requestAnimationFrame(place)
}

/**
 * The page can move under a box in three ways: it scrolls, the window resizes,
 * or the node itself changes size because a setting changed. All three have to
 * move it, or it drifts off the thing it is describing.
 */
function watch() {
	if (listening) return
	listening = true
	window.addEventListener('scroll', schedule, { passive: true, capture: true })
	window.addEventListener('resize', schedule, { passive: true })
}

function unwatch() {
	if (!listening) return
	listening = false
	window.removeEventListener('scroll', schedule, { capture: true } as EventListenerOptions)
	window.removeEventListener('resize', schedule)
	if (raf) {
		cancelAnimationFrame(raf)
		raf = 0
	}
}

/** Re-point the ResizeObserver at every node currently being described. */
function reobserve() {
	observer?.disconnect()
	if (typeof ResizeObserver === 'undefined') return
	observer = observer ?? new ResizeObserver(schedule)
	for (const { node } of boxes.values()) observer.observe(node)
}

function setBox(role: Role, node: HTMLElement | null, label?: string, kind?: SelectionKind) {
	const root = layer()
	if (!root) return
	if (!node) return dropBox(role)

	let entry = boxes.get(role)
	if (!entry) {
		const el = document.createElement('div')
		el.className = 'tq-box'
		el.dataset.role = role
		// Only the selection is named. A label on the hover box would flicker
		// across the page as the pointer moves, and a second one beside the
		// selection's reads as two selections.
		if (role === 'sel') {
			const tag = document.createElement('span')
			tag.className = 'tq-label'
			el.appendChild(tag)
		}
		// Painted in this order so the selection sits above its own parent box.
		root.appendChild(el)
		entry = { el, node }
		boxes.set(role, entry)
	}
	entry.node = node
	if (kind) entry.el.dataset.kind = kind
	const tag = entry.el.querySelector<HTMLElement>('.tq-label')
	if (tag && label !== undefined) tag.textContent = label

	watch()
	reobserve()
	place()
}

function dropBox(role: Role) {
	const entry = boxes.get(role)
	if (!entry) return
	entry.el.remove()
	boxes.delete(role)
	reobserve()
	if (boxes.size === 0) unwatch()
}

/**
 * Outline what the settings panel is editing. `parent` is the section a selected
 * BLOCK lives in — pass it so the merchant can see where the block sits.
 *
 * The element is the one that actually has a box: a node wrapper is
 * `display: contents` and has none.
 */
export function showSelection(
	el: HTMLElement | null,
	label: string,
	kind: SelectionKind = 'section',
	parent?: HTMLElement | null,
) {
	if (!el) return clearSelection()
	setBox('parent', kind === 'block' ? (parent ?? null) : null)
	setBox('sel', el, label, kind)
	// Hovering the thing that is already selected says nothing, so the hover box
	// is dropped whenever it would land on the same node.
	if (boxes.get('hover')?.node === el) dropBox('hover')
}

export function clearSelection() {
	dropBox('sel')
	dropBox('parent')
}

/** What a click would select. Never labelled, never on the current selection. */
export function showHover(el: HTMLElement | null) {
	if (!el || boxes.get('sel')?.node === el || boxes.get('parent')?.node === el) {
		return clearHover()
	}
	setBox('hover', el)
}

export function clearHover() {
	dropBox('hover')
}

/** Take the whole overlay down — the canvas is unmounting. */
export function clearAll() {
	dropBox('sel')
	dropBox('parent')
	dropBox('hover')
	observer?.disconnect()
	observer = null
	unwatch()
}
