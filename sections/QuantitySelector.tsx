import { defineSection, type SectionProps } from '../lib/tanqory/index'
import { useProductContext } from '../components/product-context'
import { QuantityStepper } from '../components/QuantityStepper'

/** PDP BLOCK — quantity stepper bound to the shared context (add-to-cart uses it). */
export function QuantitySelector(_props: SectionProps): JSX.Element {
  const ctx = useProductContext()
  if (!ctx) return <></>
  return <QuantityStepper value={ctx.quantity} onChange={ctx.setQuantity} />
}

export default defineSection({
  name: 'quantity',
  role: 'block',
  requiresContext: ['product'],
  title: 'Quantity',
  description: 'A quantity stepper for the current product.',
  category: 'block',
  icon: '#',
  attributes: {},
  component: QuantitySelector,
})
