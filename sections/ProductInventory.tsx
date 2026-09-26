import { defineSection, type SectionProps } from '../lib/tanqory/index'
import { useProductContext } from '../components/product-context'

/** PDP BLOCK — stock status badge, from the shared product context. */
export function ProductInventory({ attributes }: SectionProps): JSX.Element {
  const ctx = useProductContext()
  if (!ctx) return <></>
  const inStock = (attributes.inStockLabel as string) || 'In stock'
  const soldOut = (attributes.soldOutLabel as string) || 'Sold out'
  return <span className="eyebrow">{ctx.soldOut ? soldOut : inStock}</span>
}

export default defineSection({
  name: 'product-inventory',
  role: 'block',
  requiresContext: ['product'],
  title: 'Product inventory',
  description: 'How many of the current product are in stock.',
  category: 'block',
  icon: '◔',
  attributes: {
    inStockLabel: { type: 'text', default: 'In stock', label: 'In-stock label' },
    soldOutLabel: { type: 'text', default: 'Sold out', label: 'Sold-out label' },
  },
  component: ProductInventory,
})
