import { defineSection, useBoundText, type SectionProps } from '@tanqory/theme-kit'

export function FeatureGridBlocks({ attributes, children }: SectionProps): JSX.Element {
  const eyebrow = useBoundText(attributes.eyebrow)
  const heading = useBoundText(attributes.heading)
  const cols = Math.min(Math.max(Number(attributes.columns ?? 3), 2), 4)
  return (
    <section className="section feature-grid-blocks">
      <style>{`
        .feature-grid-blocks__head { max-width: 640px; margin: 0 auto var(--space-8); text-align: center; }
        .feature-grid-blocks__items { display: grid; grid-template-columns: repeat(${cols}, minmax(0, 1fr)); gap: var(--space-8); }
        @media (max-width: 749px) { .feature-grid-blocks__items { grid-template-columns: 1fr; } }
      `}</style>
      <div className="container">
        {(eyebrow || heading) && (
          <div className="feature-grid-blocks__head">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {heading && <h2 style={{ marginTop: 'var(--space-2)' }}>{heading}</h2>}
          </div>
        )}
        <div className="feature-grid-blocks__items">{children}</div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'feature-grid-blocks',
  title: 'Feature grid (blocks)',
  category: 'content',
  icon: 'star',
  attributes: {
    eyebrow: { type: 'text', label: 'Eyebrow', dynamic: true },
    heading: { type: 'text', default: 'Why shop with us', label: 'Heading', dynamic: true },
    columns: { type: 'range', default: 3, min: 2, max: 4, label: 'Columns' },
  },
  allowedBlocks: ['column', 'icon', 'heading', 'text'],
  presets: [
    {
      blocks: [
        { type: 'column', settings: { icon: 'truck', heading: 'Free shipping', body: 'On every order, no minimum.' } },
        { type: 'column', settings: { icon: 'shield', heading: 'Secure payment', body: 'Encrypted, trusted checkout.' } },
        { type: 'column', settings: { icon: 'clock', heading: '24/7 support', body: 'Here whenever you need us.' } },
      ],
    },
  ],
  component: FeatureGridBlocks,
})
