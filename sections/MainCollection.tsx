import { useCallback, useState } from 'react'
import { defineSection, useData, useT, type SectionProps } from '@tanqory/theme-kit'
import { routeHandle } from '../lib/routes'
import { isEditorPreview } from '../lib/runtime'
import { Button } from '../components/Button'
import { CollectionBody } from '../components/CollectionBody'
import { toCard } from '../components/ProductCard'

/**
 * MAIN COLLECTION — the products of the collection in the URL.
 *
 * This is the section a `/collections/<handle>` page renders. It is deliberately
 * separate from `featured-collection`, which is a CURATED row: a merchant picks
 * a collection for it and it shows the same one wherever it is placed.
 *
 * The collection template used to place `featured-collection` with a hardcoded
 * `"collection": "all"` setting, so every collection URL on the store —
 * /collections/sale, /collections/new-in, all of them — listed the `all`
 * collection under whatever heading the template carried. A merchant could not
 * tell from the page that their collection was not the one being shown.
 *
 * What it OWNS is resolving the handle from the route and the not-found case.
 * Everything after that — filters, sort, grid, pagination — is
 * `CollectionBody`, shared with `product-grid`, because the design describes
 * one collection page body and this section is not allowed to be a second one.
 */
export function MainCollection({ attributes }: SectionProps): JSX.Element {
  const { collectionByHandle } = useData()
  const t = useT()

  // The URL is the resource. `attributes.collection` is a preview/placement
  // override for the editor and for the section dropped outside a collection
  // route; it must never override the URL on a live collection page.
  const urlHandle = routeHandle(typeof window !== 'undefined' ? window.location.pathname : '/', 'collection')
  const fallbackHandle = (attributes.collection as string | undefined)?.trim() || undefined
  const handle = isEditorPreview() ? fallbackHandle ?? urlHandle : urlHandle ?? fallbackHandle

  const perPage = Number(attributes.productsPerPage ?? attributes.limit ?? 24) || 24
  const headingOverride = (attributes.heading as string | undefined)?.trim() || undefined
  const cached = handle ? collectionByHandle(handle) : null

  // A handle with no cached record AND a settled, successful, empty fetch is a
  // collection the store does not have.
  const [resolved, setResolved] = useState({ handle, settled: false, failed: false, count: 0 })
  const onResolve = useCallback(
    (s: { settled: boolean; failed: boolean; count: number }) => setResolved({ ...s, handle }),
    [handle],
  )
  // SPA soft-nav is on by default and both collection routes share this
  // template, so React reuses this component instance across handles. Keying
  // the resolution to the handle it came from stops a legitimately empty
  // collection from pinning the NEXT collection on "not found" forever — the
  // old state short-circuited before `CollectionBody` could mount and report.
  const settledForThisHandle = resolved.handle === handle
  const notFound =
    Boolean(handle) &&
    !cached &&
    settledForThisHandle &&
    resolved.settled &&
    !resolved.failed &&
    resolved.count === 0

  // A collection URL that resolves to nothing is not "an empty collection".
  // `main.tsx` prefetches the route's collection in the bootstrap, so a handle
  // with no cached record is a handle the store does not have — say so, instead
  // of printing the raw URL segment as a page heading.
  if (!handle || notFound) {
    return (
      <section className="section">
        <div className="container">
          <div className="not-found">
            <h1>{t('collection.notFound')}</h1>
            <p className="u-text-muted">{t('collection.notFound.sub')}</p>
            <Button label={t('common.shopCollection')} link="/collections/all" variant="primary" />
          </div>
        </div>
      </section>
    )
  }

  const heading = headingOverride ?? cached?.title ?? handle

  return (
    <section className="section">
      <div className="container">
        <div className="section-head section-head--left">
          <div className="section-head__text">
            <h1 className="section-head__heading">{heading}</h1>
            {cached?.description && <p className="section-head__sub">{cached.description}</p>}
          </div>
        </div>

        <CollectionBody
          handle={handle}
          seed={(cached?.products ?? []).slice(0, perPage).map(toCard)}
          columns={Number(attributes.columns) === 4 ? 4 : 3}
          mobileColumns={Number(attributes.mobileColumns ?? 2) === 1 ? 1 : 2}
          filterLayout={(attributes.filterLayout as 'sidebar' | 'drawer' | 'none') ?? 'sidebar'}
          showSort={attributes.showSort !== false}
          showCount={attributes.showCount !== false}
          pagination={(attributes.pagination as 'load-more' | 'pages') ?? 'load-more'}
          productsPerPage={perPage}
          onResolve={onResolve}
        />
      </div>
    </section>
  )
}

export default defineSection({
  name: 'main-collection',
  role: 'section',
  requiresContext: ['collection'],
  title: 'Collection products',
  category: 'commerce',
  icon: '▤',
  attributes: {
    heading: { type: 'text', label: 'Heading override (blank = collection title)' },
    collection: {
      type: 'collection',
      label: 'Collection (preview only — URL :handle is canonical)',
    },
    productsPerPage: {
      type: 'select',
      default: '24',
      label: 'Products per page',
      options: [
        { value: '12', label: '12' },
        { value: '24', label: '24' },
        { value: '48', label: '48' },
      ],
    },
    columns: {
      type: 'select',
      default: '3',
      label: 'Columns',
      options: [
        { value: '3', label: '3' },
        { value: '4', label: '4' },
      ],
    },
    mobileColumns: {
      type: 'select',
      default: '2',
      label: 'Columns on mobile',
      options: [
        { value: '1', label: '1' },
        { value: '2', label: '2' },
      ],
    },
    filterLayout: {
      type: 'select',
      default: 'sidebar',
      label: 'Filters',
      options: [
        { value: 'sidebar', label: 'Sidebar' },
        { value: 'drawer', label: 'Drawer' },
        { value: 'none', label: 'None' },
      ],
    },
    showSort: { type: 'boolean', default: true, label: 'Show sort' },
    showCount: { type: 'boolean', default: true, label: 'Show result count' },
    pagination: {
      type: 'select',
      default: 'load-more',
      label: 'Pagination',
      options: [
        { value: 'load-more', label: 'Load more' },
        { value: 'pages', label: 'Numbered pages' },
      ],
    },
  },
  component: MainCollection,
})
