import { defineSection, type SectionProps } from '@tanqory/theme-kit'

/** Generic ACCORDION block — a collapsible heading + body for any container. */
export function AccordionBlock({ attributes }: SectionProps): JSX.Element {
  const heading = attributes.heading as string | undefined
  const body = attributes.body as string | undefined
  if (!heading) return <></>
  return (
    <details className="block-accordion" open={attributes.open === true}>
      <summary className="block-accordion__summary">
        <span>{heading}</span>
        <span className="block-accordion__icon" aria-hidden>+</span>
      </summary>
      {body && <div className="block-accordion__body" dangerouslySetInnerHTML={{ __html: body }} />}
    </details>
  )
}

export default defineSection({
  name: 'accordion',
  title: 'Accordion',
  category: 'block',
  icon: '▽',
  attributes: {
    heading: { type: 'text', default: 'Question', label: 'Heading' },
    body: { type: 'richtext', default: 'Answer goes here.', label: 'Body' },
    open: { type: 'boolean', default: false, label: 'Open by default' },
  },
  component: AccordionBlock,
})
