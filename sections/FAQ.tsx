import { Children, useState } from 'react'
import { defineSection, type SectionProps } from '../lib/tanqory/index'
import { SectionHead } from '../components/SectionHead'
import { Accordion } from '../components/Disclosure'
import { FaqCoordinationProvider } from '../components/faq-coordination'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

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
    a: 'Describe your returns window and the condition items must be in. This answer is starter content — replace it with your own policy.',
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

  const singleOpen = attributes.singleOpen === true
  const firstOpen = attributes.firstOpen !== false
  const headerAlignment = (attributes.headerAlignment as 'left' | 'center') ?? 'left'
  const [open, setOpen] = useState<number[]>(firstOpen ? [0] : [])

  return (
    <section {...sharedRootProps(attributes)} className="section">
      <div className="container">
        <div className="faq" data-align={headerAlignment}>
          <SectionHead
            eyebrow={eyebrow}
            heading={heading}
            description={attributes.description as string | undefined}
            align={headerAlignment}
          />
          {hasBlocks ? (
            // The section owns the open state so `singleOpen` and `firstOpen`
            // work here too. They previously did nothing in block mode — which
            // is the mode the section's own preset ships.
            <div className="accordion">
              {Children.map(children, (child, i) => (
                <FaqCoordinationProvider
                  value={{
                    index: i,
                    coordinated: true,
                    isOpen: (n) => open.includes(n),
                    toggle: (n) =>
                      setOpen((cur) =>
                        cur.includes(n)
                          ? cur.filter((x) => x !== n)
                          : singleOpen
                            ? [n]
                            : [...cur, n],
                      ),
                  }}
                >
                  {child}
                </FaqCoordinationProvider>
              ))}
            </div>
          ) : (
            <Accordion
              /* A content accordion: few panels, each uniquely titled, so each
                 is a useful landmark. The collection filters are not. */
              landmarks
              singleOpen={singleOpen}
              defaultOpen={firstOpen && list[0] ? ['faq-0'] : []}
              items={list.map((it, i) => ({
                id: `faq-${i}`,
                title: it.q ?? '',
                body: it.a ?? '',
              }))}
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'faq',
  role: 'section',
  title: 'FAQ',
  description: 'Questions and answers that open on tap.',
  category: 'content',
  icon: '?',
  attributes: withShared({
    description: { type: 'richtext', group: 'Content', label: 'Description' },
    eyebrow: { type: 'text', label: 'Eyebrow' },
    heading: { type: 'text', default: 'Frequently asked questions', label: 'Heading' },
    singleOpen: { type: 'boolean', default: false, label: 'Only one answer open at a time' },
    firstOpen: { type: 'boolean', default: true, label: 'Open the first answer' },
    headerAlignment: { type: 'text_alignment', default: 'left', label: 'Header alignment' },
  }),
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
