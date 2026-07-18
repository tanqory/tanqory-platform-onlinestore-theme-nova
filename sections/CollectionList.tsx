import { Children } from 'react'
import { defineSection, useData, type SectionProps } from '@tanqory/theme-kit'
import { Link } from '../components/Link'
import { ImageResponsive } from '../components/ImageResponsive'

export function CollectionList({ attributes, children }: SectionProps): JSX.Element {
  const { allCollections } = useData()
  const limit = (attributes.limit as number) ?? 12
  const heading = (attributes.heading as string) ?? 'Shop by collection'
  const subheading = attributes.subheading as string | undefined

  // CURATED mode: when the merchant added child blocks (collection-item) in
  // the editor, render exactly those, in their order. AUTO mode: with no
  // blocks, fall back to the whole catalogue (previous behaviour) so a
  // fresh theme renders something meaningful with zero configuration.
  const hasBlocks = Children.count(children) > 0
  const collections = hasBlocks ? [] : allCollections().slice(0, limit)

  return (
    <section className="section">
      <div className="container">
        <div className="featured-collection__head">
          <div className="stack stack--sm">
            <h2>{heading}</h2>
            {subheading && <p className="lede">{subheading}</p>}
          </div>
        </div>

        {hasBlocks ? (
          <div className="collection-list__grid">{children}</div>
        ) : collections.length === 0 ? (
          <div className="card card--padded card--bordered u-text-center">
            <p className="u-text-muted">No collections yet.</p>
          </div>
        ) : (
          <div className="collection-list__grid">
            {collections.map((c) => {
              const heroUrl = c.image?.url ?? c.products[0]?.featuredImage?.url
              const heroAlt = c.image?.altText ?? c.title
              return (
                <Link key={c.handle} href={`/collections/${c.handle}`} className="collection-card">
                  <ImageResponsive src={heroUrl} alt={heroAlt} />
                  <div className="collection-card__overlay">
                    <span className="collection-card__title">{c.title}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default defineSection({
  name: 'collection-list',
  title: 'Collection list',
  category: 'commerce',
  icon: '☷',
  attributes: {
    heading: { type: 'text', default: 'Shop by collection', label: 'Heading' },
    subheading: { type: 'text', label: 'Subheading' },
    limit: { type: 'number', default: 6, label: 'Max collections (auto mode)' },
  },
  allowedBlocks: ['collection-item'],
  presets: [
    {
      blocks: [
        { type: 'collection-item', settings: {} },
        { type: 'collection-item', settings: {} },
        { type: 'collection-item', settings: {} },
      ],
    },
  ],
  component: CollectionList,
})
