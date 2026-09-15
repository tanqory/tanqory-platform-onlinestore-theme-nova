import { defineSection, useT, type SectionProps } from '@tanqory/theme-kit'
import { stockCopy } from '../lib/theme-locale'

/** The English words nova ships in this section's schema and templates, each with its string. */
const STOCK = {
  'Send us a message': 'contact.heading',
  'Get in touch': 'contact.getInTouch',
  'We read every note.': 'contact.subheading',
  "We'll reply within one business day.": 'contact.replyWithinDay',
  'Send message': 'contact.send',
} as const

/**
 * Contact form. Its fixed words — field labels, and a heading, subheading or
 * button still at nova's English default — are in the theme's language; words
 * the merchant typed are shown as typed, and a setting cleared to '' stays
 * hidden. A Thai site read "Send us a message / We read every note." under a
 * Thai contact page before (build 7270019a).
 */
export function ContactForm({ attributes }: SectionProps): JSX.Element {
  const t = useT()
  const heading = stockCopy(attributes.heading, STOCK, 'Get in touch', t)
  const subheading = stockCopy(attributes.subheading, STOCK, undefined, t)
  const buttonLabel = stockCopy(attributes.buttonLabel, STOCK, 'Send message', t)
  const action = (attributes.action as string) ?? '/_api/contact'
  const showPhone = Boolean(attributes.showPhone)

  return (
    <section className="section">
      <div className="container">
        <div className="contact">
          <div className="contact__head">
            {heading && <h2>{heading}</h2>}
            {subheading && <p className="lede">{subheading}</p>}
          </div>
          <form className="contact__form" action={action} method="post">
            <label className="field">
              <span className="field__label">{t('contact.firstName')}</span>
              <input
                className="field__input"
                name="firstName"
                type="text"
                required
                autoComplete="given-name"
              />
            </label>
            <label className="field">
              <span className="field__label">{t('contact.lastName')}</span>
              <input
                className="field__input"
                name="lastName"
                type="text"
                autoComplete="family-name"
              />
            </label>
            <label className="field field--full">
              <span className="field__label">{t('contact.email')}</span>
              <input
                className="field__input"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </label>
            {showPhone && (
              <label className="field field--full">
                <span className="field__label">{t('contact.phone')}</span>
                <input className="field__input" name="phone" type="tel" autoComplete="tel" />
              </label>
            )}
            <label className="field field--full">
              <span className="field__label">{t('contact.message')}</span>
              <textarea className="field__textarea" name="message" required />
            </label>
            <div className="field--full" style={{ marginTop: 'var(--space-3)' }}>
              <button className="btn btn--primary btn--lg" type="submit">
                {buttonLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'contact-form',
  title: 'Contact form',
  category: 'forms',
  icon: '✉',
  attributes: {
    heading: { type: 'text', default: 'Get in touch', label: 'Heading' },
    subheading: {
      type: 'text',
      default: "We'll reply within one business day.",
      label: 'Subheading',
    },
    showPhone: { type: 'boolean', default: false, label: 'Show phone field' },
    buttonLabel: { type: 'text', default: 'Send message', label: 'Button label' },
    action: { type: 'url', label: 'Form action URL' },
  },
  component: ContactForm,
})
