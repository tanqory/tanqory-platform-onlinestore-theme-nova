import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { Button } from '../components/Button'

/** Generic BUTTON block — a call-to-action you place in any container. */
export function ButtonBlock({ attributes }: SectionProps): JSX.Element {
  const label = attributes.label as string | undefined
  if (!label) return <></>
  return (
    <div className="block-button" style={{ textAlign: (attributes.align as 'left' | 'center' | 'right') || 'left' }}>
      <Button
        label={label}
        link={attributes.link as string | undefined}
        variant={(attributes.variant as 'primary' | 'secondary' | 'ghost' | 'link') || 'primary'}
      />
    </div>
  )
}

export default defineSection({
  name: 'button',
  title: 'Button',
  category: 'block',
  icon: '⬚',
  attributes: {
    label: { type: 'text', default: 'Shop now', label: 'Label' },
    link: { type: 'url', label: 'Link' },
    variant: {
      type: 'select',
      default: 'primary',
      label: 'Style',
      options: [
        { value: 'primary', label: 'Primary' },
        { value: 'secondary', label: 'Secondary' },
        { value: 'ghost', label: 'Ghost' },
        { value: 'link', label: 'Link' },
      ],
    },
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
  component: ButtonBlock,
})
