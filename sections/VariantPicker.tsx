import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { useProductContext } from '../components/product-context'

/**
 * PDP BLOCK — option pickers (Size, Color…). Reads the product's option set and
 * writes the selected value back to the shared context, so price + add-to-cart
 * react to the choice.
 */
export function VariantPicker(_props: SectionProps): JSX.Element {
  const ctx = useProductContext()
  if (!ctx || ctx.options.length === 0) return <></>
  return (
    <>
      {ctx.options.map((opt) => (
        <div key={opt.name} className="stack stack--sm">
          <span className="field__label">{opt.name}</span>
          <div className="cluster">
            {opt.values.map((value) => {
              const isActive = ctx.selected[opt.name] === value
              return (
                <button
                  key={value}
                  type="button"
                  className={`btn btn--${isActive ? 'primary' : 'secondary'} btn--sm`}
                  style={{ minWidth: 56 }}
                  aria-pressed={isActive}
                  onClick={() => ctx.setOption(opt.name, value)}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}

export default defineSection({
  name: 'variant-picker',
  title: 'Variant picker',
  category: 'block',
  icon: '◧',
  attributes: {},
  component: VariantPicker,
})
