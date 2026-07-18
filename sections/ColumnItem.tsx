import { defineSection, type SectionProps } from '@tanqory/theme-kit'
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
      {body && <p className="u-text-muted">{body}</p>}
    </div>
  )
}

export default defineSection({
  name: 'column',
  title: 'Column',
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
    body: { type: 'textarea', label: 'Body' },
  },
  component: ColumnItem,
})
