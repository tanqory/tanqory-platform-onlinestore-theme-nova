/**
 * THE product card. One implementation, embedded unchanged by every section
 * that lists products.
 *
 * Design: `03 Commerce Components` + `ProductCard.dc.html`. Anatomy —
 * media (4:5 contain, 4px radius, subtle border) · badge · vendor (optional) ·
 * title (2-line clamp) · price row · swatches (optional).
 *
 * Before this there were five independent renderings of `.product-card` across
 * FeaturedCollection, ProductGrid, SearchResults, ProductRecommendations and
 * the search modal. They disagreed on wrapper (`Link` vs raw `<a>`), image
 * (`ImageResponsive` vs raw `<img>`) and money (`Money` vs `Price`), so a fix
 * to one never reached the others.
 */
import type { ImageRef, Money as MoneyValue, Product } from '../lib/tanqory/index'
import { ImageResponsive } from './ImageResponsive'
import { Price } from './Price'
import { Link } from './Link'

/** Media aspect presets a merchant may choose. `adapt` uses the image's own. */
export type CardImageRatio = 'adapt' | 'portrait' | 'square' | 'tall' | 'landscape'

const RATIO: Record<Exclude<CardImageRatio, 'adapt'>, string> = {
  portrait: 'var(--ratio-product)',
  square: 'var(--ratio-square)',
  tall: '3 / 4',
  landscape: 'var(--ratio-editorial)',
}

export interface ProductCardData {
  handle: string
  title: string
  price: MoneyValue
  featuredImage: { url: string; altText?: string } | null
  /** Strikethrough original — renders the price in the sale role when set. */
  compareAtPrice?: MoneyValue | null
  vendor?: string | null
  /** Catalog facets — used to derive collection filters client-side. */
  productType?: string | null
  tags?: string[]
  /** Sold out / unavailable dims the media and mutes the title. */
  available?: boolean
  /**
   * Colour option VALUES from the product (e.g. `['Oat','Black']`).
   *
   * The storefront contract carries no swatch colour — `ProductOption` is
   * `{name, values: string[]}` — so the circle is tinted only when the value
   * happens to name a real CSS colour, and every circle keeps the value as its
   * accessible name so the information is never lost. See docs/DESIGN-GAPS.md (F24).
   */
  swatches?: string[]
}

export interface ProductCardProps {
  product: ProductCardData
  imageRatio?: CardImageRatio
  imageFit?: 'contain' | 'cover'
  showVendor?: boolean
  showSwatches?: boolean
  /** Horizontal variant: 120px media beside the body (search hits, drawers). */
  layout?: 'vertical' | 'horizontal'
  /**
   * Quick add. Desktop: fades up over the media on hover. Touch: a persistent
   * 40px icon button bottom-right, because there is no hover to reveal it.
   * Single-variant products add directly; anything else opens the product page
   * rather than guessing a variant.
   */
  showQuickAdd?: boolean
  onQuickAdd?: (product: ProductCardData) => void
}

const MAX_SWATCHES = 4

/** Does the browser recognise this string as a colour? */
function isCssColour(value: string): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return false
  return CSS.supports('color', value)
}

/** The values of whichever option names a colour, if the product has one. */
function colourValues(options?: { name: string; values: string[] }[]): string[] {
  const colour = (options ?? []).find((o) => /colou?r/i.test(o.name))
  return colour?.values ?? []
}

export function ProductCard({
  product,
  imageRatio = 'portrait',
  imageFit = 'contain',
  showVendor = false,
  showSwatches = false,
  layout = 'vertical',
  showQuickAdd = false,
  onQuickAdd,
}: ProductCardProps): JSX.Element {
  const unavailable = product.available === false
  const onSale =
    !!product.compareAtPrice &&
    Number(product.compareAtPrice.amount) > Number(product.price.amount)

  const swatches = (product.swatches ?? []).filter(Boolean)
  const shown = swatches.slice(0, MAX_SWATCHES)
  const overflow = swatches.length - shown.length

  const quickAdd = showQuickAdd && !unavailable && (
    /* A SIBLING of the card's link, not a child of it. A <button> inside an
       <a> is invalid HTML: the audit flagged it twice over — once as nested
       interactive controls, once as focusable content inside an element whose
       children are presentational — and keyboard users got two targets that
       looked like one. It still sits over the media; only the nesting changed. */
    <button
      type="button"
      className="product-card__quick-add"
      aria-label={`Quick add ${product.title}`}
      onClick={() => onQuickAdd?.(product)}
    >
      <span className="product-card__quick-add-label">Quick add</span>
      <span className="product-card__quick-add-glyph" aria-hidden>
        +
      </span>
    </button>
  )

  return (
    <div
      className={`product-card${layout === 'horizontal' ? ' product-card--horizontal' : ''}${
        unavailable ? ' product-card--unavailable' : ''
      }`}
    >
      <div
        className="product-card__media"
        style={imageRatio === 'adapt' ? undefined : { aspectRatio: RATIO[imageRatio] }}
      >
        <ImageResponsive
          src={product.featuredImage?.url}
          alt={product.featuredImage?.altText ?? product.title}
          style={{ objectFit: imageFit }}
        />
        {unavailable && <span className="badge badge--sold-out product-card__badge">Sold out</span>}
        {!unavailable && onSale && (
          <span className="badge badge--sale product-card__badge">Sale</span>
        )}
        {quickAdd}
      </div>

      <div className="product-card__body">
        {showVendor && product.vendor && (
          <span className="product-card__vendor">{product.vendor}</span>
        )}
        {/* The link lives on the title and stretches over the whole card with a
            pseudo-element, so the card is one target without wrapping the
            quick-add button in an anchor. */}
        <Link href={`/products/${product.handle}`} className="product-card__link">
          <span className="product-card__title">{product.title}</span>
        </Link>
        <Price
          value={product.price}
          compareAt={product.compareAtPrice ?? null}
          className="product-card__price"
        />
        {showSwatches && shown.length > 0 && (
          <span className="product-card__swatches">
            {shown.map((s, i) => {
              const isImage = /^(https?:|\/)/.test(s)
              // A raw value like "Oat" is not a colour the browser knows. Tint
              // only when it resolves; otherwise stay neutral rather than
              // rendering an arbitrary hue that misrepresents the product.
              const tinted = !isImage && isCssColour(s)
              return (
                <span
                  key={i}
                  className={`product-card__swatch${tinted || isImage ? '' : ' product-card__swatch--unknown'}`}
                  title={s}
                  aria-label={s}
                  role="img"
                  style={isImage ? { backgroundImage: `url(${s})` } : tinted ? { background: s } : undefined}
                />
              )
            })}
            {overflow > 0 && <span className="product-card__swatch-more">+{overflow}</span>}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Narrow a kit `Product` (bootstrap card shape or full detail) to what a card
 * renders. One place that knows which kit fields feed which card slot.
 */
export function toCard(
  p: Pick<Product, 'handle' | 'title' | 'price'> & {
    featuredImage?: ImageRef | null
    compareAtPrice?: MoneyValue | null
    vendor?: string | null
    productType?: string | null
    tags?: string[]
    options?: { name: string; values: string[] }[]
    availableForSale?: boolean
  },
): ProductCardData {
  return {
    handle: p.handle,
    title: p.title,
    price: p.price,
    featuredImage: p.featuredImage
      ? {
          url: p.featuredImage.url,
          ...(p.featuredImage.altText ? { altText: p.featuredImage.altText } : {}),
        }
      : null,
    ...(p.compareAtPrice ? { compareAtPrice: p.compareAtPrice } : {}),
    ...(p.vendor ? { vendor: p.vendor } : {}),
    ...(p.productType ? { productType: p.productType } : {}),
    ...(p.tags?.length ? { tags: p.tags } : {}),
    // Swatches come from the product's own colour option, not a separate
    // field — there is no swatch data in the contract.
    ...(colourValues(p.options).length ? { swatches: colourValues(p.options) } : {}),
    ...(typeof p.availableForSale === 'boolean' ? { available: p.availableForSale } : {}),
  }
}

/**
 * ProductCardSkeleton — the loading state at the card's FINAL dimensions.
 *
 * The design requires the media placeholder to sit at the real ratio with
 * `aria-busy` on the grid, so the page does not reflow when products arrive.
 */
export function ProductCardSkeleton({
  imageRatio = 'portrait',
}: {
  imageRatio?: Exclude<CardImageRatio, 'adapt'>
}): JSX.Element {
  return (
    <div className="product-card product-card--skeleton" aria-hidden>
      <span className="skeleton skeleton--sm" style={{ aspectRatio: RATIO[imageRatio], display: 'block' }} />
      <span className="skeleton skeleton--sm" style={{ height: 14, width: '80%', marginTop: 12 }} />
      <span className="skeleton skeleton--sm" style={{ height: 14, width: '40%', marginTop: 8 }} />
    </div>
  )
}
