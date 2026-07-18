// @tq:ai-generated
import { defineSection, useBoundText, type SectionProps } from '@tanqory/theme-kit'

export function FeatureHighlights({ attributes }: SectionProps): JSX.Element {
  let features: { icon: string; title: string; description: string }[] = []
  try {
    features = JSON.parse((attributes.features as string) || '[]')
  } catch {
    features = []
  }
  const bgColor = (attributes.background as string) || 'transparent'
  const alignLeft = attributes.textAlign === 'left'

  return (
    <section className="section feature-highlights" style={{ background: bgColor }}>
      <style>{`
        .feature-highlights__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-10); text-align: center; }
        .feature-highlights__icon { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-lg, 16px); background: var(--color-surface, #f7f7f7); margin-bottom: var(--space-4); }
        .feature-highlights__icon svg { width: 24px; height: 24px; stroke: currentColor; }
        .feature-highlights__title { margin-top: var(--space-2); font-weight: bold; font-size: 1.2em; }
        .feature-highlights__description { margin-top: var(--space-2); color: var(--text-secondary); line-height: var(--leading-loose); }
        @media (max-width: 749px) {
          .feature-highlights__grid { grid-template-columns: 1fr; text-align: ${alignLeft ? 'left' : 'center'}; }
        }
      `}</style>
      <div className="container">
        <div className="feature-highlights__grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-highlights__item">
              <div className="feature-highlights__icon">
                <svg><use href={`#${feature.icon}`} /></svg>
              </div>
              <div className="feature-highlights__title">{feature.title}</div>
              <div className="feature-highlights__description">{feature.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'feature-highlights',
  title: 'Feature Highlights',
  category: 'content',
  icon: 'star',
  attributes: {
    features: { 
      type: 'textarea', 
      label: 'Features', 
      default: '[{"icon":"truck","title":"Free Shipping","description":"Enjoy free shipping on all orders."},{"icon":"shield","title":"Secure Payment","description":"Your payment information is safe with us."},{"icon":"clock","title":"Fast Delivery","description":"Get your orders delivered quickly."}]' 
    },
    background: { type: 'color', label: 'Background Color' },
    textAlign: { type: 'select', label: 'Text Alignment', default: 'center', options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' }
    ]}
  },
  component: FeatureHighlights,
})