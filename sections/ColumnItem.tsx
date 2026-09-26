import { richTextHtml } from '../lib/safe-html'
import { defineSection, type SectionProps } from '../lib/tanqory/index'
import { Icon } from '../components/Icon'

/**
 * Column — CHILD BLOCK of Multicolumn (category 'block' keeps it out of the
 * Add-section picker). One icon + heading + body card; the merchant adds,
 * reorders, and edits these from the section tree. The icon is a NAMED inline
 * SVG (no emoji) so it inherits theme colour and renders the same everywhere.
 */
export function ColumnItem({ attributes }: SectionProps): JSX.Element {
  const icon = attributes.icon as string | undefined
  const heading = attributes.heading as string | undefined
  const body = attributes.body as string | undefined
  return (
    <div className="multicolumn__item">
      {icon && (
        <div className="multicolumn__icon">
          <Icon name={icon} />
        </div>
      )}
      {heading && <h3>{heading}</h3>}
      {body && <div className="u-text-muted rich-text-body" dangerouslySetInnerHTML={{ __html: richTextHtml(body) }} />}
    </div>
  )
}

export default defineSection({
  name: 'column',
  role: 'block',
  title: 'Column',
  description: 'One column of heading, text and an optional link.',
  category: 'block',
  icon: '▥',
  attributes: {
    icon: {
      type: 'select',
      default: 'star',
      label: 'Icon',
      options: [
        { value: 'truck', label: 'Truck' },
        { value: 'return', label: 'Return' },
        { value: 'chat', label: 'Chat' },
        { value: 'shield', label: 'Shield' },
        { value: 'star', label: 'Star' },
        { value: 'gift', label: 'Gift' },
        { value: 'leaf', label: 'Leaf' },
        { value: 'clock', label: 'Clock' },
      ],
    },
    heading: { type: 'text', default: 'Feature', label: 'Heading' },
    body: { type: 'richtext', label: 'Body' },
  },
  component: ColumnItem,
})
