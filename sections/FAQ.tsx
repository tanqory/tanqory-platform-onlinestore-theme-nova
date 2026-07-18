import { Children } from 'react'
import { defineSection, type SectionProps } from '@tanqory/theme-kit'

type FaqItem = { q?: string; a?: string }

function parseItems(raw: unknown): FaqItem[] {
  if (Array.isArray(raw)) return raw as FaqItem[]
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return JSON.parse(raw) as FaqItem[]
    } catch {
      /* swallow */
    }
  }
  return []
}

const DEFAULT_FAQ: FaqItem[] = [
  {
    q: 'How long does shipping take?',
    a: '3–5 business days within the country, 7–14 days internationally. You\'ll receive a tracking link as soon as your order ships.',
  },
  {
    q: 'What is your return policy?',
    a: 'We accept returns within 30 days of delivery. Items must be unworn, unwashed, and in original packaging with tags attached.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Yes — we ship worldwide. Duties and taxes may apply depending on the destination; rates are calculated at checkout.',
  },
  {
    q: 'How do I care for my pieces?',
    a: 'Each product page lists specific care instructions. As a general rule, we recommend cold water washing and air drying for the longest life.',
  },
]

export function FAQ({ attributes, children }: SectionProps): JSX.Element {
  const items = parseItems(attributes.items)
  const list = items.length > 0 ? items : DEFAULT_FAQ
  // BLOCK MODE: child `faq-item` blocks win over the legacy items JSON.
  const hasBlocks = Children.count(children) > 0
  const eyebrow = attributes.eyebrow as string | undefined
  const heading = (attributes.heading as string) ?? 'Frequently asked questions'

  return (
    <section className="section">
      <div className="container">
        <div className="faq">
          <div className="faq__head">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2>{heading}</h2>
          </div>
          {hasBlocks
            ? children
            : list.map((it, i) => (
                <details key={i} className="faq__item">
                  <summary className="faq__summary">{it.q}</summary>
                  {it.a && <p className="faq__body">{it.a}</p>}
                </details>
              ))}
        </div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'faq',
  title: 'FAQ',
  category: 'content',
  icon: '?',
  attributes: {
    eyebrow: { type: 'text', label: 'Eyebrow' },
    heading: { type: 'text', default: 'Frequently asked questions', label: 'Heading' },
    items: {
      type: 'textarea',
      label: 'Items JSON',
    },
  },
  allowedBlocks: ['faq-item'],
  presets: [
    {
      blocks: [
        { type: 'faq-item', settings: { question: 'What is your return policy?', answer: 'Returns are accepted within 30 days of delivery — no questions asked.' } },
        { type: 'faq-item', settings: { question: 'How long does shipping take?', answer: 'Most orders arrive within 3–5 business days.' } },
        { type: 'faq-item', settings: { question: 'Do you ship internationally?', answer: 'Yes — we ship to most countries worldwide.' } },
      ],
    },
  ],
  component: FAQ,
})
