// @tq:ai-generated
import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

export function FeatureHighlights({ attributes }: SectionProps): JSX.Element {
  let features: { icon: string; title: string; description: string }[] = []
  try {
    const parsed: unknown = JSON.parse((attributes.features as string) || '[]')
    // An item the merchant has not written yet renders as an empty card with a
    // bare icon, which reads as a broken page rather than an unconfigured one.
    features = Array.isArray(parsed)
      ? (parsed as { icon?: string; title?: string; description?: string }[])
          .filter((f) => typeof f?.title === 'string' && f.title.trim() !== '')
          .map((f) => ({
            icon: f.icon ?? '',
            title: (f.title ?? '').trim(),
            description: (f.description ?? '').trim(),
          }))
      : []
  } catch {
    features = []
  }
  if (features.length === 0) return <></>

  // Background is a semantic ROLE now, not a free-form colour.
  const background = (attributes.background as string) ?? 'surface'
  const columns = Number(attributes.columns ?? 4) === 3 ? 3 : 4
  const iconStyle = (attributes.iconStyle as string) ?? 'outline'
  const textAlignment = (attributes.textAlignment as string) ?? (attributes.textAlign as string) ?? 'center'

  /*
   * The inline <style> block that used to live here is gone. It re-declared the
   * whole grid on every placement, hardcoded a 3-column layout the merchant
   * could not change, and referenced `--radius-lg`, `--color-surface` and
   * `--text-secondary` — none of which exist in the token layer, so the icon
   * chip had no radius and no background at all. The rules now live in
   * styles.css with the rest of the system.
   */
  return (
    <section {...sharedRootProps(attributes)} className="section feature-highlights" data-background={background}>
      <div className="container">
        <div
          className="feature-highlights__grid"
          data-columns={columns}
          data-align={textAlignment}
          data-icon={iconStyle}
        >
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
  role: 'section',
  title: 'Feature Highlights',
  category: 'content',
  icon: 'star',
  attributes: withShared({
    // Structural defaults only. The previous default asserted "Free Shipping —
    // Enjoy free shipping on all orders", which every store that placed this
    // section published verbatim whether or not it was true.
    features: {
      type: 'textarea',
      label: 'Features',
      default:
        '[{"icon":"truck","title":"","description":""},{"icon":"shield","title":"","description":""},{"icon":"clock","title":"","description":""}]',
      info: 'JSON array of { icon, title, description }. Items with no title are not shown.',
    },
    background: {
      type: 'select',
      default: 'surface',
      label: 'Background',
      options: [
        { value: 'surface', label: 'Surface' },
        { value: 'surface-secondary', label: 'Surface secondary' },
        { value: 'primary', label: 'Primary' },
      ],
    },
    columns: {
      type: 'select',
      default: '4',
      label: 'Columns',
      options: [
        { value: '3', label: '3' },
        { value: '4', label: '4' },
      ],
    },
    iconStyle: {
      type: 'select',
      default: 'outline',
      label: 'Icon style',
      options: [
        { value: 'outline', label: 'Outline' },
        { value: 'filled-circle', label: 'Filled circle' },
      ],
    },
    textAlignment: { type: 'text_alignment', default: 'center', label: 'Text alignment' },
  }),
  component: FeatureHighlights,
})