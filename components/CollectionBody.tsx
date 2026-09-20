/**
 * CollectionBody — filters, sort, grid and pagination for a collection.
 *
 * Both `product-grid` (the design's collection page body) and
 * `main-collection` (Nova's URL-driven collection page, which the design does
 * not cover) render this. They differ only in how they resolve WHICH
 * collection to show: `product-grid` takes a merchant setting, `main-collection`
 * reads the route. Everything after that is identical, so it lives here rather
 * than in two copies that drift.
 */
import { useCallback, useRef, useEffect, useMemo, useState } from 'react'
import { useData, useT } from '@tanqory/theme-kit'
import { ProductGrid as CardGrid, ProductGridEmpty } from './ProductGrid'
import { ProductCardSkeleton, toCard, type ProductCardData } from './ProductCard'
import { Button } from './Button'
import { StateBlock } from './StateBlock'
import { Pagination } from './Disclosure'
import {
  CollectionFilters,
  CollectionToolbar,
  applyFilters,
  deriveFacets,
  toSortKey,
  type AppliedFilters,
  type SortValue,
} from './CollectionToolbar'

export interface CollectionBodyOptions {
  columns?: 3 | 4
  mobileColumns?: 1 | 2
  filterLayout?: 'sidebar' | 'drawer' | 'none'
  showSort?: boolean
  showCount?: boolean
  pagination?: 'load-more' | 'pages'
  productsPerPage?: number
  showQuickAdd?: boolean
}

export function CollectionBody({
  handle,
  /** Products already in the bootstrap cache — paints before the fetch lands. */
  seed = [],
  onResolve,
  columns = 3,
  mobileColumns = 2,
  filterLayout = 'sidebar',
  showSort = true,
  showCount = true,
  pagination: paginationMode = 'load-more',
  productsPerPage = 24,
  showQuickAdd,
}: {
  handle: string
  seed?: ProductCardData[]
  /**
   * Reports what the fetch found. `main-collection` needs this to tell a
   * collection that DOES NOT EXIST from one that is merely empty — the two
   * look identical from inside this component but must not read the same to a
   * shopper who mistyped a URL.
   */
  onResolve?: (state: { settled: boolean; failed: boolean; count: number }) => void
} & CollectionBodyOptions): JSX.Element {
  const { collectionProducts } = useData()
  const t = useT()

  const [sort, setSort] = useState<SortValue>('manual')
  const [applied, setApplied] = useState<AppliedFilters>({})
  const [pages, setPages] = useState<ProductCardData[][]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [page, setPage] = useState(1)

  /**
   * Generation counter for in-flight requests.
   *
   * Without it, changing sort while a request was open let whichever response
   * landed last win: pick "Price, low to high" then "Title A–Z", and if the
   * price response arrived second it overwrote the newer result — the grid in
   * price order while the control read "Title A–Z", and `cursor`/`hasNext`
   * corrupted so every later "Load more" pulled from the wrong cursor.
   */
  const requestId = useRef(0)

  const load = useCallback(
    async (after: string | null) => {
      if (!collectionProducts) return
      const id = ++requestId.current
      setLoading(true)
      setFailed(false)
      try {
        const { sortKey, reverse } = toSortKey(sort)
        const res = await collectionProducts(handle, {
          first: productsPerPage,
          sortKey,
          reverse,
          ...(after ? { after } : {}),
        })
        if (id !== requestId.current) return
        const cards = res.products.map(toCard)
        setPages((prev) => (after ? [...prev, cards] : [cards]))
        setCursor(res.pageInfo?.endCursor ?? null)
        setHasNext(Boolean(res.pageInfo?.hasNextPage))
      } catch (err: unknown) {
        if (id !== requestId.current) return
        // eslint-disable-next-line no-console
        console.error(`[nova] collectionProducts(${handle}) failed:`, err)
        setFailed(true)
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    },
    [collectionProducts, handle, productsPerPage, sort],
  )

  // Changing sort restarts paging: appending a differently-sorted page to the
  // previous one produces a list that is in no order at all.
  useEffect(() => {
    setPages([])
    setCursor(null)
    setHasNext(false)
    setFailed(false)
    setPage(1)
    void load(null)
  }, [load])

  const loaded = pages.flat()
  /**
   * `seed` is the bootstrap cache, and it is the right thing to show on first
   * paint while the real request is still open. It is NOT the right thing to
   * show after that request has failed: falling back to it showed stale
   * products with a wrong count, reported `count > 0` to `onResolve`, and made
   * the error branch below unreachable for any collection the bootstrap knew.
   */
  const fetched = loaded.length > 0 ? loaded : failed ? [] : seed

  /**
   * Order what is on screen.
   *
   * The request already carries `sortKey`/`reverse`, but the storefront
   * currently returns the same order whatever is asked for — verified against
   * the live store: default, PRICE, TITLE and PRICE+reverse all come back
   * identical. Without this the Sort control would be a menu that changes
   * nothing. Sorting here orders the products the shopper can actually see;
   * once the backend honours the arguments this simply agrees with it.
   */
  const all = useMemo(() => {
    if (sort === 'manual' || sort === 'best-selling') return fetched
    const out = [...fetched]
    const amount = (c: ProductCardData): number => Number(c.price?.amount ?? 0)
    if (sort === 'title-asc') out.sort((a, b) => a.title.localeCompare(b.title))
    else if (sort === 'title-desc') out.sort((a, b) => b.title.localeCompare(a.title))
    else if (sort === 'price-asc') out.sort((a, b) => amount(a) - amount(b))
    else if (sort === 'price-desc') out.sort((a, b) => amount(b) - amount(a))
    return out
  }, [fetched, sort])

  const facets = useMemo(() => (filterLayout === 'none' ? [] : deriveFacets(all)), [all, filterLayout])
  const filtered = useMemo(() => applyFilters(all, applied), [all, applied])

  /**
   * In `pages` mode the slice is taken from the SORTED, filtered list, not from
   * the raw fetch order. Slicing `pages[page - 1]` preserved the order the
   * backend returned, so — because the storefront ignores `sortKey` (see the
   * note on `all` above) — choosing a sort changed nothing at all in pages
   * mode, while load-more mode sorted correctly.
   */
  const visible =
    paginationMode === 'pages'
      ? filtered.slice((page - 1) * productsPerPage, page * productsPerPage)
      : filtered
  const pageCount = paginationMode === 'pages' ? pages.length + (hasNext ? 1 : 0) : 1

  // The sidebar only appears from 1024 up; below that the same filters live in
  // the drawer the toolbar button opens.
  const [wide, setWide] = useState(false)
  useEffect(() => {
    // Feature-detected, not assumed: `matchMedia` is absent in some rendering
    // environments, and reaching for it unguarded threw before the grid ever
    // painted — taking the whole collection page down with it.
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = (): void => setWide(mq.matches)
    sync()
    // Safari below 14 only has the deprecated listener API.
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', sync)
      return () => mq.removeEventListener('change', sync)
    }
    mq.addListener(sync)
    return () => mq.removeListener(sync)
  }, [])

  const settled = pages.length > 0 || failed || !collectionProducts
  const hasFilters = Object.values(applied).some((v) => v.length > 0)

  useEffect(() => {
    onResolve?.({ settled, failed, count: all.length })
  }, [onResolve, settled, failed, all.length])

  return (
    <>
      <CollectionToolbar
        total={filtered.length}
        showCount={showCount}
        showSort={showSort}
        sort={sort}
        onSortChange={setSort}
        facets={facets}
        applied={applied}
        onAppliedChange={setApplied}
        filterLayout={filterLayout}
        sidebarVisible={filterLayout === 'sidebar' && facets.length > 0 && wide}
      />

      <div className="collection-body" data-filters={filterLayout}>
        {/* The sidebar has to be a CHILD of this grid — the grid reserves a
            260px track for it. Rendering it above the grid (as the toolbar
            used to) left that track empty and squeezed the products into it. */}
        {filterLayout === 'sidebar' && (
          <CollectionFilters facets={facets} applied={applied} onAppliedChange={setApplied} />
        )}
        <div className="collection-body__results">
          {!settled && loading ? (
            // Skeletons at the card's FINAL ratio, so nothing reflows when the
            // real products arrive.
            <div
              className="product-grid"
              data-columns={columns}
              data-mobile-columns={mobileColumns}
              aria-busy="true"
            >
              {Array.from({ length: Math.min(productsPerPage, 8) }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : failed && all.length === 0 ? (
            /* A failed request is NOT an empty collection: saying "no products"
               when the fetch errored tells the shopper the store is bare. */
            <StateBlock
              tone="error"
              title={t('collection.failed')}
              ctaLabel={t('product.retry')}
              onCta={() => void load(null)}
            />
          ) : visible.length === 0 ? (
            <ProductGridEmpty
              {...(hasFilters ? { title: 'No products match these filters' } : {})}
              message={hasFilters ? 'Try removing a filter to see more.' : t('collection.empty')}
              {...(hasFilters ? { actionLabel: 'Clear filters', onAction: () => setApplied({}) } : {})}
            />
          ) : (
            <CardGrid
              products={visible}
              columns={columns}
              mobileColumns={mobileColumns}
              {...(showQuickAdd === undefined ? {} : { showQuickAdd })}
            />
          )}

          {paginationMode === 'load-more' && hasNext && (
            <div className="collection-body__more">
              <p className="u-text-muted">
                Showing {visible.length} of {filtered.length}+
              </p>
              {/* The design pairs the count with a progress bar so the shopper
                  can see how much of the collection is left. */}
              <div
                className="collection-body__progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={filtered.length}
                aria-valuenow={visible.length}
              >
                <span style={{ width: `${Math.min(100, (visible.length / Math.max(filtered.length, 1)) * 100)}%` }} />
              </div>
              <Button
                label={loading ? t('product.loading') : 'Load more products'}
                variant="secondary"
                disabled={loading}
                onClick={() => void load(cursor)}
              />
            </div>
          )}

          {paginationMode === 'pages' && (
            <Pagination
              page={page}
              pageCount={pageCount}
              onChange={(p) => {
                setPage(p)
                // That page has not been fetched yet — pull the next slice.
                // `loading` guards a double click: without it two requests went
                // out on the SAME cursor and `setPages` appended the identical
                // slice twice, duplicating products and React keys and adding a
                // phantom page to the count.
                if (p > pages.length && hasNext && !loading) void load(cursor)
              }}
            />
          )}
        </div>
      </div>
    </>
  )
}
