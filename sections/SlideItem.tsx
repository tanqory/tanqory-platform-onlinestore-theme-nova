import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { Button } from '../components/Button'

/**
 * Slide — CHILD BLOCK of Slideshow. One hero slide (image + copy + CTA);
 * the merchant adds/reorders slides from the section tree instead of
 * editing the slides array in settings.
 */
export function SlideItem({ attributes }: SectionProps): JSX.Element {
  const image = attributes.image as string | undefined
  const eyebrow = attributes.eyebrow as string | undefined
  const heading = attributes.heading as string | undefined
  const body = attributes.body as string | undefined
  const buttonLabel = attributes.buttonLabel as string | undefined
  const buttonLink = attributes.buttonLink as string | undefined

  return (
    <div className="tq-slideshow__slide">
      {image && (
        <img
          src={image}
          alt={heading ?? ''}
          className="tq-slideshow__img"
          loading="lazy"
          decoding="async"
        />
      )}
      <div className="tq-slideshow__overlay">
        {eyebrow && <span className="hero__eyebrow">{eyebrow}</span>}
        {heading && <h2 className="tq-slideshow__heading">{heading}</h2>}
        {body && <p className="tq-slideshow__body">{body}</p>}
        {buttonLabel && <Button label={buttonLabel} link={buttonLink} variant="inverse" size="lg" />}
      </div>
    </div>
  )
}

export default defineSection({
  name: 'slide',
  title: 'Slide',
  category: 'block',
  icon: '▭',
  attributes: {
    image: { type: 'image', label: 'Image' },
    eyebrow: { type: 'text', label: 'Eyebrow' },
    heading: { type: 'text', default: 'New slide', label: 'Heading' },
    body: { type: 'textarea', label: 'Body' },
    buttonLabel: { type: 'text', label: 'Button label' },
    buttonLink: { type: 'url', label: 'Button link' },
  },
  component: SlideItem,
})
