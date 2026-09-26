import { richTextHtml } from '../lib/safe-html'
import { defineSection, type SectionProps } from '../lib/tanqory/index'
import { ImageResponsive } from '../components/ImageResponsive'
import { Button } from '../components/Button'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

export function ImageWithText({ attributes }: SectionProps): JSX.Element {
  // `mediaPosition` is the design's enum; `imageRight` is the boolean merchants
  // already have saved. A boolean cannot express a third position, which is why
  // the design replaced it.
  const mediaPosition = (attributes.mediaPosition as string) ?? (attributes.imageRight ? 'right' : 'left')
  const mediaRatio = (attributes.mediaRatio as string) ?? 'adapt'
  const verticalAlign = (attributes.contentVerticalAlign as string) ?? 'center'
  const mobileMediaPosition = (attributes.mobileMediaPosition as string) ?? 'before'
  const buttonVariant = (attributes.buttonVariant as 'secondary' | 'link') ?? 'link'
  const image = attributes.image as string | undefined
  const imageAlt = attributes.imageAlt as string | undefined
  const eyebrow = attributes.eyebrow as string | undefined
  const heading = (attributes.heading as string) ?? 'A story worth telling'
  const body = attributes.body as string | undefined
  const buttonLabel = attributes.buttonLabel as string | undefined
  const buttonLink = attributes.buttonLink as string | undefined

  return (
    <section {...sharedRootProps(attributes)} className="section">
      <div className="container">
        <div
          className="iwt"
          data-media={mediaPosition}
          data-ratio={mediaRatio}
          data-valign={verticalAlign}
          data-mobile-media={mobileMediaPosition}
        >
          <div className="iwt__media">
            <ImageResponsive src={image} alt={imageAlt ?? heading} />
          </div>
          <div className="iwt__body">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2>{heading}</h2>
            {body && <div className="rich-text-body" dangerouslySetInnerHTML={{ __html: richTextHtml(body) }} />}
            {buttonLabel && (
              <div className="cluster">
                <Button
                  label={buttonLabel}
                  link={buttonLink}
                  variant={buttonVariant}
                  {...(buttonVariant === 'link' ? { className: 'btn--forward' } : {})}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'image-with-text',
  role: 'section',
  title: 'Image with text',
  description: 'Image beside a heading and short paragraph.',
  category: 'content',
  icon: '◧',
  attributes: withShared({
    image: {
      type: 'image',
      label: 'Image',
      default: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221400%22%20height%3D%221000%22%3E%3Cdefs%3E%3Cpattern%20id%3D%22s%22%20width%3D%2222.63%22%20height%3D%2222.63%22%20patternUnits%3D%22userSpaceOnUse%22%20patternTransform%3D%22rotate%2845%29%22%3E%3Crect%20width%3D%2222.63%22%20height%3D%2222.63%22%20fill%3D%22%23EFEEEB%22%2F%3E%3Crect%20width%3D%2211.31%22%20height%3D%2222.63%22%20fill%3D%22%23E8E6E2%22%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url%28%23s%29%22%2F%3E%3C%2Fsvg%3E',
    },
    imageAlt: { type: 'text', label: 'Image alt text' },
    mediaPosition: {
      type: 'select',
      default: 'left',
      label: 'Image side',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ],
    },
    mediaRatio: {
      type: 'select',
      default: 'adapt',
      label: 'Image shape',
      options: [
        { value: 'adapt', label: 'Adapt to image' },
        { value: 'portrait', label: 'Portrait' },
        { value: 'square', label: 'Square' },
        { value: 'landscape', label: 'Landscape' },
      ],
    },
    contentVerticalAlign: {
      type: 'select',
      default: 'center',
      label: 'Text vertical position',
      options: [
        { value: 'top', label: 'Top' },
        { value: 'center', label: 'Center' },
      ],
    },
    mobileMediaPosition: {
      type: 'select',
      default: 'before',
      label: 'Image on mobile',
      options: [
        { value: 'before', label: 'Above text' },
        { value: 'after', label: 'Below text' },
      ],
    },
    buttonVariant: {
      type: 'select',
      default: 'link',
      label: 'Button style',
      options: [
        { value: 'secondary', label: 'Secondary' },
        { value: 'link', label: 'Text link' },
      ],
    },
    eyebrow: { type: 'text', label: 'Eyebrow' },
    heading: { type: 'text', default: 'A story worth telling', label: 'Heading' },
    body: {
      type: 'richtext',
      label: 'Body',
      default:
        'Crafted in small batches with materials that age well. Every piece earns its place in your routine.',
    },
    buttonLabel: { type: 'text', label: 'Button label' },
    buttonLink: { type: 'url', label: 'Button link' },
  }),
  component: ImageWithText,
})
