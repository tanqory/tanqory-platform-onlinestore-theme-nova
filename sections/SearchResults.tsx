import { useEffect, useMemo, useState } from 'react'
import {
  defineSection, useData, useT,
  type Article, type Product, type SectionProps,
} from '@tanqory/theme-kit'
import { ProductGrid as CardGrid } from '../components/ProductGrid'
import { CollectionCard, toCollectionCard } from '../components/CollectionCard'
import { toCard } from '../components/ProductCard'
import { Tabs, TabPanel } from '../components/Disclosure'
import { StateBlock } from '../components/StateBlock'
import { SORT_OPTIONS, type SortValue } from '../components/CollectionToolbar'
import { Popover } from '../components/Overlays'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

/**
 * SEARCH RESULTS — the query page.
 *
 * Products, articles and pages are separate result types with their own tab,
 * per the design. Sorting is applied client-side because the results already
 * come from one loaded catalogue slice; there is no search endpoint with a
 * sort argument to defer to.
 */
export function SearchResults({ attributes }: SectionProps): JSX.Element {
  const { collectionByHandle, allCollections, search } = useData()
  const t = useT()
  const query =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') ?? '' : ''
  const q = query.trim().toLowerCase()

  const resultTypes = ((attributes.resultTypes as string) ?? 'all')
    .split(',')
    .map((x) => x.trim())
  const types = resultTypes.includes('all') ? ['products', 'articles', 'pages'] : resultTypes
  const showTabs = attributes.showTabs !== false && types.length > 1
  const showSort = attributes.showSort !== false
  const columns = (Number(attributes.columns ?? 4) === 3 ? 3 : 4) as 3 | 4
  const suggestHandles = String(attributes.noResultsCollections ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)

  const [tab, setTab] = useState('products')
  const [sort, setSort] = useState<SortValue>('manual')

  /**
   * Real full-text search across products, pages and articles.
   *
   * This used to filter the bootstrap's `all` collection by title in the
   * browser — which finds nothing on a live store, because that collection is
   * not part of the boot payload. The storefront has a proper search endpoint;
   * the bootstrap set is only a fallback for offline/editor preview.
   */
  // Hits carry the query they answered. Without that, a new search kept the
  // previous one's results — and the Articles / Pages tab counts kept the
  // previous one's numbers — until the new request landed.
  const [hits, setHits] = useState<{
    q: string
    products: Product[]
    pages: { handle: string; title: string }[]
    articles: Article[]
  } | null>(null)
  useEffect(() => {
    if (!q || !search) {
      setHits(null)
      return
    }
    let cancelled = false
    void search(query, { first: 48, types: ['PRODUCT', 'PAGE', 'ARTICLE'] })
      .then((r) => {
        if (!cancelled) {
          setHits({ q, products: r.products ?? [], pages: r.pages ?? [], articles: r.articles ?? [] })
        }
      })
      .catch(() => {
        if (!cancelled) setHits({ q, products: [], pages: [], articles: [] })
      })
    return () => {
      cancelled = true
    }
  }, [q, query, search])

  /** Only the hits that answered the query currently in the URL. */
  const fresh = hits && hits.q === q ? hits : null

  const all = collectionByHandle('all')?.products ?? []
  const products = useMemo(() => {
    const hitsList = fresh?.products ?? (q ? all.filter((p) => p.title.toLowerCase().includes(q)) : [])
    const sorted = [...hitsList]
    // Client-side because there is no sortable search endpoint to defer to.
    if (sort === 'title-asc') sorted.sort((a, b) => a.title.localeCompare(b.title))
    else if (sort === 'title-desc') sorted.sort((a, b) => b.title.localeCompare(a.title))
    else if (sort === 'price-asc') sorted.sort((a, b) => Number(a.price.amount) - Number(b.price.amount))
    else if (sort === 'price-desc') sorted.sort((a, b) => Number(b.price.amount) - Number(a.price.amount))
    return sorted
  }, [all, q, sort, hits])

  const emptyHeading = (attributes.emptyHeading as string) ?? t('search.empty.title')
  const suggestions = suggestHandles
    .map((h) => allCollections().find((c) => c.handle === h))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  const tabs = [
    ...(types.includes('products') ? [{ id: 'products', label: 'Products', count: products.length }] : []),
    ...(types.includes('articles') ? [{ id: 'articles', label: 'Articles', count: fresh?.articles.length ?? 0 }] : []),
    ...(types.includes('pages') ? [{ id: 'pages', label: 'Pages', count: fresh?.pages.length ?? 0 }] : []),
  ]

  return (
    <section {...sharedRootProps(attributes)} className="section">
      <div className="container">
        <div className="search">
          {/* The search page had no top-level heading at all. The query is the
              page's subject, so it is the h1 — and it names the term, which is
              what a screen-reader user hears first on arriving at results. */}
          <h1 className="search__heading">
            {q ? `Search results for \u201C${query}\u201D` : t('search.button')}
          </h1>
          <form
            className="search__form"
            action="/search"
            method="get"
            role="search"
            aria-label="Search products"
          >
            <input
              className="field__input"
              type="search"
              name="q"
              defaultValue={query}
              placeholder={t('search.placeholder')}
              aria-label={t('search.button')}
            />
            <button className="btn btn--primary" type="submit">
              {t('search.button')}
            </button>
          </form>

          {!q ? (
            <StateBlock title={emptyHeading} body={(attributes.emptySub as string) ?? t('search.empty.sub')} />
          ) : (
            <>
              <div className="search__toolbar">
                {showTabs && <Tabs tabs={tabs} active={tab} onChange={setTab} label="Result type" />}
                {showSort && products.length > 0 && (
                  <Popover
                    label="Sort results"
                    align="end"
                    trigger={({ props }) => (
                      <button type="button" className="btn btn--secondary btn--sm" {...props}>
                        Sort: {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                      </button>
                    )}
                  >
                    <div className="sort-menu">
                      {SORT_OPTIONS.filter((o) => o.value !== 'best-selling' && o.value !== 'created-desc').map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={`sort-menu__item${o.value === sort ? ' is-active' : ''}`}
                          aria-current={o.value === sort}
                          onClick={() => setSort(o.value)}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </Popover>
                )}
              </div>

              <TabPanel id="products" active={showTabs ? tab : 'products'}>
                {products.length === 0 ? (
                  <>
                    <StateBlock
                      title={`${t('search.noResults')} \u201C${query}\u201D`}
                      body="Try a different search term, or browse a collection below."
                    />
                    {suggestions.length > 0 && (
                      <div className="collection-list__grid" data-columns={Math.min(suggestions.length, 4)}>
                        {suggestions.map((c) => (
                          <CollectionCard key={c.handle} collection={toCollectionCard(c)} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="search__count">
                      {products.length}{' '}
                      {products.length === 1 ? t('search.resultFor') : t('search.resultsFor')} “{query}”
                    </p>
                    <CardGrid products={products.map(toCard)} columns={columns} />
                  </>
                )}
              </TabPanel>

              {showTabs && types.includes('articles') && (
                <TabPanel id="articles" active={tab}>
                  {(fresh?.articles ?? []).length === 0 ? (
                    <StateBlock title={`No articles match \u201C${query}\u201D`} />
                  ) : (
                    <ul className="search__content-list">
                      {(fresh?.articles ?? []).map((a) => (
                        <li key={a.handle}>
                          <a href={`/blogs/${a.blogHandle ?? 'journal'}/${a.handle}`}>{a.title}</a>
                          {a.excerpt && <p className="u-text-muted">{a.excerpt}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </TabPanel>
              )}
              {showTabs && types.includes('pages') && (
                <TabPanel id="pages" active={tab}>
                  {(fresh?.pages ?? []).length === 0 ? (
                    <StateBlock title={`No pages match \u201C${query}\u201D`} />
                  ) : (
                    <ul className="search__content-list">
                      {(fresh?.pages ?? []).map((pg) => (
                        <li key={pg.handle}>
                          <a href={`/pages/${pg.handle}`}>{pg.title}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabPanel>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'search-results',
  role: 'section',
  requiresContext: ['search'],
  title: 'Search results',
  category: 'commerce',
  icon: '⌕',
  attributes: withShared({
    emptyHeading: { type: 'text', default: 'Find what you love', label: 'Empty-state heading' },
    emptySub: {
      type: 'text',
      default: 'Type a query above to find products.',
      label: 'Empty-state subtext',
    },
    resultTypes: {
      type: 'select',
      default: 'all',
      label: 'Search',
      options: [
        { value: 'all', label: 'Products, articles and pages' },
        { value: 'products', label: 'Products only' },
        { value: 'products,articles', label: 'Products and articles' },
      ],
    },
    showTabs: {
      type: 'boolean',
      default: true,
      label: 'Show result-type tabs',
      visible_if: "{{ section.settings.resultTypes != 'products' }}",
    },
    showSort: { type: 'boolean', default: true, label: 'Show sort' },
    noResultsCollections: {
      type: 'text',
      label: 'Collections to suggest when nothing matches (handles, comma separated)',
    },
    columns: {
      type: 'select',
      default: '4',
      label: 'Columns',
      options: [
        { value: '3', label: '3' },
        { value: '4', label: '4' },
      ],
    },
  }),
  component: SearchResults,
})
