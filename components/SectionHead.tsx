/**
 * SectionHeader — eyebrow · heading · description · optional "View all" link.
 *
 * This component existed but had ZERO consumers: every section hand-rolled its
 * own `__head` block (`featured-collection__head`, `product-grid__head`,
 * `multicolumn__head`, `logo-list__head`, `faq__head`, `contact__head`, …),
 * which is how eight variants of the same three lines came to exist.
 *
 * Per the design, when the header is centred the "View all" link moves out of
 * the header and below the grid as a secondary button — so alignment changes
 * where the link renders, not just how it aligns.
 */
import { richTextHtml } from '../lib/safe-html'
import { Link } from './Link'

export interface SectionHeadProps {
  eyebrow?: string
  heading?: string
  /** Supporting line under the heading. */
  description?: string
  align?: 'left' | 'center'
  /** Renders a "View all" link on the right when left-aligned. */
  linkHref?: string
  linkLabel?: string
  /**
   * Heading level. Component-internal, not a merchant setting: a section is
   * normally an `h2`, but the section that IS the page needs the `h1`.
   */
  as?: 'h1' | 'h2'
}

export function SectionHead({
  eyebrow,
  heading,
  description,
  align = 'left',
  linkHref,
  linkLabel,
  as: Heading = 'h2',
}: SectionHeadProps): JSX.Element | null {
  if (!eyebrow && !heading && !description) return null
  const showInlineLink = align === 'left' && linkHref && linkLabel

  return (
    <div className={`section-head section-head--${align}`}>
      <div className="section-head__text">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        {heading && <Heading className="section-head__heading">{heading}</Heading>}
        {description && <div className="section-head__sub rich-text-body" dangerouslySetInnerHTML={{ __html: richTextHtml(description) }} />}
      </div>
      {showInlineLink && (
        <Link href={linkHref} className="btn btn--link section-head__link">
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

/** The centred-header companion: "View all" as a secondary button below the grid. */
export function SectionFootLink({
  href,
  label,
}: {
  href?: string
  label?: string
}): JSX.Element | null {
  if (!href || !label) return null
  return (
    <div className="section-head__foot">
      <Link href={href} className="btn btn--secondary">
        {label}
      </Link>
    </div>
  )
}
