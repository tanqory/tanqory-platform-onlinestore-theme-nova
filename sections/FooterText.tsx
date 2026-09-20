import { defineSection, useBoundText, type SectionProps } from '@tanqory/theme-kit'

/**
 * Footer BLOCK — a free text column (heading + paragraph). For store hours,
 * a short about line, contact details, etc. Both fields accept a DYNAMIC SOURCE
 * (⛁) so they can pull from a metafield, e.g. shop.metafields.custom.support_hours.
 */
export function FooterText({ attributes }: SectionProps): JSX.Element {
  const heading = useBoundText(attributes.heading)
  const body = useBoundText(attributes.body)

  // Nothing to say, no column. With neither field set this returned an empty
  // div that still took a full grid column — 282px of blank in the middle of
  // the footer. Same rule as the FAQ item with no answer and the footer menu
  // with no links.
  if (!heading && !body) return <></>

  return (
    <div className="site-footer__col">
      {/* Matches the other footer columns, which are labels rather than
          headings — an <h6> here jumped four levels from the page h2. */}
      {heading && <span className="site-footer__col-title">{heading}</span>}
      {body && <p className="site-footer__muted">{body}</p>}
    </div>
  )
}

export default defineSection({
  name: 'footer-text',
  role: 'block',
  title: 'Text',
  category: 'block',
  icon: '¶',
  attributes: {
    heading: { type: 'text', label: 'Heading', dynamic: true },
    body: { type: 'textarea', label: 'Text', dynamic: true },
  },
  component: FooterText,
})
