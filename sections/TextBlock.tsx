import { richTextHtml } from '../lib/safe-html'
import { defineSection, type SectionProps } from '../lib/tanqory/index'

/** Generic TEXT block — a paragraph you compose inside any container (Group). */
export function TextBlock({ attributes }: SectionProps): JSX.Element {
  const text = attributes.text as string | undefined
  if (!text) return <></>
  return (
    <div
      className="block-text rich-text-body"
      style={{ textAlign: (attributes.align as 'left' | 'center' | 'right') || 'left' }}
      dangerouslySetInnerHTML={{ __html: richTextHtml(text) }}
    />
  )
}

export default defineSection({
  name: 'text',
  role: 'block',
  title: 'Text',
  description: 'A paragraph of text.',
  category: 'block',
  icon: '¶',
  attributes: {
    text: { type: 'richtext', default: 'Add your text here.', label: 'Text' },
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
