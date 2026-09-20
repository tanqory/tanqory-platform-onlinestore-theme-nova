/**
 * The product grid — one column ladder for every list of products.
 *
 * Column counts follow the design's fallback table
 * (desktop → tablet → mobile): 6→4→2, 5→3→2, 4→3→2, 3→3→2, 2→2→1. The count is
 * a merchant choice; the fallbacks are derived, never configured separately.
 *
 * Previously two grid classes existed — `featured-collection__grid` and
 * `product-grid__grid` — with different intrinsic `auto-fit` sizing. That was
 * the blocker to sharing one card: dropping the shared grid into a section that
 * used the other class silently changed its column count.
 */
import { ProductCard, type ProductCardData, type CardImageRatio } from './ProductCard'
import { StateBlock } from './StateBlock'

export { toCard } from './ProductCard'
export type { ProductCardData } from './ProductCard'

export interface ProductGridProps {
  products: ProductCardData[]
  /** Desktop column count; tablet and mobile are derived from it. */
  columns?: 2 | 3 | 4 | 5 | 6
  /** `carousel` is one snap-scrolled row instead of a wrapping grid. */
  layout?: 'grid' | 'carousel'
  /** Scroll as a carousel at 390 even when the desktop layout is a grid. */
  carouselOnMobile?: boolean
  /** Overrides the derived mobile column count (the ladder gives 2). */
  mobileColumns?: 1 | 2
  /** Carousel arrows on desktop. Touch always swipes; arrows are the pointer
      affordance, so they are desktop-only by construction. */
  showNavigation?: boolean
  imageRatio?: CardImageRatio
  imageFit?: 'contain' | 'cover'
  showVendor?: boolean
  showSwatches?: boolean
  showQuickAdd?: boolean
}

export function ProductGrid({
  products,
  columns = 4,
  layout = 'grid',
  carouselOnMobile = false,
  mobileColumns = 2,
  showNavigation = true,
  imageRatio = 'portrait',
  imageFit = 'contain',
  showVendor = false,
  showSwatches = false,
  showQuickAdd,
}: ProductGridProps): JSX.Element {
  return (
    <div
      className="product-grid"
      data-columns={columns}
      data-layout={layout}
      data-carousel-mobile={carouselOnMobile ? 'true' : undefined}
      data-mobile-columns={mobileColumns}
      data-nav={layout === 'carousel' && showNavigation ? 'true' : undefined}
    >
      {products.map((p) => (
        <ProductCard
          key={p.handle}
          product={p}
          imageRatio={imageRatio}
          imageFit={imageFit}
          showVendor={showVendor}
          showSwatches={showSwatches}
          {...(showQuickAdd === undefined ? {} : { showQuickAdd })}
        />
      ))}
    </div>
  )
}

/**
 * Empty state for any product listing.
 *
 * The design's empty state is a glyph, a title, a one-line body and at most one
 * CTA — never an illustration. Five different ad-hoc empty states existed
 * before this.
 */
export function ProductGridEmpty({
  message,
  title,
  actionLabel,
  onAction,
}: {
  message: string
  title?: string
  /** At most one CTA, per the design — usually "Clear filters". */
  actionLabel?: string
  onAction?: () => void
}): JSX.Element {
  return (
    <StateBlock
      tone="empty"
      title={title ?? message}
      {...(title ? { body: message } : {})}
      {...(actionLabel && onAction ? { ctaLabel: actionLabel, onCta: onAction } : {})}
    />
  )
}
