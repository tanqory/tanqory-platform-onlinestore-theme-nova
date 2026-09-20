import { defineSection, useData, type SectionProps } from '@tanqory/theme-kit'
import { SectionHead } from '../components/SectionHead'
import { useMenu } from '../components/use-menu'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

/**
 * Collection links — a grid of collection "cards" that link to each collection.
 * Pulls the store's collections from the data source (no hardcoded links); the
 * card image falls back to the collection's first product image.
 */
export function CollectionLinks({ attributes }: SectionProps): JSX.Element {
  const { allCollections } = useData()
  const limit = (attributes.limit as number) ?? 6
  const columns = (attributes.columns as number) ?? 3
  const style = (attributes.style as string) ?? 'chips'
  const listSize = (attributes.listSize as string) ?? 'large'
  const sourceMenu = (attributes.source as string | undefined)?.trim() || undefined
  const menu = useMenu(sourceMenu ?? '')

  // `source` points at a real store menu when set; otherwise the store's own
  // collections are the source, which is what the section did before.
  const items = sourceMenu
    ? (menu?.items ?? [])
        .filter((it) => Boolean(it.url))
        .slice(0, limit)
        .map((it) => ({ title: it.title as string, href: it.url as string, image: undefined as string | undefined }))
    : allCollections()
        .slice(0, limit)
        .map((c) => ({
          title: c.title,
          href: `/collections/${c.handle}`,
          image: c.image?.url ?? c.products[0]?.featuredImage?.url,
        }))

  if (items.length === 0) return <></>

  return (
    <section {...sharedRootProps(attributes)} className="section">
      <div className="container">
        {attributes.heading && (
          <SectionHead
            heading={attributes.heading as string}
            description={attributes.description as string | undefined}
          />
        )}

        {style === 'chips' ? (
          // Chips are a flowing row of links, not a grid of cards — a column
          // count means nothing here, so it is deliberately not applied.
          <div className="collection-links__chips" data-size={listSize}>
            {items.map((it) => (
              <a key={it.href} className="collection-chip" href={it.href}>
                {it.title}
              </a>
            ))}
          </div>
        ) : (
          <div className="collection-links__grid" data-columns={columns} data-size={listSize}>
            {items.map((it) => (
              <a key={it.href} className="collection-link" href={it.href}>
                <div className="collection-link__media">
                  {it.image && <img src={it.image} alt="" loading="lazy" decoding="async" />}
                </div>
                <span className="collection-link__title">{it.title}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default defineSection({
  name: 'collection-links',
  role: 'section',
  title: 'Collection links',
  category: 'content',
  icon: '▦',
  attributes: withShared({
    description: { type: 'textarea', group: 'Content', label: 'Description' },
    heading: { type: 'text', default: 'Shop by collection', label: 'Heading' },
    columns: { type: 'range', default: 3, min: 2, max: 5, step: 1, label: 'Columns' },
    limit: { type: 'range', default: 6, min: 2, max: 12, step: 1, label: 'Collections to show' },
    style: {
      type: 'select',
      default: 'chips',
      label: 'Style',
      options: [
        { value: 'chips', label: 'Chips' },
        { value: 'list', label: 'List' },
      ],
    },
    source: { type: 'menu', label: 'Menu to link from (blank = collections)' },
    listSize: {
      type: 'select',
      default: 'large',
      label: 'Size',
      options: [
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
      ],
    },
  }),
  component: CollectionLinks,
})
