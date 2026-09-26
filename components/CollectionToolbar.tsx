import { useT } from '../lib/tanqory/index'
/**
 * CollectionToolbar — result count, sort and filters.
 *
 * Shared by `product-grid` and `main-collection` so the collection page body
 * behaves identically wherever it is composed from. The design gives filters
 * three homes (`sidebar`, `drawer`, `none`) and pins the mobile toolbar as
 * sticky.
 *
 * Facet DISCOVERY is derived client-side from the products already loaded —
 * `collectionProducts` accepts a `filters` argument but returns no facet list,
 * so there is nothing authoritative to render a sidebar from. Deriving them is
 * honest about that: the options shown are exactly the ones present in the
 * loaded results. That is a real limitation and is documented rather than
 * papered over with a hardcoded facet list.
 */
import { useMemo, useState } from 'react'
import { Chip } from './Chip'
import { Drawer } from './Drawer'
import { Popover } from './Overlays'
import { Accordion } from './Disclosure'
import { Checkbox } from './Field'
import type { ProductCardData } from './ProductCard'

export type SortValue =
  | 'manual'
  | 'best-selling'
  | 'title-asc'
  | 'title-desc'
  | 'price-asc'
  | 'price-desc'
  | 'created-desc'

export const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: 'manual', label: 'Featured' },
  { value: 'best-selling', label: 'Best selling' },
  { value: 'title-asc', label: 'Alphabetically, A–Z' },
  { value: 'title-desc', label: 'Alphabetically, Z–A' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'created-desc', label: 'Date, new to old' },
]

/** Maps the merchant-facing sort to the storefront API's key + direction. */
export function toSortKey(sort: SortValue): {
  sortKey: 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED' | 'MANUAL' | 'COLLECTION_DEFAULT'
  reverse: boolean
} {
  switch (sort) {
    case 'best-selling':
      return { sortKey: 'BEST_SELLING', reverse: false }
    case 'title-asc':
      return { sortKey: 'TITLE', reverse: false }
    case 'title-desc':
      return { sortKey: 'TITLE', reverse: true }
    case 'price-asc':
      return { sortKey: 'PRICE', reverse: false }
    case 'price-desc':
      return { sortKey: 'PRICE', reverse: true }
    case 'created-desc':
      return { sortKey: 'CREATED', reverse: true }
    default:
      return { sortKey: 'MANUAL', reverse: false }
  }
}

export interface Facet {
  key: string
  label: string
  values: { value: string; count: number }[]
}

/** Derives vendor / type / tag facets from the products on screen. */
export function deriveFacets(products: ProductCardData[]): Facet[] {
  const groups: { key: string; label: string; pick: (p: ProductCardData) => string[] }[] = [
    { key: 'vendor', label: 'Brand', pick: (p) => (p.vendor ? [p.vendor] : []) },
    { key: 'productType', label: 'Type', pick: (p) => (p.productType ? [p.productType] : []) },
    { key: 'tag', label: 'Tag', pick: (p) => p.tags ?? [] },
  ]
  return groups
    .map(({ key, label, pick }) => {
      const counts = new Map<string, number>()
      for (const p of products) for (const v of pick(p)) counts.set(v, (counts.get(v) ?? 0) + 1)
      return {
        key,
        label,
        values: [...counts.entries()]
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
      }
    })
    // A facet with one value filters nothing — it only adds noise.
    .filter((f) => f.values.length > 1)
}

export type AppliedFilters = Record<string, string[]>

export function applyFilters(products: ProductCardData[], applied: AppliedFilters): ProductCardData[] {
  const active = Object.entries(applied).filter(([, v]) => v.length > 0)
  if (active.length === 0) return products
  return products.filter((p) =>
    active.every(([key, values]) => {
      if (key === 'vendor') return p.vendor ? values.includes(p.vendor) : false
      if (key === 'productType') return p.productType ? values.includes(p.productType) : false
      if (key === 'tag') return (p.tags ?? []).some((t) => values.includes(t))
      return true
    }),
  )
}

/**
 * The filter sidebar, rendered SEPARATELY from the toolbar.
 *
 * It used to be returned inside the toolbar's fragment, which put it *before*
 * the results grid rather than inside it — so the 260px sidebar track the grid
 * reserved was always empty and the products were squeezed into it. At 1440
 * that made every product card 71px wide on every collection page.
 */
export function CollectionFilters({
  facets,
  applied,
  onAppliedChange,
}: {
  facets: Facet[]
  applied: AppliedFilters
  onAppliedChange: (a: AppliedFilters) => void
}): JSX.Element | null {
  const t = useT()
  if (facets.length === 0) return null
  const anyApplied = Object.values(applied).some((v) => v.length > 0)
  return (
    <aside className="collection-filters" aria-label={t('collection.filters')}>
      <div className="collection-filters__head">
        <h2 className="collection-filters__title">{t('collection.filter')}</h2>
        {anyApplied && (
          <button type="button" className="btn btn--link btn--sm" onClick={() => onAppliedChange({})}>
            Clear all
          </button>
        )}
      </div>
      <FacetGroups facets={facets} applied={applied} onAppliedChange={onAppliedChange} />
    </aside>
  )
}

/** The accordion of facet groups, shared by the sidebar and the mobile drawer. */
function FacetGroups({
  facets,
  applied,
  onAppliedChange,
}: {
  facets: Facet[]
  applied: AppliedFilters
  onAppliedChange: (a: AppliedFilters) => void
}): JSX.Element {
  const toggle = (key: string, value: string): void => {
    const cur = applied[key] ?? []
    onAppliedChange({
      ...applied,
      [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
    })
  }
  return (
    <Accordion
      singleOpen={false}
      defaultOpen={facets.map((f) => f.key)}
      items={facets.map((f) => ({
        id: f.key,
        title: f.label,
        body: (
          <div className="facet__values">
            {f.values.map((v) => (
              <Checkbox
                key={v.value}
                label={`${v.value} (${v.count})`}
                checked={(applied[f.key] ?? []).includes(v.value)}
                onChange={() => toggle(f.key, v.value)}
              />
            ))}
          </div>
        ),
      }))}
    />
  )
}

export function CollectionToolbar({
  total,
  showCount = true,
  showSort = true,
  sort,
  onSortChange,
  facets = [],
  applied,
  onAppliedChange,
  filterLayout = 'sidebar',
  sidebarVisible = false,
}: {
  total: number
  showCount?: boolean
  showSort?: boolean
  sort: SortValue
  onSortChange: (s: SortValue) => void
  facets?: Facet[]
  applied: AppliedFilters
  onAppliedChange: (a: AppliedFilters) => void
  filterLayout?: 'sidebar' | 'drawer' | 'none'
  /**
   * True when the sidebar is showing beside the results. The toolbar's Filter
   * button opens the drawer, so it would be a duplicate control. CSS cannot
   * work this out on its own — the sidebar is in a sibling element, not a
   * descendant of the toolbar.
   */
  sidebarVisible?: boolean
}): JSX.Element {
  const t = useT()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const appliedList = useMemo(
    () => Object.entries(applied).flatMap(([key, values]) => values.map((value) => ({ key, value }))),
    [applied],
  )

  const toggle = (key: string, value: string): void => {
    const cur = applied[key] ?? []
    onAppliedChange({
      ...applied,
      [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
    })
  }

  const groups = <FacetGroups facets={facets} applied={applied} onAppliedChange={onAppliedChange} />

  return (
    <>
      <div className="collection-toolbar">
        {showCount && (
          <p className="collection-toolbar__count" aria-live="polite">
            {total} {total === 1 ? 'product' : 'products'}
          </p>
        )}
        <div className="collection-toolbar__actions">
          {filterLayout !== 'none' && facets.length > 0 && !sidebarVisible && (
            <button
              type="button"
              className="btn btn--secondary btn--sm collection-toolbar__filter-btn"
              onClick={() => setDrawerOpen(true)}
            >
              Filter{appliedList.length > 0 ? ` (${appliedList.length})` : ''}
            </button>
          )}
          {showSort && (
            <Popover
              label={t('collection.sortProducts')}
              align="end"
              trigger={({ props }) => (
                <button type="button" className="btn btn--secondary btn--sm" {...props}>
                  Sort: {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                </button>
              )}
            >
              <div className="sort-menu">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={`sort-menu__item${o.value === sort ? ' is-active' : ''}`}
                    aria-current={o.value === sort}
                    onClick={() => onSortChange(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </Popover>
          )}
        </div>
      </div>

      {appliedList.length > 0 && (
        <div className="applied-filters">
          {appliedList.map(({ key, value }) => (
            <Chip key={`${key}-${value}`} label={value} selected onRemove={() => toggle(key, value)} />
          ))}
          <button type="button" className="btn btn--link btn--sm" onClick={() => onAppliedChange({})}>
            Clear all
          </button>
        </div>
      )}

      <Drawer open={drawerOpen} side="left" ariaLabel="Filters" onClose={() => setDrawerOpen(false)}>
        <div className="drawer__header">
          <h2>{t('collection.filter')}</h2>
          <button type="button" className="drawer__close" aria-label={t('common.close')} onClick={() => setDrawerOpen(false)}>
            ×
          </button>
        </div>
        <div className="drawer__body">{groups}</div>
        <div className="drawer__footer">
          <button type="button" className="btn btn--primary btn--block" onClick={() => setDrawerOpen(false)}>
            Show {total} {total === 1 ? 'result' : 'results'}
          </button>
        </div>
      </Drawer>
    </>
  )
}
