import { Children } from 'react'
import { defineSection, type SectionProps } from '../lib/tanqory/index'
import { SectionHead } from '../components/SectionHead'
import { Icon } from '../components/Icon'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

type Item = { icon?: string; heading?: string; body?: string }

function parseItems(raw: unknown): Item[] {
  if (Array.isArray(raw)) return raw as Item[]
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return JSON.parse(raw) as Item[]
    } catch {
      /* swallow */
    }
  }
  return []
}

const DEFAULT_ITEMS: Item[] = [
  { icon: 'truck', heading: 'Shipping', body: 'Describe your delivery options here.' },
  { icon: 'return', heading: 'Returns', body: 'Describe your returns policy here.' },
  { icon: 'chat', heading: 'Support', body: 'Tell customers how to reach you.' },
  { icon: 'shield', heading: 'Quality', body: 'Say what makes your products different.' },
]

export function Multicolumn({ attributes, children }: SectionProps): JSX.Element {
  const items = parseItems(attributes.items)
  const list = items.length > 0 ? items : DEFAULT_ITEMS
  // BLOCK MODE: child `column` blocks (editor-managed) win over the legacy
  // items-JSON setting; DEFAULT_ITEMS only backs a fully unconfigured section.
  const hasBlocks = Children.count(children) > 0
  const eyebrow = attributes.eyebrow as string | undefined
  const heading = attributes.heading as string | undefined
  // The design's shared SectionHeader slot is `description` (06 Configuration
  // System). `subheading` is the key this section used before the conversion
  // and is still honoured, so saved merchant content is not orphaned.
  const subheading =
    (attributes.description as string | undefined) ??
    (attributes.subheading as string | undefined)
  const columns = Math.max(2, Math.min(4, Number(attributes.columns ?? 3) || 3))
  const showImage = attributes.showImage !== false
  const imageRatio = (attributes.imageRatio as string) ?? 'landscape'
  const textAlignment = (attributes.textAlignment as string) ?? 'left'
  const carouselOnMobile = attributes.carouselOnMobile === true

  return (
    <section {...sharedRootProps(attributes)} className="section section--alt">
      <div className="container">
        {(heading || subheading) && (
          <SectionHead eyebrow={eyebrow} heading={heading} description={subheading} />
        )}
        <div
          className="multicolumn__grid"
          data-columns={columns}
          data-align={textAlignment}
          data-ratio={imageRatio}
          data-image={showImage ? 'true' : 'false'}
          data-carousel-mobile={carouselOnMobile ? 'true' : undefined}
        >
          {hasBlocks ? children : list.map((item, i) => (
            <div key={`${item.heading ?? ''}|${item.body ?? ''}|${i}`} className="multicolumn__item">
              {item.icon && <div className="multicolumn__icon"><Icon name={item.icon} /></div>}
              {item.heading && <h3>{item.heading}</h3>}
              {item.body && <p className="u-text-muted">{item.body}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'multicolumn',
  role: 'section',
  title: 'Multicolumn',
  description: 'Two to four columns of heading and text.',
  category: 'content',
  icon: '⫴',
  attributes: withShared({
    description: { type: 'richtext', group: 'Content', label: 'Description' },
    eyebrow: { type: 'text', label: 'Eyebrow' },
    heading: { type: 'text', default: 'Why shop with us', label: 'Heading' },
    subheading: { type: 'text', label: 'Subheading' },
    columns: { type: 'range', default: 3, min: 2, max: 4, step: 1, label: 'Columns' },
    showImage: { type: 'boolean', default: true, label: 'Show images' },
    imageRatio: {
      type: 'select',
      default: 'landscape',
      label: 'Image shape',
      visible_if: '{{ section.settings.showImage == true }}',
      options: [
        { value: 'landscape', label: 'Landscape' },
        { value: 'square', label: 'Square' },
        { value: 'portrait', label: 'Portrait' },
      ],
    },
    textAlignment: { type: 'text_alignment', default: 'left', label: 'Text alignment' },
    carouselOnMobile: { type: 'boolean', default: false, label: 'Swipe row on mobile' },
  }),
  allowedBlocks: ['column'],
  presets: [
    {
      blocks: [
        { type: 'column', settings: { icon: 'truck', heading: 'Shipping', body: 'Describe your delivery options here.' } },
        { type: 'column', settings: { icon: 'return', heading: 'Returns', body: 'Describe your returns policy here.' } },
        { type: 'column', settings: { icon: 'chat', heading: 'Support', body: 'Tell customers how to reach you.' } },
      ],
    },
  ],
  component: Multicolumn,
})
