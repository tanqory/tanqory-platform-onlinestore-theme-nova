import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { Icon } from '../components/Icon'

/** Generic ICON block — a named inline SVG (no emoji) for any container. */
export function IconBlock({ attributes }: SectionProps): JSX.Element {
  return (
    <div className="block-icon" style={{ textAlign: (attributes.align as 'left' | 'center' | 'right') || 'left' }}>
      <Icon name={(attributes.icon as string) || 'star'} size={(attributes.size as number) ?? 32} />
    </div>
  )
}

export default defineSection({
  name: 'icon',
  title: 'Icon',
  category: 'block',
  icon: '✶',
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
    size: { type: 'range', default: 32, min: 16, max: 80, step: 4, label: 'Size (px)' },
    align: {
      type: 'select',
      default: 'left',
      label: 'Alignment',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
    },
  },
  component: IconBlock,
})
