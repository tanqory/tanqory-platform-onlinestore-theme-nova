import { richTextHtml } from '../lib/safe-html'
import { defineSection, type SectionProps } from '../lib/tanqory/index'
import { useFaqCoordination } from '../components/faq-coordination'

/**
 * FAQ item — CHILD BLOCK of FAQ. One question + answer pair; the merchant
 * adds/reorders entries from the section tree instead of editing an
 * items JSON textarea.
 */
export function FaqItem({ attributes }: SectionProps): JSX.Element {
  const q = attributes.question as string | undefined
  const a = attributes.answer as string | undefined
  const { index, isOpen, toggle, coordinated } = useFaqCoordination()

  // A question with no answer rendered as a row that opened onto nothing — a
  // shopper presses it, the chevron turns, and the page shows them an empty
  // gap. The other block that can be half-filled already refuses to render
  // ("Items with no title are not shown" on feature-highlights); this follows
  // the same rule rather than shipping a dead control.
  if (!a || !a.trim()) return <></>

  // Inside an FAQ section the section decides which answer is open, so the
  // "one at a time" and "open the first" settings can actually take effect.
  if (coordinated) {
    const open = isOpen(index)
    return (
      <div className="accordion__item faq__item">
        <h3 className="accordion__heading">
          <button
            type="button"
            className="accordion__trigger"
            aria-expanded={open}
            aria-controls={`faq-panel-${index}`}
            id={`faq-trigger-${index}`}
            onClick={() => toggle(index)}
          >
            <span>{q ?? 'Question'}</span>
            <span className="accordion__chevron" aria-hidden />
          </button>
        </h3>
        <div
          className="accordion__panel"
          id={`faq-panel-${index}`}
          role="region"
          aria-labelledby={`faq-trigger-${index}`}
          hidden={!open}
        >
          {a && <div className="accordion__body rich-text-body" dangerouslySetInnerHTML={{ __html: richTextHtml(a) }} />}
        </div>
      </div>
    )
  }

  // Loose block, outside an FAQ section — manages itself, still works with JS off.
  return (
    <details className="faq__item">
      <summary className="faq__summary">{q ?? 'Question'}</summary>
      {a && <div className="faq__body rich-text-body" dangerouslySetInnerHTML={{ __html: richTextHtml(a) }} />}
    </details>
  )
}

export default defineSection({
  name: 'faq-item',
  role: 'block',
  title: 'Question',
  description: 'One question and its answer.',
  category: 'block',
  icon: '?',
  attributes: {
    question: { type: 'text', default: 'Your question?', label: 'Question' },
    answer: { type: 'richtext', label: 'Answer' },
  },
  component: FaqItem,
})
