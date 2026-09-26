import { useEffect, useState } from 'react'
import { routeHandle } from '../lib/routes'
import { defineSection, useData, type SectionProps, type Product } from '../lib/tanqory/index'
import { SectionHead } from '../components/SectionHead'
import { ProductGrid as CardGrid } from '../components/ProductGrid'
import { toCard } from '../components/ProductCard'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

/**
 * Product recommendations — "You may also like" on the product page. Uses the
 * storefront's `productRecommendations(productId)` (standard). Falls back
 * to a few catalogue products so the section still previews in the editor.
 */
export function ProductRecommendations({ attributes }: SectionProps): JSX.Element {
  const { productByHandle, collectionByHandle, productRecommendations } = useData()
  const handle = typeof window !== 'undefined' ? routeHandle(window.location.pathname, 'product') : undefined
  const [recommended, setRecommended] = useState<Product[]>([])
  const intent = (attributes.intent as string) ?? 'related'

  useEffect(() => {
    let cancelled = false
    const base = handle ? productByHandle(handle) : null
    if (base?.id && productRecommendations) {
      // Feature-detect the second argument: the current signature ignores it,
      // so this is a no-op until the storefront supports intent, and correct
      // the day it does — rather than a control that changes nothing ever.
      const call =
        productRecommendations.length > 1
          ? (productRecommendations as (id: string, o: { intent: string }) => Promise<Product[]>)(base.id, { intent })
          : productRecommendations(base.id)
      call
        .then((r) => { if (!cancelled) setRecommended(r) })
        .catch((err: unknown) => {
          // A silent catch made a broken recommendations endpoint look like a
          // product with nothing related to it.
          // eslint-disable-next-line no-console
          console.warn(`[nova] productRecommendations(${base.id}) failed:`, err)
        })
    }
    return () => { cancelled = true }
  }, [handle, productByHandle, productRecommendations, intent])

  const limit = (attributes.limit as number) ?? 4
  const layout = (attributes.layout as 'grid' | 'carousel') ?? 'carousel'
  const list = (recommended.length > 0 ? recommended : collectionByHandle('all')?.products ?? [])
    .filter((p) => p.handle !== handle)
    .slice(0, limit)
  if (list.length === 0) return <></>

  return (
    <section {...sharedRootProps(attributes)} className="section">
      <div className="container">
        <SectionHead
          heading={(attributes.heading as string) || 'You may also like'}
          description={attributes.description as string | undefined}
        />
        <CardGrid products={list.map(toCard)} layout={layout} carouselOnMobile={layout === 'grid'} />
      </div>
    </section>
  )
}

export default defineSection({
  name: 'product-recommendations',
  role: 'section',
  title: 'Product recommendations',
  description: 'Products related to the one being viewed.',
  category: 'product',
  icon: '✧',
  attributes: withShared({
    description: { type: 'richtext', group: 'Content', label: 'Description' },
    heading: { type: 'text', default: 'You may also like', label: 'Heading' },
    limit: { type: 'range', default: 4, min: 2, max: 8, step: 1, label: 'Products to show' },
    layout: {
      type: 'select',
      default: 'carousel',
      label: 'Layout',
      options: [
        { value: 'grid', label: 'Grid' },
        { value: 'carousel', label: 'Carousel' },
      ],
    },
    intent: {
      type: 'select',
      default: 'related',
      label: 'Recommendation type',
      // `productRecommendations(productId)` takes no intent argument, so
      // `complementary` cannot be requested. See docs/DESIGN-GAPS.md (F20).
      options: [{ value: 'related', label: 'Related products' }],
    },
  }),
  component: ProductRecommendations,
})
