import { richTextHtml } from '../lib/safe-html'
import { useEffect, useState } from 'react'
import { defineSection, useData, type SectionProps } from '../lib/tanqory/index'
import { ImageResponsive } from '../components/ImageResponsive'
import { Money } from '../components/Money'
import { Button } from '../components/Button'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

interface ProductData {
  handle: string
  title: string
  featuredImage: { url: string; altText?: string } | null
  price: { amount: string; currencyCode: string }
}

export function FeaturedProduct({ attributes }: SectionProps): JSX.Element {
  const { productByHandle, collectionByHandle, fetchProduct } = useData()
  const handle = attributes.product as string | undefined
  const fromHandle = handle ? productByHandle(handle) : null
  const fallback = collectionByHandle('all')?.products?.[0] ?? null

  // Live-fetch when the merchant picked a product that wasn't in the
  // bootstrap window. Same pattern as FeaturedCollection — keeps every
  // catalogue handle renderable, not just the prefetched batch.
  const [livePrduct, setLiveProduct] = useState<ProductData | null>(null)
  useEffect(() => {
    if (!handle || fromHandle) {
      setLiveProduct(null)
      return
    }
    // `fetchProduct` is the standard way to pull a product outside the
    // bootstrap window: it shares the request path, headers and error handling
    // with the rest of the data layer, so a shopper in a non-default market
    // sees that market's price here too.
    if (!fetchProduct) return
    let cancelled = false
    void fetchProduct(handle)
      .then((p) => {
        if (cancelled) return
        setLiveProduct(
          p
            ? {
                handle: p.handle,
                title: p.title,
                featuredImage: p.featuredImage
                  ? {
                      url: p.featuredImage.url,
                      ...(p.featuredImage.altText ? { altText: p.featuredImage.altText } : {}),
                    }
                  : null,
                price: p.price,
              }
            : null,
        )
      })
      .catch(() => {
        if (!cancelled) setLiveProduct(null)
      })
    return () => {
      cancelled = true
    }
  }, [handle, fromHandle, fetchProduct])

  const product: ProductData | null =
    fromHandle
      ? {
          handle: fromHandle.handle,
          title: fromHandle.title,
          featuredImage: fromHandle.featuredImage ?? null,
          price: fromHandle.price,
        }
      : livePrduct
        ?? (fallback
          ? {
              handle: fallback.handle,
              title: fallback.title,
              featuredImage: fallback.featuredImage ?? null,
              price: fallback.price,
            }
          : null)

  if (!product) {
    return (
      <section {...sharedRootProps(attributes)} className="section">
        <div className="container">
          <div className="card card--padded card--bordered u-text-center">
            <p className="u-text-muted">Select a product in the editor.</p>
          </div>
        </div>
      </section>
    )
  }

  const eyebrow = attributes.eyebrow as string | undefined
  const body = attributes.body as string | undefined
  const mediaPosition = (attributes.mediaPosition as string) ?? 'left'
  const mediaRatio = (attributes.mediaRatio as string) ?? 'square'
  const descriptionLines = (attributes.descriptionLines as string) ?? '3'
  const showViewDetails = attributes.showViewDetails !== false
  // The section renders a single product card's worth of purchase UI; a full
  // variant picker needs the fetched variant list, which this section does not
  // load. `showVariants` therefore decides whether the CTA goes to the product
  // page (where the picker lives) or adds nothing inline — documented in
  // docs/DESIGN-GAPS.md rather than faked with a picker that cannot resolve a variant.
  const showVariants = attributes.showVariants !== false

  return (
    <section
      {...sharedRootProps(attributes)}
      className="section section--alt"
      data-media={mediaPosition}
      data-ratio={mediaRatio}
    >
      <div className="container">
        <div className="featured-product">
          <div className="featured-product__media">
            <ImageResponsive
              src={product.featuredImage?.url}
              alt={product.featuredImage?.altText ?? product.title}
            />
          </div>
          <div className="featured-product__body">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2 className="featured-product__title">{product.title}</h2>
            <span className="featured-product__price">
              <Money value={product.price} />
            </span>
            {body && descriptionLines !== 'none' && (
              <div
                className="u-text-muted featured-product__desc rich-text-body"
                data-clamp={descriptionLines === '3' ? '3' : undefined}
                dangerouslySetInnerHTML={{ __html: richTextHtml(body) }}
              />
            )}
            <div className="cluster">
              <Button
                label={(attributes.buttonLabel as string) ?? 'Shop now'}
                link={(attributes.buttonLink as string) ?? `/products/${product.handle}`}
                variant="primary"
                size="lg"
              />
              {showViewDetails && (
                <Button
                  label={showVariants ? 'Choose options' : 'View details'}
                  link={`/products/${product.handle}`}
                  variant="ghost"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'featured-product',
  role: 'section',
  title: 'Featured product',
  description: 'One product with price, variants and Add to cart.',
  category: 'commerce',
  icon: '★',
  attributes: withShared({
    eyebrow: { type: 'text', label: 'Eyebrow' },
    product: { type: 'product', label: 'Product' },
    body: { type: 'richtext', label: 'Description' },
    buttonLabel: { type: 'text', default: 'Shop now', label: 'Button label' },
    buttonLink: { type: 'url', label: 'Button link (auto = product page)' },
    mediaPosition: {
      type: 'select',
      default: 'left',
      label: 'Media side',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ],
    },
    mediaRatio: {
      type: 'select',
      default: 'square',
      label: 'Media shape',
      options: [
        { value: 'adapt', label: 'Adapt to image' },
        { value: 'square', label: 'Square' },
        { value: 'portrait', label: 'Portrait' },
      ],
    },
    showVariants: { type: 'boolean', default: true, label: 'Show variant picker' },
    descriptionLines: {
      type: 'select',
      default: '3',
      label: 'Description length',
      options: [
        { value: 'none', label: 'Hide' },
        { value: '3', label: 'Three lines' },
        { value: 'full', label: 'Full' },
      ],
    },
    showViewDetails: { type: 'boolean', default: true, label: 'Show "View details" link' },
  }),
  component: FeaturedProduct,
})
