import { Children } from 'react'
import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { Icon } from '../components/Icon'

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
  { icon: 'truck', heading: 'Free shipping', body: 'On orders over $50.' },
  { icon: 'return', heading: 'Easy returns', body: '30 days, no questions asked.' },
  { icon: 'chat', heading: 'Real support', body: 'Chat with us 24/7.' },
  { icon: 'shield', heading: 'Made to last', body: 'Built with materials that age well.' },
]

export function Multicolumn({ attributes, children }: SectionProps): JSX.Element {
  const items = parseItems(attributes.items)
  const list = items.length > 0 ? items : DEFAULT_ITEMS
  // BLOCK MODE: child `column` blocks (editor-managed) win over the legacy
  // items-JSON setting; DEFAULT_ITEMS only backs a fully unconfigured section.
  const hasBlocks = Children.count(children) > 0
  const eyebrow = attributes.eyebrow as string | undefined
  const heading = attributes.heading as string | undefined
  const subheading = attributes.subheading as string | undefined

  return (
    <section className="section section--alt">
      <div className="container">
        {(heading || subheading) && (
          <div className="multicolumn__head">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {heading && <h2>{heading}</h2>}
            {subheading && <p className="lede">{subheading}</p>}
          </div>
        )}
        <div className="multicolumn__grid">
          {hasBlocks ? children : list.map((item, i) => (
            <div key={i} className="multicolumn__item">
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
  title: 'Multicolumn',
  category: 'content',
  icon: '⫴',
  attributes: {
    eyebrow: { type: 'text', label: 'Eyebrow' },
    heading: { type: 'text', default: 'Why shop with us', label: 'Heading' },
    subheading: { type: 'text', label: 'Subheading' },
    items: {
      type: 'textarea',
      label: 'Items JSON (legacy — prefer Add block)',
    },
  },
  allowedBlocks: ['column'],
  presets: [
    {
      blocks: [
        { type: 'column', settings: { icon: 'truck', heading: 'Free shipping', body: 'On orders over $50.' } },
        { type: 'column', settings: { icon: 'return', heading: 'Easy returns', body: '30 days, no questions asked.' } },
        { type: 'column', settings: { icon: 'chat', heading: 'Real support', body: 'Chat with us 24/7.' } },
      ],
    },
  ],
  component: Multicolumn,
})
