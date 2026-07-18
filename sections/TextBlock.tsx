import { defineSection, type SectionProps } from '@tanqory/theme-kit'

/** Generic TEXT block — a paragraph you compose inside any container (Group). */
export function TextBlock({ attributes }: SectionProps): JSX.Element {
  const text = attributes.text as string | undefined
  if (!text) return <></>
  return (
    <p className="block-text" style={{ textAlign: (attributes.align as 'left' | 'center' | 'right') || 'left' }}>
      {text}
    </p>
  )
}

export default defineSection({
  name: 'text',
  title: 'Text',
  category: 'block',
  icon: '¶',
  attributes: {
    text: { type: 'textarea', default: 'Add your text here.', label: 'Text' },
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
  component: TextBlock,
})
