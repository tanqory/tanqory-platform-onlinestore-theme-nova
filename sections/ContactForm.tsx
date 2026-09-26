import { useState } from 'react'
import { isEditorPreview } from '../lib/runtime'
import { defineSection, useT, type SectionProps } from '../lib/tanqory/index'
import { SectionHead } from '../components/SectionHead'
import { StateBlock } from '../components/StateBlock'
import { withShared, sharedRootProps } from '../lib/shared-section-props'
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
  // The design's shared SectionHeader slot is `description` (06 Configuration
  // System). `subheading` is the key this section used before the conversion
  // and is still honoured, so saved merchant content is not orphaned.
  const subheading = stockCopy(attributes.description ?? attributes.subheading, STOCK, undefined, t)
  const buttonLabel = stockCopy(attributes.buttonLabel, STOCK, 'Send message', t)
  // No default endpoint — see Newsletter. Without an action the heading and
  // copy render; the form does not, and the editor says why.
  const action = (attributes.action as string | undefined)?.trim() || undefined
  const layout = (attributes.layout as string) ?? 'stacked'
  const successMessage =
    (attributes.successMessage as string) ?? 'Thanks \u2014 we\u2019ll reply soon.'
  // `fields` is the design's multi-select, expressed as one of three approved
  // combinations because no field type renders chips. `showPhone` is still read
  // so a merchant's saved boolean keeps working.
  const fields = ((attributes.fields as string) ??
    (attributes.showPhone ? 'name,email,phone,message' : 'name,email,message'))
    .split(',')
    .map((f) => f.trim())
  const showName = fields.includes('name')
  const showPhone = fields.includes('phone')

  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // Submitted over fetch so the success message can replace the form in place
  // — a native POST navigates away and the merchant's message is never seen.
  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    const form = e.currentTarget
    setSending(true)
    setError(null)
    try {
      if (!action) return
      const res = await fetch(action, { method: 'POST', body: new FormData(form) })
      if (!res.ok) throw new Error(String(res.status))
      setSent(true)
      form.reset()
    } catch {
      setError(t('contact.sendFailed'))
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <section {...sharedRootProps(attributes)} className="section">
        <div className="container">
          <StateBlock title={successMessage} />
        </div>
      </section>
    )
  }

  return (
    <section {...sharedRootProps(attributes)} className="section">
      <div className="container">
        <div className="contact" data-layout={layout}>
          <SectionHead heading={heading} description={subheading} />
          {!action && isEditorPreview() && (
            <p className="u-text-muted" role="note">{t('contact.noAction')}</p>
          )}
          {action && (
          <form className="contact__form" action={action} method="post" onSubmit={(e) => void submit(e)}>
            {showName && (
              <>
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
              </>
            )}
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
            {error && (
              <p className="field--full u-text-error" role="alert">
                {error}
              </p>
            )}
            <div className="field--full" style={{ marginTop: 'var(--space-3)' }}>
              <button className="btn btn--primary btn--lg" type="submit" disabled={sending}>
                {sending ? 'Sending\u2026' : buttonLabel}
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'contact-form',
  role: 'section',
  title: 'Contact form',
  description: 'Name, email and message fields that send to you.',
  category: 'forms',
  icon: '✉',
  attributes: withShared({
    description: { type: 'richtext', group: 'Content', label: 'Description' },
    heading: { type: 'text', default: 'Get in touch', label: 'Heading' },
    subheading: {
      type: 'text',
      default: "We'll reply within one business day.",
      label: 'Subheading',
    },
    layout: {
      type: 'select',
      default: 'stacked',
      label: 'Layout',
      options: [
        { value: 'stacked', label: 'Stacked' },
        { value: 'split', label: 'Split' },
      ],
    },
    fields: {
      type: 'select',
      default: 'name,email,message',
      label: 'Fields',
      options: [
        { value: 'name,email,message', label: 'Name, email, message' },
        { value: 'name,email,phone,message', label: 'Name, email, phone, message' },
        { value: 'email,message', label: 'Email and message' },
      ],
    },
    successMessage: {
      type: 'text',
      default: 'Thanks — we\u2019ll reply soon.',
      label: 'Success message',
    },
    buttonLabel: { type: 'text', default: 'Send message', label: 'Button label' },
    action: { type: 'url', label: 'Form action URL', info: 'Where the message is posted. The form is shown only when this is set.' },
  }),
  component: ContactForm,
})
