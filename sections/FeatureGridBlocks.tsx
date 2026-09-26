import { defineSection, useBoundText, type SectionProps } from '../lib/tanqory/index'
import { SectionHead } from '../components/SectionHead'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

export function FeatureGridBlocks({ attributes, children }: SectionProps): JSX.Element {
  const eyebrow = useBoundText(attributes.eyebrow)
  const heading = useBoundText(attributes.heading)
  const cols = Math.min(Math.max(Number(attributes.columns ?? 3), 2), 4)
  const preset = (attributes.preset as string) ?? '1+4'
  const rowHeight = (attributes.rowHeight as string) ?? 'medium'
  const blockBackground = (attributes.blockBackground as string) ?? 'surface-secondary'

  /*
   * The inline <style> block that used to live here is gone — it re-declared
   * the grid on every placement and hardcoded a 749px breakpoint that is not
   * one of the design's four. The arrangements now live in styles.css, where
   * `preset` can express the design's four mosaics (1+4, 2+2, 3-equal, 1+2);
   * `columns` only applies to the plain equal arrangement.
   */
  return (
    <section {...sharedRootProps(attributes)} className="section feature-grid-blocks">
      <div className="container">
        <SectionHead
          eyebrow={eyebrow}
          heading={heading}
          description={attributes.description as string | undefined}
          align="center"
        />
        <div
          className="feature-grid-blocks__items"
          data-preset={preset}
          data-columns={cols}
          data-row-height={rowHeight}
          data-block-bg={blockBackground}
        >
          {children}
        </div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'feature-grid-blocks',
  role: 'section',
  title: 'Feature grid (blocks)',
  description: 'A grid of features you compose from blocks.',
  category: 'content',
  icon: 'star',
  attributes: withShared({
    description: { type: 'richtext', group: 'Content', label: 'Description' },
    eyebrow: { type: 'text', label: 'Eyebrow', dynamic: true },
    heading: { type: 'text', default: 'Why shop with us', label: 'Heading', dynamic: true },
    columns: { type: 'range', default: 3, min: 2, max: 4, label: 'Columns' },
    preset: {
      type: 'select',
      default: '1+4',
      label: 'Arrangement',
      options: [
        { value: '1+4', label: 'One large, four small' },
        { value: '2+2', label: 'Two and two' },
        { value: '3-equal', label: 'Three equal' },
        { value: '1+2', label: 'One large, two small' },
      ],
    },
    rowHeight: {
      type: 'select',
      default: 'medium',
      label: 'Row height',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
      ],
    },
    blockBackground: {
      type: 'select',
      default: 'surface-secondary',
      label: 'Block background',
      options: [
        { value: 'surface-secondary', label: 'Surface secondary' },
        { value: 'primary', label: 'Primary' },
        { value: 'image', label: 'Block image' },
      ],
    },
  }),
  allowedBlocks: ['column', 'icon', 'heading', 'text'],
  presets: [
    {
      blocks: [
        { type: 'column', settings: { icon: 'truck', heading: 'Shipping', body: 'Describe your delivery options here.' } },
        { type: 'column', settings: { icon: 'shield', heading: 'Secure payment', body: 'Encrypted, trusted checkout.' } },
        { type: 'column', settings: { icon: 'clock', heading: '24/7 support', body: 'Here whenever you need us.' } },
      ],
    },
  ],
  component: FeatureGridBlocks,
})
