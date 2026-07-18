import { defineSection, useData, type SectionProps } from '@tanqory/theme-kit'

/**
 * Collection links — a grid of collection "cards" that link to each collection.
 * Pulls the store's collections from the data source (no hardcoded links); the
 * card image falls back to the collection's first product image.
 */
export function CollectionLinks({ attributes }: SectionProps): JSX.Element {
  const { allCollections } = useData()
  const limit = (attributes.limit as number) ?? 6
  const columns = (attributes.columns as number) ?? 3
  const collections = allCollections().slice(0, limit)
  if (collections.length === 0) return <></>

  return (
    <section className="section">
      <div className="container">
        {attributes.heading && (
          <div className="product-grid__head">
            <h2>{attributes.heading}</h2>
          </div>
        )}
        <div className="collection-links__grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {collections.map((c) => {
            const image = c.image?.url ?? c.products[0]?.featuredImage?.url
            return (
              <a key={c.handle} className="collection-link" href={`/collections/${c.handle}`}>
                <div className="collection-link__media">
                  {image && <img src={image} alt={c.image?.altText ?? c.title} loading="lazy" decoding="async" />}
                </div>
                <span className="collection-link__title">{c.title}</span>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'collection-links',
  title: 'Collection links',
  category: 'content',
  icon: '▦',
  attributes: {
    heading: { type: 'text', default: 'Shop by collection', label: 'Heading' },
    columns: { type: 'range', default: 3, min: 2, max: 5, step: 1, label: 'Columns' },
    limit: { type: 'range', default: 6, min: 2, max: 12, step: 1, label: 'Collections to show' },
  },
  component: CollectionLinks,
})
