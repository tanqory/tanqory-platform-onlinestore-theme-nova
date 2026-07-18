import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { Money } from '../components/Money'
import { useProductContext } from '../components/product-context'

/** PDP BLOCK — the selected variant's price, from the shared product context. */
export function ProductPrice(_props: SectionProps): JSX.Element {
  const ctx = useProductContext()
  if (!ctx) return <></>
  return (
    <div className="product-details__price">
      <Money value={ctx.displayPrice} />
    </div>
  )
}

export default defineSection({
  name: 'product-price',
  title: 'Product price',
  category: 'block',
  icon: '$',
  attributes: {},
  component: ProductPrice,
})
