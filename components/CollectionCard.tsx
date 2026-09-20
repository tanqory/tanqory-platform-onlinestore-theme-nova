/**
 * THE collection card. One implementation for every collection listing.
 *
 * Design: `CollectionCard.dc.html`. Anatomy — media · title (with an optional
 * right-aligned count on the same line) · optional 2-line description.
 *
 * Two things the three previous copies all got wrong:
 *   - they rendered the OVERLAY variant as the default. The design's default is
 *     text-below; the scrim overlay is an opt-in editorial variant.
 *   - none implemented the no-image fallback, so a collection with no image and
 *     no products rendered an empty grey box (`ImageResponsive` returns null for
 *     a falsy src). The design puts the title in the media well instead.
 */
import { ImageResponsive } from './ImageResponsive'
import { Link } from './Link'

export interface CollectionCardData {
  handle: string
  title: string
  image?: { url: string; altText?: string } | null
  description?: string | null
  /** Product count, rendered right-aligned on the title line. */
  count?: number | null
}

export interface CollectionCardProps {
  collection: CollectionCardData
  /** `overlay` places the title over a scrim; default is text below the media. */
  variant?: 'text-below' | 'overlay'
  imageRatio?: 'portrait' | 'square' | 'landscape'
  showCount?: boolean
  showDescription?: boolean
  /** Merchant-supplied title override. */
  title?: string
}

const RATIO = {
  portrait: 'var(--ratio-collection)',
  square: 'var(--ratio-square)',
  landscape: 'var(--ratio-editorial)',
} as const

export function CollectionCard({
  collection,
  variant = 'text-below',
  imageRatio = 'portrait',
  showCount = false,
  showDescription = false,
  title,
}: CollectionCardProps): JSX.Element {
  const label = title || collection.title
  const hasImage = !!collection.image?.url

  return (
    <Link
      href={`/collections/${collection.handle}`}
      className={`collection-card collection-card--${variant}`}
    >
      <div className="collection-card__media" style={{ aspectRatio: RATIO[imageRatio] }}>
        {hasImage ? (
          <ImageResponsive
            src={collection.image?.url}
            /* Always empty. The title is rendered directly below, inside the
               same link, and this store's alt text IS the title — so a screen
               reader announced the collection name twice. In this composition
               the image is decorative whatever the merchant typed. */
            alt=""
            style={{ objectFit: 'cover' }}
          />
        ) : (
          /* No image: the title carries the card, never a broken frame. */
          <span className="collection-card__fallback">{label}</span>
        )}
        {variant === 'overlay' && (
          <span className="collection-card__overlay">
            <span className="collection-card__title">{label}</span>
          </span>
        )}
      </div>

      {variant === 'text-below' && (
        <div className="collection-card__body">
          <span className="collection-card__row">
            <span className="collection-card__title">{label}</span>
            {showCount && typeof collection.count === 'number' && (
              <span className="collection-card__count">{collection.count}</span>
            )}
          </span>
          {showDescription && collection.description && (
            <span className="collection-card__desc">{collection.description}</span>
          )}
        </div>
      )}
    </Link>
  )
}

/**
 * Narrow a kit `Collection` to what a card renders.
 *
 * Two details the kit shape forces: `image.url` is optional (so an image object
 * can exist with no url), and the hero falls back to the first product's image
 * — which is what every previous copy did, and what makes a collection with no
 * own artwork still look intentional.
 */
export function toCollectionCard(c: {
  handle: string
  title: string
  image?: { url?: string; altText?: string } | null
  description?: string | null
  products?: Array<{ featuredImage?: { url: string; altText?: string } | null }>
  productsCount?: number
}): CollectionCardData {
  const heroUrl = c.image?.url ?? c.products?.[0]?.featuredImage?.url
  const heroAlt = c.image?.altText ?? c.title
  return {
    handle: c.handle,
    title: c.title,
    image: heroUrl ? { url: heroUrl, altText: heroAlt } : null,
    ...(c.description ? { description: c.description } : {}),
    ...(typeof c.productsCount === 'number'
      ? { count: c.productsCount }
      : Array.isArray(c.products)
        ? { count: c.products.length }
        : {}),
  }
}
