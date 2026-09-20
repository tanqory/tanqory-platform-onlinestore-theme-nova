import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { Checkbox } from '../components/Field'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

export function Newsletter({ attributes }: SectionProps): JSX.Element {
  const eyebrow = attributes.eyebrow as string | undefined
  const heading = (attributes.heading as string) ?? 'Join the newsletter'
  const body = attributes.body as string | undefined
  const placeholder = (attributes.placeholder as string) ?? 'you@example.com'
  const buttonLabel = (attributes.buttonLabel as string) ?? 'Subscribe'
  const note = attributes.note as string | undefined
  const action = attributes.action as string | undefined
  // Background is a three-role preset; `inverse` was a boolean that could only
  // ever express two of them.
  const background =
    (attributes.background as string) ?? (attributes.inverse ? 'primary' : 'surface-secondary')
  const layout = (attributes.layout as string) ?? 'centered'
  const showConsent = attributes.showConsent === true
  const onPrimary = background === 'primary'

  return (
    <section {...sharedRootProps(attributes)} className="section" data-background={background}>
      <div className="container">
        <div className="newsletter" data-layout={layout}>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{heading}</h2>
          {body && <p className="lede">{body}</p>}
          <form className="newsletter__form" action={action ?? '/_api/newsletter'} method="post">
            <div className="newsletter__row">
              <input
                className="field__input"
                type="email"
                name="email"
                placeholder={placeholder}
                required
                autoComplete="email"
                aria-label="Email address"
              />
              <button className={`btn ${onPrimary ? 'btn--inverse' : 'btn--primary'}`} type="submit">
                {buttonLabel}
              </button>
            </div>
            {showConsent && (
              /* An explicit, unchecked consent box — required wherever
                 opt-in must be affirmative, and never pre-ticked.
                 It must live INSIDE the form: it used to sit after `</form>`
                 with no `form=` attribute, so it was never serialized and every
                 subscription was recorded with no consent at all — the exact
                 opposite of what the control promises. */
              <div className="newsletter__consent">
                <Checkbox
                  name="marketingConsent"
                  value="yes"
                  label="Email me about new arrivals and offers."
                />
              </div>
            )}
          </form>
          {note && <small className="newsletter__note">{note}</small>}
        </div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'newsletter',
  role: 'section',
  title: 'Newsletter',
  category: 'marketing',
  icon: '✉',
  attributes: withShared({
    eyebrow: { type: 'text', label: 'Eyebrow' },
    heading: { type: 'text', default: 'Join the newsletter', label: 'Heading' },
    body: {
      type: 'textarea',
      default: 'Be the first to hear about new arrivals and member-only sales — and get 10% off your first order.',
      label: 'Body',
    },
    placeholder: { type: 'text', default: 'you@example.com', label: 'Placeholder' },
    buttonLabel: { type: 'text', default: 'Subscribe', label: 'Button label' },
    note: { type: 'text', default: 'No spam. Unsubscribe anytime.', label: 'Footnote' },
    action: { type: 'url', label: 'Form action URL' },
    layout: {
      type: 'select',
      default: 'centered',
      label: 'Layout',
      options: [
        { value: 'centered', label: 'Centered' },
        { value: 'split', label: 'Split' },
      ],
    },
    background: {
      type: 'select',
      default: 'surface-secondary',
      label: 'Background',
      options: [
        { value: 'surface', label: 'Surface' },
        { value: 'surface-secondary', label: 'Surface secondary' },
        { value: 'primary', label: 'Primary' },
      ],
    },
    showConsent: { type: 'boolean', default: false, label: 'Show marketing consent checkbox' },
  }),
  component: Newsletter,
})
