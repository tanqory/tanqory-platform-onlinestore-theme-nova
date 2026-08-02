import { defineSection, useT, type SectionProps } from '@tanqory/theme-kit'
import { useProductPage } from '@tanqory/theme-kit/app'
import { Children, useState } from 'react'
import { ImageResponsive } from '../components/ImageResponsive'
import { Money } from '../components/Money'
import { Button } from '../components/Button'
import { ProductProvider } from '../components/product-context'

/**
 * Nova's product page — MARKUP ONLY.
 *
 * The whole state machine (handle from the URL, the lazy full-product upgrade,
 * option→variant matching, quantity, sold-out, the variant's price and image,
 * and `add()` with its `PRODUCT_ADDED_TO_CART` + open-cart sequence) lives in
 * `useProductPage()` in @tanqory/theme-kit/app, shared by every theme. The
 * value it returns IS the `ProductContextValue` the PDP blocks read, so this
 * section just hands it to the provider and draws.
 */
export function ProductDetails({ attributes, children }: SectionProps): JSX.Element {
  const ctx = useProductPage(attributes)
  const t = useT()
  const [activeIdx, setActiveIdx] = useState(0)

  if (!ctx) {
    return (
      <section className="section">
        <div className="container">
          <div className="not-found">
            <h2>{t('product.notFound.title')}</h2>
            <p className="u-text-muted">{t('product.notFound.sub')}</p>
            <Button label={t('common.shopCollection')} link="/collections/all" variant="primary" />
          </div>
        </div>
      </section>
    )
  }

  const { product, options, selected, setOption, displayPrice, variantImage, soldOut, adding } = ctx

  const images = variantImage
    ? [variantImage, variantImage, variantImage, variantImage]
    : []
  const active = images[activeIdx] ?? variantImage

  const buttonLabel = (attributes.buttonLabel as string) ?? t('product.addToCart')
  const hasBlocks = Children.count(children) > 0

  return (
    <ProductProvider value={ctx}>
    <section className="section">
      <div className="container">
        <div className="product-details">
          <div className="product-details__gallery">
            <div className="product-details__hero">
              {active && (
                <ImageResponsive src={active.url} alt={active.altText ?? product.title} />
              )}
            </div>
            {images.length > 1 && (
              <div className="product-details__thumbs">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    className="product-details__thumb"
                    aria-current={i === activeIdx}
                    onClick={() => setActiveIdx(i)}
                  >
                    <img src={img.url} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-details__body">
            {hasBlocks ? children : (
            <>
            <div className="stack stack--sm">
              <span className="eyebrow">{soldOut ? t('product.soldOut') : 'In stock · Ships in 24h'}</span>
              <h1 className="product-details__title">{product.title}</h1>
              <div className="product-details__price">
                <Money value={displayPrice} />
              </div>
            </div>

            <p className="product-details__desc">
              {product.description ??
                'A quietly considered piece — clean lines, soft hand, made to last.'}
            </p>

            {/* Real option pickers (Size, Color…) — rendered from the product's
                option set once the full product loads. Single-variant products
                (no options) skip this entirely. */}
            {options.map((opt) => (
              <div key={opt.name} className="stack stack--sm">
                <span className="field__label">{opt.name}</span>
                <div className="cluster">
                  {opt.values.map((value) => {
                    const isActive = selected[opt.name] === value
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`btn btn--${isActive ? 'primary' : 'secondary'} btn--sm`}
                        style={{ minWidth: 56 }}
                        aria-pressed={isActive}
                        onClick={() => setOption(opt.name, value)}
                      >
                        {value}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="cluster" style={{ marginTop: 'var(--space-3)' }}>
              <Button
                label={soldOut ? t('product.soldOut') : adding ? t('product.adding') : buttonLabel}
                onClick={() => void ctx.add()}
                disabled={soldOut || adding || !ctx.variantId}
                variant="primary"
                size="lg"
                fullWidth
              />
            </div>

            <details style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
              <summary
                style={{
                  cursor: 'pointer',
                  listStyle: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 500,
                }}
              >
                {t('product.materials')}
                <span aria-hidden>+</span>
              </summary>
              <p className="u-text-muted" style={{ marginTop: 'var(--space-3)', lineHeight: 'var(--leading-loose)' }}>
                100% organic cotton. Machine wash cold, line dry. Iron on low if needed.
              </p>
            </details>

            <details>
              <summary
                style={{
                  cursor: 'pointer',
                  listStyle: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 500,
                }}
              >
                {t('product.shipping')}
                <span aria-hidden>+</span>
              </summary>
              <p className="u-text-muted" style={{ marginTop: 'var(--space-3)', lineHeight: 'var(--leading-loose)' }}>
                Free shipping on orders over $50. 30-day returns on unworn items.
              </p>
            </details>
            </>
            )}
          </div>
        </div>
      </div>
    </section>
    </ProductProvider>
  )
}

export default defineSection({
  name: 'product-details',
  title: 'Product details',
  category: 'commerce',
  icon: '◉',
  attributes: {
    product: { type: 'product', label: 'Product (preview only — URL :handle is canonical)' },
    buttonLabel: { type: 'text', default: 'Add to cart', label: 'Add to cart label' },
    buttonLink: { type: 'url', label: 'Add to cart link override' },
  },
  // Block-composed PDP (standard): add blocks into the info column to build
  // the product page from parts. With no blocks, the default layout renders.
  allowedBlocks: [
    'product-title', 'product-price', 'variant-picker', 'swatches', 'quantity',
    'add-to-cart', 'product-description', 'product-sku', 'product-inventory',
    'text', 'heading', 'button', 'image', 'icon', 'spacer', 'accordion', 'social-links', 'payment-icons',
  ],
  presets: [
    {
      blocks: [
        { type: 'product-title', settings: {} },
        { type: 'product-price', settings: {} },
        { type: 'variant-picker', settings: {} },
        { type: 'quantity', settings: {} },
        { type: 'add-to-cart', settings: {} },
        { type: 'product-description', settings: {} },
      ],
    },
  ],
  component: ProductDetails,
})
