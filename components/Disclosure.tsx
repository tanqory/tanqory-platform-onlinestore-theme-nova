import { useT } from '../lib/tanqory/index'
/**
 * Accordion, Tabs, Breadcrumb, Pagination — the four disclosure/navigation
 * primitives. Grouped in one file because they share the same keyboard
 * contract and the theme had none of them.
 */
import { createContext, type ReactNode, useContext, useId, useRef, useState } from 'react'

/* ── Accordion ────────────────────────────────────────────────────────── */

export interface AccordionItem {
  id: string
  title: string
  body: ReactNode
}

/**
 * Whole row is the button and the chevron rotates 180°, per the design.
 * Multiple open is the default; `singleOpen` is the FAQ's opt-in.
 *
 * Built on `<details>` when multiple-open, so it keeps working before hydration
 * and with JS off. Single-open needs coordination, so that mode is controlled.
 */
export function Accordion({
  items,
  singleOpen = false,
  defaultOpen = [],
  landmarks = false,
}: {
  items: AccordionItem[]
  singleOpen?: boolean
  /** Ids open on first render. */
  defaultOpen?: string[]
  /**
   * Expose each panel as a `region` landmark.
   *
   * OFF by default. APG advises against `role="region"` where it would create
   * landmark proliferation, and the collection filters render the same facet
   * accordion twice — once in the sidebar, once in the mobile drawer — so
   * every facet became two identically-named page landmarks. Turn it on for a
   * content accordion whose panels are few and uniquely titled.
   */
  landmarks?: boolean
}): JSX.Element {
  const [open, setOpen] = useState<string[]>(defaultOpen)

  const toggle = (id: string): void =>
    setOpen((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : singleOpen ? [id] : [...cur, id],
    )

  // Two accordions built from the same item list — the collection filters
  // render one in the sidebar and one in the mobile drawer — produced the
  // same DOM ids twice, so `aria-controls` pointed at whichever came first.
  const uid = useId()

  return (
    <div className="accordion">
      {items.map((item) => {
        const isOpen = open.includes(item.id)
        return (
          <div className="accordion__item" key={item.id}>
            <h3 className="accordion__heading">
              <button
                type="button"
                className="accordion__trigger"
                aria-expanded={isOpen}
                aria-controls={`${uid}-${item.id}-panel`}
                id={`${uid}-${item.id}-trigger`}
                onClick={() => toggle(item.id)}
              >
                <span>{item.title}</span>
                <span className="accordion__chevron" aria-hidden />
              </button>
            </h3>
            <div
              className="accordion__panel"
              id={`${uid}-${item.id}-panel`}
              {...(landmarks
                ? { role: 'region', 'aria-labelledby': `${uid}-${item.id}-trigger` }
                : {})}
              hidden={!isOpen}
            >
              <div className="accordion__body">{item.body}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Tabs ─────────────────────────────────────────────────────────────── */

/**
 * Underline tabs for content, segmented for view switching. Arrow keys move
 * focus AND selection (the tab pattern's "automatic activation"), and the list
 * scrolls horizontally on mobile rather than wrapping to two rows.
 */
/**
 * Scopes a tab set's DOM ids.
 *
 * `Tabs` and `TabPanel` built ids straight from the raw tab id — `all-tab`,
 * `all-panel` — unlike `Accordion`, where the same bug was already fixed with
 * `useId`. Two tab sets on one page sharing an id such as `all` produced
 * duplicate ids, so `aria-controls` / `aria-labelledby` resolved to the first
 * set's panel for both. Wrap a tab set in `TabScope` to isolate it; a lone set
 * works unwrapped.
 */
const TabScopeContext = createContext('')

export function TabScope({ children }: { children: ReactNode }): JSX.Element {
  const uid = useId()
  return <TabScopeContext.Provider value={uid}>{children}</TabScopeContext.Provider>
}

export function Tabs({
  tabs,
  active,
  onChange,
  variant = 'underline',
  label = 'Tabs',
}: {
  tabs: { id: string; label: string; count?: number }[]
  active: string
  onChange: (id: string) => void
  variant?: 'underline' | 'segmented'
  label?: string
}): JSX.Element {
  const scope = useContext(TabScopeContext)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  const onKeyDown = (e: React.KeyboardEvent): void => {
    const i = tabs.findIndex((t) => t.id === active)
    let next = i
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    else return
    e.preventDefault()
    const id = tabs[next]!.id
    onChange(id)
    refs.current[id]?.focus()
  }

  return (
    <div className={`tabs tabs--${variant}`} role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map((t) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[t.id] = el
          }}
          type="button"
          role="tab"
          id={`${scope}${t.id}-tab`}
          aria-selected={t.id === active}
          aria-controls={`${scope}${t.id}-panel`}
          tabIndex={t.id === active ? 0 : -1}
          className="tabs__tab"
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count !== undefined && <span className="tabs__count">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function TabPanel({
  id,
  active,
  children,
}: {
  id: string
  active: string
  children: ReactNode
}): JSX.Element {
  const scope = useContext(TabScopeContext)
  return (
    <div
      role="tabpanel"
      id={`${scope}${id}-panel`}
      aria-labelledby={`${scope}${id}-tab`}
      hidden={id !== active}
      tabIndex={0}
    >
      {id === active && children}
    </div>
  )
}

/* ── Breadcrumb ───────────────────────────────────────────────────────── */

/** Mobile collapses to "‹ Parent" only — the full trail never wraps. */
export function Breadcrumb({
  trail,
}: {
  trail: { label: string; href?: string }[]
}): JSX.Element | null {
  const t = useT()
  if (trail.length === 0) return null
  const parent = trail.length > 1 ? trail[trail.length - 2] : undefined
  return (
    <nav className="breadcrumb" aria-label={t('common.breadcrumb')}>
      <ol className="breadcrumb__list">
        {trail.map((c, i) => {
          const last = i === trail.length - 1
          return (
            <li className="breadcrumb__item" key={`${c.label}-${i}`}>
              {c.href && !last ? <a href={c.href}>{c.label}</a> : <span aria-current="page">{c.label}</span>}
              {!last && (
                <span className="breadcrumb__sep" aria-hidden>
                  /
                </span>
              )}
            </li>
          )
        })}
      </ol>
      {parent?.href && (
        <a className="breadcrumb__up" href={parent.href}>
          <span aria-hidden>‹ </span>
          {parent.label}
        </a>
      )}
    </nav>
  )
}

/* ── Pagination ───────────────────────────────────────────────────────── */

/** Collapses to `Prev · 3 / 12 · Next` on mobile rather than shrinking pills. */
export function Pagination({
  page,
  pageCount,
  onChange,
  hrefFor,
}: {
  page: number
  pageCount: number
  onChange?: (page: number) => void
  /** When given, renders real links so the pages are crawlable. */
  hrefFor?: (page: number) => string
}): JSX.Element | null {
  const t = useT()
  if (pageCount <= 1) return null

  // A window around the current page — never every page of a 200-page catalog.
  const pages: (number | '…')[] = []
  for (let p = 1; p <= pageCount; p += 1) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }

  const Cell = ({ p }: { p: number }): JSX.Element =>
    hrefFor ? (
      <a
        className={`pagination__page${p === page ? ' is-current' : ''}`}
        href={hrefFor(p)}
        {...(p === page ? { 'aria-current': 'page' as const } : {})}
      >
        {p}
      </a>
    ) : (
      <button
        type="button"
        className={`pagination__page${p === page ? ' is-current' : ''}`}
        {...(p === page ? { 'aria-current': 'page' as const } : {})}
        onClick={() => onChange?.(p)}
      >
        {p}
      </button>
    )

  return (
    <nav className="pagination" aria-label={t('common.pagination')}>
      <button
        type="button"
        className="pagination__step"
        disabled={page <= 1}
        onClick={() => onChange?.(page - 1)}
      >
        Previous
      </button>
      <div className="pagination__pages">
        {pages.map((p, i) =>
          p === '…' ? (
            <span className="pagination__gap" key={`gap-${i}`} aria-hidden>
              …
            </span>
          ) : (
            <Cell p={p} key={p} />
          ),
        )}
      </div>
      <span className="pagination__compact" aria-hidden>
        {page} / {pageCount}
      </span>
      <button
        type="button"
        className="pagination__step"
        disabled={page >= pageCount}
        onClick={() => onChange?.(page + 1)}
      >
        Next
      </button>
    </nav>
  )
}
