import { defineSection, type SectionProps } from '@tanqory/theme-kit'

/** Generic HEADING block — a title at a chosen level you place in any container. */
export function HeadingBlock({ attributes }: SectionProps): JSX.Element {
  const text = attributes.text as string | undefined
  if (!text) return <></>
  const Tag = (['h1', 'h2', 'h3', 'h4'].includes(attributes.level as string)
    ? (attributes.level as string)
    : 'h2') as 'h1' | 'h2' | 'h3' | 'h4'
  return (
    <Tag className="block-heading" style={{ textAlign: (attributes.align as 'left' | 'center' | 'right') || 'left' }}>
      {text}
    </Tag>
  )
}

export default defineSection({
  name: 'heading',
  title: 'Heading',
  category: 'block',
  icon: 'H',
  attributes: {
    text: { type: 'text', default: 'Heading', label: 'Text' },
    level: {
      type: 'select',
      default: 'h2',
      label: 'Level',
      options: [
        { value: 'h1', label: 'H1' },
        { value: 'h2', label: 'H2' },
        { value: 'h3', label: 'H3' },
        { value: 'h4', label: 'H4' },
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
  component: HeadingBlock,
})
