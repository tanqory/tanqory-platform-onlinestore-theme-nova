import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { useProductContext } from '../components/product-context'

/** PDP BLOCK — quantity stepper bound to the shared context (add-to-cart uses it). */
export function QuantitySelector(_props: SectionProps): JSX.Element {
  const ctx = useProductContext()
  if (!ctx) return <></>
  return (
    <div className="quantity" role="group" aria-label="Quantity">
      <button type="button" onClick={() => ctx.setQuantity(Math.max(1, ctx.quantity - 1))} aria-label="Decrease quantity">
        −
      </button>
      <span className="quantity__value">{ctx.quantity}</span>
      <button type="button" onClick={() => ctx.setQuantity(ctx.quantity + 1)} aria-label="Increase quantity">
        +
      </button>
    </div>
  )
}

export default defineSection({
  name: 'quantity',
  title: 'Quantity',
  category: 'block',
  icon: '#',
  attributes: {},
  component: QuantitySelector,
})
