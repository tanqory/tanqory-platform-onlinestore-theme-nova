import { defineSection, type SectionProps } from '@tanqory/theme-kit'

/** Divider — vertical spacing with an optional hairline rule. */
export function Divider({ attributes }: SectionProps): JSX.Element {
  const height = (attributes.height as number) ?? 48
  const showLine = attributes.showLine === true
  return (
    <div className="divider" style={{ paddingTop: height / 2, paddingBottom: height / 2 }}>
      <div className="container">
        {showLine && <hr className="divider__line" style={{ borderColor: attributes.color as string }} />}
      </div>
    </div>
  )
}

export default defineSection({
  name: 'divider',
  title: 'Divider',
  category: 'layout',
  icon: '—',
  attributes: {
    height: { type: 'range', default: 48, min: 8, max: 160, step: 8, label: 'Height (px)' },
    showLine: { type: 'boolean', default: true, label: 'Show line' },
    color: { type: 'color', default: '#e7e7e9', label: 'Line color' },
  },
  component: Divider,
})
