import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { useProductContext } from '../components/product-context'

/** PDP BLOCK — the selected variant's SKU (only after the full product loads). */
export function ProductSku(_props: SectionProps): JSX.Element {
  const ctx = useProductContext()
  const sku = ctx?.selectedVariant?.sku
  if (!sku) return <></>
  return <p className="product-details__sku u-text-muted">SKU: {sku}</p>
}

export default defineSection({
  name: 'product-sku',
  title: 'Product SKU',
  category: 'block',
  icon: '⌗',
  attributes: {},
  component: ProductSku,
})
