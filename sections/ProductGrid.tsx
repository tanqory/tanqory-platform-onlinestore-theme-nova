import { defineSection, useData, type SectionProps } from '../lib/tanqory/index'
import { SectionHead } from '../components/SectionHead'
import { CollectionBody } from '../components/CollectionBody'
import { toCard } from '../components/ProductCard'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

/**
 * PRODUCT GRID — the collection page body: filters, sort and pagination.
 *
 * It used to be a dumb read of the bootstrap cache with no sort, no filters and
 * no pagination, capped at whatever the prefetch happened to contain. The body
 * is now shared with `main-collection` (see components/CollectionBody.tsx), so
 * the collection page and this section can never diverge again.
 */
export function ProductGrid({ attributes }: SectionProps): JSX.Element {
  const { collectionByHandle } = useData()
  const handle = (attributes.collection as string) ?? 'all'
  const heading = attributes.heading as string | undefined
  // The design's shared SectionHeader slot is `description` (06 Configuration
  // System). `subheading` is the key this section used before the conversion
  // and is still honoured, so saved merchant content is not orphaned.
  const subheading =
    (attributes.description as string | undefined) ??
    (attributes.subheading as string | undefined)
  const perPage = Number(attributes.productsPerPage ?? 24) || 24
  const cached = collectionByHandle(handle)

  return (
    <section {...sharedRootProps(attributes)} className="section">
      <div className="container">
        {(heading || subheading) && <SectionHead heading={heading} description={subheading} />}
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
          {...(attributes.showQuickAdd === undefined
            ? {}
            : { showQuickAdd: attributes.showQuickAdd !== false })}
        />
      </div>
    </section>
  )
}

export default defineSection({
  name: 'product-grid',
  role: 'section',
  title: 'Product grid',
  description: 'A grid of products you choose.',
  category: 'commerce',
  icon: '▦',
  attributes: withShared({
    description: { type: 'richtext', group: 'Content', label: 'Description' },
    heading: { type: 'text', default: 'Shop the collection', label: 'Heading' },
    subheading: { type: 'text', label: 'Subheading' },
    collection: { type: 'collection', default: 'all', label: 'Collection' },
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
    showQuickAdd: { type: 'boolean', default: true, label: 'Show quick add' },
  }),
  component: ProductGrid,
})
