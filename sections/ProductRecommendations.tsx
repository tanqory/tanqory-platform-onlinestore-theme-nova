import { useEffect, useState } from 'react'
import { decodeHandle } from '../lib/handle'
import { defineSection, useData, type SectionProps, type Product } from '@tanqory/theme-kit'
import { Price } from '../components/Price'

/**
 * Product recommendations — "You may also like" on the product page. Uses the
 * storefront's `productRecommendations(productId)` (Shopify-parity). Falls back
 * to a few catalogue products so the section still previews in the editor.
 */
export function ProductRecommendations({ attributes }: SectionProps): JSX.Element {
  const { productByHandle, collectionByHandle, productRecommendations } = useData()
  const handle =
    typeof window !== 'undefined'
      ? decodeHandle(window.location.pathname.match(/\/products\/([^/]+)/)?.[1])
      : undefined
  const [recommended, setRecommended] = useState<Product[]>([])

  useEffect(() => {
    let cancelled = false
    const base = handle ? productByHandle(handle) : null
    if (base?.id && productRecommendations) {
      productRecommendations(base.id)
        .then((r) => { if (!cancelled) setRecommended(r) })
        .catch(() => {})
    }
    return () => { cancelled = true }
  }, [handle, productByHandle, productRecommendations])

  const limit = (attributes.limit as number) ?? 4
  const list = (recommended.length > 0 ? recommended : collectionByHandle('all')?.products ?? [])
    .filter((p) => p.handle !== handle)
    .slice(0, limit)
  if (list.length === 0) return <></>

  return (
    <section className="section">
      <div className="container">
        <div className="product-grid__head">
          <h2>{(attributes.heading as string) || 'You may also like'}</h2>
        </div>
        <div className="product-grid__grid">
          {list.map((p) => (
            <a key={p.handle} className="product-card" href={`/products/${p.handle}`}>
              <div className="product-card__media">
                {p.featuredImage && (
                  <img src={p.featuredImage.url} alt={p.featuredImage.altText ?? p.title} loading="lazy" decoding="async" />
                )}
              </div>
              <span className="product-card__title">{p.title}</span>
              <span className="product-card__price">
                <Price money={p.price} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'product-recommendations',
  title: 'Product recommendations',
  category: 'product',
  icon: '✧',
  attributes: {
    heading: { type: 'text', default: 'You may also like', label: 'Heading' },
    limit: { type: 'range', default: 4, min: 2, max: 8, step: 1, label: 'Products to show' },
  },
  component: ProductRecommendations,
})
