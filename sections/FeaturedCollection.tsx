import { useEffect, useState } from 'react'
import { defineSection, useData, useT, type SectionProps } from '@tanqory/theme-kit'
import { SectionHead } from '../components/SectionHead'
import { ProductGrid, ProductGridEmpty, toCard, type ProductCardData } from '../components/ProductGrid'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

/**
 * Featured collection — a CURATED row of products. Headline + product cards.
 *
 * The merchant picks which collection this shows; it is the same collection
 * wherever the section is placed. The products of the collection in the URL are
 * `main-collection`'s job — this section deliberately does not read the route.
 *
 * Prefer the bootstrap-prefetched cache (`collectionByHandle`) so the first
 * paint has product cards baked into the SSG HTML. When the merchant picks a
 * collection that wasn't in the prefetch window (catalogue > 10 collections, or
 * the editor changed the handle live), fall back to the kit's
 * `collectionProducts` — the same request path the rest of the data layer uses,
 * so country, locale, publishable key and error handling match. This section
 * used to hand-roll that `fetch` with its own headers, which meant a shopper in
 * a non-default market saw base-currency prices in this row only.
 */
export function FeaturedCollection({ attributes }: SectionProps): JSX.Element {
  const { collectionByHandle, collectionProducts } = useData()
  const t = useT()
  const handle = (attributes.collection as string) ?? 'all'
  // `productsToShow` is the design's name; `limit` stays readable as the old
  // key so a merchant's saved value is not lost (see scripts/migrate-content.mjs).
  const limit = (attributes.productsToShow as number) ?? (attributes.limit as number) ?? 4
  const eyebrow = attributes.eyebrow as string | undefined
  const heading = (attributes.heading as string) ?? 'Featured'
  // The design's shared SectionHeader slot is `description` (06 Configuration
  // System). `subheading` is the key this section used before the conversion
  // and is still honoured, so saved merchant content is not orphaned.
  const subheading =
    (attributes.description as string | undefined) ??
    (attributes.subheading as string | undefined)
  const showViewAll = attributes.showViewAll !== false
  const layout = (attributes.layout as 'grid' | 'carousel') ?? 'grid'
  const columns = (attributes.columns as 2 | 3 | 4 | 5 | 6) ?? 4
  const carouselOnMobile = attributes.carouselOnMobile === true
  const mobileColumns = Number(attributes.mobileColumns ?? 2) === 1 ? 1 : 2
  const showNavigation = attributes.showNavigation !== false
  const cardImageRatio = (attributes.cardImageRatio as string) ?? 'inherit'
  const headerAlignment = (attributes.headerAlignment as 'left' | 'center') ?? 'left'

  const cached = collectionByHandle(handle)
  const cachedProducts = (cached?.products ?? []).slice(0, limit)
  const [liveProducts, setLiveProducts] = useState<ProductCardData[] | null>(null)

  // Trust the bootstrap cache only when it actually has products for this
  // handle. The cache is baked at BUILD time — a collection whose products
  // were assigned (or made storefront-visible) after the last build sits in
  // the cache as an empty shell, and short-circuiting on the bare cache hit
  // rendered "No products yet" while the live API had the products. Cache
  // hit WITH products = instant paint; empty/missing = live-fetch refresh.
  const cacheUsable = Boolean(cached && cachedProducts.length > 0)

  useEffect(() => {
    if (cacheUsable) {
      setLiveProducts(null)
      return
    }
    if (!collectionProducts) return
    let cancelled = false
    void collectionProducts(handle, { first: limit })
      .then((page) => {
        if (!cancelled) setLiveProducts(page.products.map(toCard))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        // eslint-disable-next-line no-console
        console.error(`[nova] collectionProducts(${handle}) failed:`, err)
        setLiveProducts([])
      })
    return () => {
      cancelled = true
    }
  }, [cacheUsable, handle, limit, collectionProducts])

  const products: ProductCardData[] = cacheUsable ? cachedProducts.map(toCard) : liveProducts ?? []

  return (
    <section {...sharedRootProps(attributes)} className="section">
      <div className="container">
        <SectionHead
          eyebrow={eyebrow}
          heading={heading}
          description={subheading}
          align={headerAlignment}
          {...(showViewAll ? { linkHref: `/collections/${handle}`, linkLabel: t('common.viewAll') } : {})}
        />

        {products.length === 0 ? (
          <ProductGridEmpty message={t('collection.empty')} />
        ) : (
          <ProductGrid
            products={products}
            columns={columns}
            layout={layout}
            carouselOnMobile={carouselOnMobile}
            mobileColumns={mobileColumns as 1 | 2}
            showNavigation={showNavigation}
            {...(cardImageRatio === 'inherit'
              ? {}
              : { imageRatio: cardImageRatio as 'adapt' | 'square' | 'portrait' | 'landscape' })}
          />
        )}
      </div>
    </section>
  )
}

export default defineSection({
  name: 'featured-collection',
  role: 'section',
  title: 'Featured collection',
  category: 'commerce',
  icon: '▦',
  attributes: withShared({
    description: { type: 'textarea', group: 'Content', label: 'Description' },
    eyebrow: { type: 'text', label: 'Eyebrow' },
    heading: { type: 'text', default: 'Featured', label: 'Heading' },
    subheading: { type: 'text', label: 'Subheading' },
    collection: { type: 'collection', default: 'all', label: 'Collection' },
    productsToShow: { type: 'range', default: 4, min: 2, max: 12, step: 1, label: 'Products to show' },
    mobileColumns: {
      type: 'select',
      default: '2',
      label: 'Columns on mobile',
      visible_if: "{{ section.settings.layout == 'grid' }}",
      options: [
        { value: '1', label: '1' },
        { value: '2', label: '2' },
      ],
    },
    showNavigation: {
      type: 'boolean',
      default: true,
      label: 'Show carousel arrows',
      visible_if: "{{ section.settings.layout == 'carousel' }}",
    },
    cardImageRatio: {
      type: 'select',
      default: 'inherit',
      label: 'Card image shape',
      options: [
        { value: 'inherit', label: 'Use theme default' },
        { value: 'adapt', label: 'Adapt to image' },
        { value: 'square', label: 'Square' },
        { value: 'portrait', label: 'Portrait' },
        { value: 'landscape', label: 'Landscape' },
      ],
    },
    showViewAll: { type: 'boolean', default: true, label: 'Show "View all" link' },
    layout: {
      type: 'select',
      default: 'grid',
      label: 'Layout',
      options: [
        { value: 'grid', label: 'Grid' },
        { value: 'carousel', label: 'Carousel' },
      ],
    },
    columns: { type: 'range', default: 4, min: 2, max: 6, step: 1, label: 'Columns' },
    carouselOnMobile: { type: 'boolean', default: false, label: 'Carousel on mobile' },
    headerAlignment: { type: 'text_alignment', default: 'left', label: 'Header alignment' },
  }),
  component: FeaturedCollection,
})
