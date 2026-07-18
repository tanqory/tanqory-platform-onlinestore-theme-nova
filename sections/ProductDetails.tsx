import {
  defineSection,
  getAnalytics,
  useCart,
  useData,
  useT,
  type Product,
  type SectionProps,
} from '@tanqory/theme-kit'
import { decodeHandle } from '../lib/handle'
import { Children, useEffect, useMemo, useState } from 'react'
import { ImageResponsive } from '../components/ImageResponsive'
import { Money } from '../components/Money'
import { Button } from '../components/Button'
import { openOverlay } from '../components/useOverlayChannel'
import { ProductProvider, type ProductContextValue } from '../components/product-context'

const DEFAULT_VARIANT_TITLE = 'Default Title'

export function ProductDetails({ attributes, children }: SectionProps): JSX.Element {
  const { productByHandle, collectionByHandle, fetchProduct, graphql } = useData()
  const cart = useCart()
  const t = useT()
  const isLive = typeof graphql === 'function'

  const handleFromUrl =
    typeof window !== 'undefined'
      ? decodeHandle(window.location.pathname.match(/\/products\/([^/]+)/)?.[1])
      : undefined
  const handle = (attributes.product as string | undefined) || handleFromUrl
  const baseProduct =
    (handle ? productByHandle(handle) : null) ??
    collectionByHandle('all')?.products?.[0] ??
    null

  // Lazily upgrade to the full product (options + variants) for the picker.
  // The bootstrap only carries a default variant id; the full variant list is
  // fetched on demand here (keeps the homepage bootstrap cheap).
  const [detail, setDetail] = useState<Product | null>(null)
  useEffect(() => {
    let cancelled = false
    const h = baseProduct?.handle
    if (!h || !fetchProduct) return
    void fetchProduct(h).then((p) => {
      if (!cancelled && p) setDetail(p)
    })
    return () => {
      cancelled = true
    }
  }, [baseProduct?.handle, fetchProduct])

  const product = detail ?? baseProduct
  const options = product?.options ?? []
  const variants = product?.variants ?? []

  // Selected option values (Size → "M", Color → "Black"). Seeded from the
  // first available variant once the full product loads.
  const [selected, setSelected] = useState<Record<string, string>>({})
  useEffect(() => {
    const seed = variants.find((v) => v.availableForSale) ?? variants[0]
    if (seed?.selectedOptions?.length) {
      setSelected(Object.fromEntries(seed.selectedOptions.map((o) => [o.name, o.value])))
    }
  }, [variants])

  const selectedVariant = useMemo(() => {
    if (!variants.length) return undefined
    if (!options.length) return variants[0]
    return variants.find((v) =>
      (v.selectedOptions ?? []).every((o) => selected[o.name] === o.value),
    )
  }, [variants, options, selected])

  const [activeIdx, setActiveIdx] = useState(0)
  const [adding, setAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)

  if (!product) {
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

  const displayPrice = selectedVariant?.price ?? product.price
  const variantImage = selectedVariant?.image ?? product.featuredImage
  const images = variantImage
    ? [variantImage, variantImage, variantImage, variantImage]
    : []
  const active = images[activeIdx] ?? variantImage

  // Resolve the merchandise id to add. Live: a real variant id (selected →
  // default). Mock (editor/offline): a stable pseudo id keyed by handle so the
  // in-memory cart still works without a backend.
  const variantId =
    selectedVariant?.id ??
    product.variantId ??
    (!isLive ? `mock:${product.handle}` : undefined)

  const variantTitle =
    selectedVariant?.title && selectedVariant.title !== DEFAULT_VARIANT_TITLE
      ? selectedVariant.title
      : undefined

  const soldOut =
    selectedVariant != null
      ? !selectedVariant.availableForSale
      : product.availableForSale === false

  const buttonLabel = (attributes.buttonLabel as string) ?? t('product.addToCart')

  async function handleAdd(): Promise<void> {
    if (!variantId || adding) return
    setAdding(true)
    try {
      await cart.add({
        variantId,
        quantity,
        product: {
          title: product.title,
          price: displayPrice,
          image: variantImage ?? null,
          handle: product.handle,
          ...(variantTitle ? { variantTitle } : {}),
        },
      })
      getAnalytics().track('PRODUCT_ADDED_TO_CART', {
        productId: product.id,
        variantId,
        title: product.title,
        handle: product.handle,
        price: displayPrice,
        quantity,
        ...(variantTitle ? { variantTitle } : {}),
      })
      openOverlay('cart')
    } finally {
      setAdding(false)
    }
  }

  const hasBlocks = Children.count(children) > 0
  const ctx: ProductContextValue = {
    product,
    options,
    variants,
    selected,
    setOption: (name, value) => setSelected((s) => ({ ...s, [name]: value })),
    selectedVariant,
    displayPrice,
    variantImage,
    soldOut,
    quantity,
    setQuantity,
    adding,
    add: handleAdd,
  }

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
                        onClick={() => setSelected((s) => ({ ...s, [opt.name]: value }))}
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
                onClick={() => void handleAdd()}
                disabled={soldOut || adding || !variantId}
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
  // Block-composed PDP (Horizon-style): add blocks into the info column to build
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
