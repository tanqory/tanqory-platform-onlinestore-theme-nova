import { richTextHtml } from '../lib/safe-html'
import { defineSection, type SectionProps } from '../lib/tanqory/index'
import { Button } from '../components/Button'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

export function RichText({ attributes }: SectionProps): JSX.Element {
  // `contentAlignment` is the design's name; `align` is the key merchants
  // already have saved, so both are read.
  const align = (attributes.contentAlignment as 'left' | 'center') ?? (attributes.align as 'left' | 'center') ?? 'center'
  const mobileAlign = (attributes.mobileContentAlignment as string) ?? 'left'
  const headingSize = (attributes.headingSize as string) ?? 'h2'
  const contentWidth = (attributes.contentWidth as string) ?? 'content'
  const buttonVariant = (attributes.buttonVariant as 'primary' | 'secondary' | 'link') ?? 'secondary'
  const eyebrow = attributes.eyebrow as string | undefined
  const heading = attributes.heading as string | undefined
  const body = attributes.body as string | undefined
  const buttonLabel = attributes.buttonLabel as string | undefined
  const buttonLink = attributes.buttonLink as string | undefined

  // A rich-text section is never the page's h1 unless the merchant says so —
  // `headingSize` is the visual scale AND the real heading level, so the
  // document outline follows what is on screen.
  const Heading = (headingSize === 'h1' ? 'h1' : headingSize === 'h3' ? 'h3' : 'h2') as 'h1' | 'h2' | 'h3'

  return (
    <section {...sharedRootProps(attributes)} className="section">
      <div className="container">
        <div
          className="rich-text"
          data-align={align}
          data-mobile-align={mobileAlign}
          data-width={contentWidth}
        >
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          {heading && <Heading className={`rich-text__heading rich-text__heading--${headingSize}`}>{heading}</Heading>}
          {body && <div className="rich-text-body" dangerouslySetInnerHTML={{ __html: richTextHtml(body) }} />}
          {buttonLabel && <Button label={buttonLabel} link={buttonLink} variant={buttonVariant} />}
        </div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'rich-text',
  role: 'section',
  title: 'Rich text',
  description: 'Heading, paragraph and a button, centred.',
  category: 'content',
  icon: '¶',
  attributes: withShared({
    eyebrow: { type: 'text', label: 'Eyebrow' },
    heading: { type: 'text', default: 'About our store', label: 'Heading' },
    body: {
      type: 'richtext',
      default:
        'Tell your story here. A short paragraph about who you are, what you make, and why it matters — three or four sentences is plenty.',
      label: 'Body',
    },
    buttonLabel: { type: 'text', label: 'Button label' },
    buttonLink: { type: 'url', label: 'Button link' },
    headingSize: {
      type: 'select',
      default: 'h2',
      label: 'Heading size',
      options: [
        { value: 'h1', label: 'Large' },
        { value: 'h2', label: 'Medium' },
        { value: 'h3', label: 'Small' },
      ],
    },
    contentAlignment: { type: 'text_alignment', default: 'center', label: 'Alignment' },
    mobileContentAlignment: { type: 'text_alignment', default: 'left', label: 'Alignment on mobile' },
    contentWidth: {
      type: 'select',
      default: 'content',
      label: 'Width',
      options: [
        { value: 'narrow', label: 'Narrow' },
        { value: 'content', label: 'Content' },
        { value: 'standard', label: 'Standard' },
      ],
    },
    buttonVariant: {
      type: 'select',
      default: 'secondary',
      label: 'Button style',
      options: [
        { value: 'primary', label: 'Primary' },
        { value: 'secondary', label: 'Secondary' },
        { value: 'link', label: 'Text link' },
      ],
    },
  }),
  component: RichText,
})
