import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { useProductContext } from '../components/product-context'

/** PDP BLOCK — the product description (HTML), from the shared product context. */
export function ProductDescription(_props: SectionProps): JSX.Element {
  const ctx = useProductContext()
  const desc = ctx?.product.description
  if (!desc) return <></>
  return <div className="product-details__desc" dangerouslySetInnerHTML={{ __html: desc }} />
}

export default defineSection({
  name: 'product-description',
  title: 'Product description',
  category: 'block',
  icon: '¶',
  attributes: {},
  component: ProductDescription,
})
