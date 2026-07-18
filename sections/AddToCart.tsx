import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { Button } from '../components/Button'
import { useProductContext } from '../components/product-context'

/** PDP BLOCK — the add-to-cart button, wired to the shared context (variant + qty). */
export function AddToCart({ attributes }: SectionProps): JSX.Element {
  const ctx = useProductContext()
  if (!ctx) return <></>
  const label = (attributes.label as string) || 'Add to cart'
  return (
    <div className="cluster" style={{ marginTop: 'var(--space-3)' }}>
      <Button
        label={ctx.soldOut ? 'Sold out' : ctx.adding ? 'Adding…' : label}
        onClick={() => void ctx.add()}
        disabled={ctx.soldOut || ctx.adding}
        variant="primary"
        size="lg"
        fullWidth
      />
    </div>
  )
}

export default defineSection({
  name: 'add-to-cart',
  title: 'Add to cart',
  category: 'block',
  icon: '+',
  attributes: {
    label: { type: 'text', default: 'Add to cart', label: 'Label' },
  },
  component: AddToCart,
})
