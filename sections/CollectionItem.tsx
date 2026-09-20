import { defineSection, useData, type SectionProps } from '@tanqory/theme-kit'
import { CollectionCard, toCollectionCard } from '../components/CollectionCard'
import { isEditorPreview } from '../lib/runtime'

/**
 * Collection card — a CHILD BLOCK of the Collection List section
 * (category: 'block' keeps it out of the Add-section picker; the editor
 * offers it via Collection List's Add-block UI instead).
 *
 * Each instance points at one collection by handle. Title/image override
 * the collection's own when set, so merchants can curate the card without
 * touching the catalogue.
 *
 * An unresolvable handle is an EDITOR problem, not a shopper-facing one. The
 * card used to render `Collection "christmas-collection" not found` on the live
 * storefront — the theme's own starter content shipped three such handles, so a
 * brand-new store's home page greeted shoppers with three not-found cards. In
 * the editor the merchant still needs to see and fix it, so the placeholder
 * renders there and only there.
 */
export function CollectionItem({ attributes }: SectionProps): JSX.Element {
  const { collectionByHandle } = useData()
  const handle = (attributes.collection as string) ?? ''
  const titleOverride = attributes.title as string | undefined
  const c = handle ? collectionByHandle(handle) : null

  if (!c) {
    if (!isEditorPreview()) return <></>
    return (
      <div className="collection-card collection-card--empty card card--bordered u-text-center">
        <span className="u-text-muted">
          {handle ? `Collection "${handle}" not found` : 'Pick a collection'}
        </span>
      </div>
    )
  }

  return (
    <CollectionCard
      collection={toCollectionCard(c)}
      {...(titleOverride ? { title: titleOverride } : {})}
    />
  )
}

export default defineSection({
  name: 'collection-item',
  role: 'block',
  title: 'Collection',
  category: 'block',
  icon: '▢',
  attributes: {
    collection: { type: 'collection', label: 'Collection' },
    title: { type: 'text', label: 'Title override' },
  },
  component: CollectionItem,
})
