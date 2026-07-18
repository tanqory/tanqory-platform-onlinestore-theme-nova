import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { useProductContext } from '../components/product-context'

// A few common colour names → hex so a "Color" option renders as real swatches.
// Unknown values fall back to the value itself (works for hex/named CSS colours).
const COLOR_MAP: Record<string, string> = {
  black: '#0a0a0a', white: '#ffffff', grey: '#9ca3af', gray: '#9ca3af',
  red: '#dc2626', orange: '#ea580c', yellow: '#eab308', green: '#16a34a',
  blue: '#2563eb', navy: '#1e3a5f', purple: '#7c3aed', pink: '#ec4899',
  brown: '#92400e', beige: '#e3d5b8', cream: '#f5efe0', tan: '#d2b48c',
}

/**
 * PDP BLOCK — colour swatches. Renders the product's colour option as circles
 * (vs the text chips of variant-picker) and writes the choice to the shared
 * context so price + add-to-cart react.
 */
export function Swatches(_props: SectionProps): JSX.Element {
  const ctx = useProductContext()
  if (!ctx) return <></>
  const opt = ctx.options.find((o) => /colou?r/i.test(o.name)) ?? ctx.options[0]
  if (!opt) return <></>
  return (
    <div className="stack stack--sm">
      <span className="field__label">{opt.name}</span>
      <div className="swatches">
        {opt.values.map((value) => {
          const isActive = ctx.selected[opt.name] === value
          const color = COLOR_MAP[value.toLowerCase()] ?? value
          return (
            <button
              key={value}
              type="button"
              className={`swatch ${isActive ? 'swatch--active' : ''}`}
              style={{ background: color }}
              aria-label={value}
              aria-pressed={isActive}
              title={value}
              onClick={() => ctx.setOption(opt.name, value)}
            />
          )
        })}
      </div>
    </div>
  )
}

export default defineSection({
  name: 'swatches',
  title: 'Swatches',
  category: 'block',
  icon: '●',
  attributes: {},
  component: Swatches,
})
