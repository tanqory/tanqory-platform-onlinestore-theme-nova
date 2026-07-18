import { defineSection, type SectionProps } from '@tanqory/theme-kit'

/** Generic JUMBO TEXT block — oversized display type for a statement moment. */
export function JumboText({ attributes }: SectionProps): JSX.Element {
  const text = attributes.text as string | undefined
  if (!text) return <></>
  return (
    <p className="block-jumbo" style={{ textAlign: (attributes.align as 'left' | 'center' | 'right') || 'center' }}>
      {text}
    </p>
  )
}

export default defineSection({
  name: 'jumbo-text',
  title: 'Jumbo text',
  category: 'block',
  icon: 'A',
  attributes: {
    text: { type: 'text', default: 'Made to last.', label: 'Text' },
    align: {
      type: 'select',
      default: 'center',
      label: 'Alignment',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
    },
  },
  component: JumboText,
})
