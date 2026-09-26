import { defineSection, type SectionProps } from '../lib/tanqory/index'
import { useProductContext } from '../components/product-context'

/** PDP BLOCK — the product title, from the shared product context. */
export function ProductTitle(_props: SectionProps): JSX.Element {
  const ctx = useProductContext()
  if (!ctx) return <></>
  return <h1 className="product-details__title">{ctx.product.title}</h1>
}

export default defineSection({
  name: 'product-title',
  role: 'block',
  requiresContext: ['product'],
  title: 'Product title',
  description: 'The name of the current product.',
  category: 'block',
  icon: 'T',
  attributes: {},
  component: ProductTitle,
})
