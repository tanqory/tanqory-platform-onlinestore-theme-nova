import { richTextHtml } from '../lib/safe-html'
import { defineSection, useT, type SectionProps } from '../lib/tanqory/index'
import { isEditorPreview } from '../lib/runtime'
import { Checkbox } from '../components/Field'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

export function Newsletter({ attributes }: SectionProps): JSX.Element {
  const eyebrow = attributes.eyebrow as string | undefined
  const heading = (attributes.heading as string) ?? 'Join the newsletter'
  const body = attributes.body as string | undefined
  const placeholder = (attributes.placeholder as string) ?? 'you@example.com'
  const buttonLabel = (attributes.buttonLabel as string) ?? 'Subscribe'
  const note = attributes.note as string | undefined
  const t = useT()
  // There is no default endpoint: the platform serves nothing at a made-up
  // path, so a form that posted to one landed every shopper on a 404. Without
  // an action the copy still renders; the form does not, and the editor says why.
  const action = (attributes.action as string | undefined)?.trim() || undefined
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
          {body && <div className="lede rich-text-body" dangerouslySetInnerHTML={{ __html: richTextHtml(body) }} />}
          {!action && isEditorPreview() && (
            <p className="newsletter__note" role="note">{t('newsletter.noAction')}</p>
          )}
          {action && (
          <form className="newsletter__form" action={action} method="post">
            <div className="newsletter__row">
              <input
                className="field__input"
                type="email"
                name="email"
                placeholder={placeholder}
                required
                autoComplete="email"
                aria-label={t('newsletter.email')}
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
                  label={t('newsletter.consent')}
                />
              </div>
            )}
          </form>
          )}
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
  description: 'Heading, text and an email field.',
  category: 'marketing',
  icon: '✉',
  attributes: withShared({
    eyebrow: { type: 'text', label: 'Eyebrow' },
    heading: { type: 'text', default: 'Join the newsletter', label: 'Heading' },
    body: {
      type: 'richtext',
      default: 'Be the first to hear about new arrivals and member-only sales.',
      label: 'Body',
    },
    placeholder: { type: 'text', default: 'you@example.com', label: 'Placeholder' },
    buttonLabel: { type: 'text', default: 'Subscribe', label: 'Button label' },
    note: { type: 'text', label: 'Footnote' },
    action: { type: 'url', label: 'Form action URL', info: 'Where the sign-up is posted. The form is shown only when this is set.' },
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
