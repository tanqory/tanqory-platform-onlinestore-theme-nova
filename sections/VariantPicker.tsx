import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { useProductContext } from '../components/product-context'
import { VariantPicker as VariantPickerControl } from '../components/VariantPicker'

/**
 * PDP BLOCK — option pickers (Size, Color…). Reads the product's option set and
 * writes the selected value back to the shared context, so price + add-to-cart
 * react to the choice.
 *
 * Delegates to the shared control rather than drawing its own buttons. The
 * hand-rolled copy this replaced used `btn--sm`, which is the design's 36px
 * SMALL button — the option chip is specified at 44px, and 36px also falls
 * under the 44px touch minimum on a phone. It also had no sold-out /
 * unavailable states, so the composed-blocks product page silently disagreed
 * with the inline one about what a shopper could pick.
 */
export function VariantPicker(_props: SectionProps): JSX.Element {
  const ctx = useProductContext()
  if (!ctx || ctx.options.length === 0) return <></>
  return (
    <VariantPickerControl
      options={ctx.options.map((opt) => ({
        name: opt.name,
        // The product's option values are plain strings; the control needs each
        // one's availability, which only the variant matrix knows.
        values: opt.values.map((value) => ({
          value,
          state: ctx.optionValueState?.(opt.name, value) ?? 'available',
        })),
      }))}
      selected={ctx.selected}
      onSelect={(name, value) => ctx.setOption(name, value)}
    />
  )
}

export default defineSection({
  name: 'variant-picker',
  role: 'block',
  requiresContext: ['product'],
  title: 'Variant picker',
  category: 'block',
  icon: '◧',
  attributes: {},
  component: VariantPicker,
})
