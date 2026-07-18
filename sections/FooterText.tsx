import { defineSection, useBoundText, type SectionProps } from '@tanqory/theme-kit'

/**
 * Footer BLOCK — a free text column (heading + paragraph). For store hours,
 * a short about line, contact details, etc. Both fields accept a DYNAMIC SOURCE
 * (⛁) so they can pull from a metafield, e.g. shop.metafields.custom.support_hours.
 */
export function FooterText({ attributes }: SectionProps): JSX.Element {
  const heading = useBoundText(attributes.heading)
  const body = useBoundText(attributes.body)
  return (
    <div className="site-footer__col">
      {heading && <h6>{heading}</h6>}
      {body && <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '36ch' }}>{body}</p>}
    </div>
  )
}

export default defineSection({
  name: 'footer-text',
  title: 'Text',
  category: 'block',
  icon: '¶',
  attributes: {
    heading: { type: 'text', label: 'Heading', dynamic: true },
    body: { type: 'textarea', label: 'Text', dynamic: true },
  },
  component: FooterText,
})
