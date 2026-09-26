import { defineSection, type SectionProps } from '../lib/tanqory/index'
import { HeroComposition } from '../components/HeroComposition'
import { useSlidePosition } from '../components/slide-position'

/**
 * Slide — CHILD BLOCK of Slideshow.
 *
 * The design: "Slides reuse the Hero compositions exactly." So this renders
 * `HeroComposition`, same as `sections/Hero.tsx`. It used to be a third copy of
 * the hero markup with a hardcoded centred stack and a single CTA, which is why
 * the slideshow ignored every hero layout control a merchant set.
 */
export function SlideItem({ attributes }: SectionProps): JSX.Element {
  const a = attributes as Record<string, string | undefined>
  const { index, active } = useSlidePosition()
  // No carousel wrapper here: the slideshow owns it, so the block path and the
  // settings path get identical positioning and transition handling.
  return (
    <HeroComposition
      content={{
        eyebrow: a.eyebrow,
        heading: a.heading,
        subtext: a.body,
        buttonLabel: a.buttonLabel,
        buttonLink: a.buttonLink,
        secondaryLabel: a.secondaryLabel,
        secondaryLink: a.secondaryLink,
        image: a.image,
        mobileImage: a.mobileImage,
      }}
      layout={{
        layout: 'image-background',
        contentPosition: a.contentPosition,
        contentAlignment: a.contentAlignment,
        textWidth: a.textWidth,
        overlay: a.overlay,
        // Exactly one h1 per page, and it follows the slide on screen. Pinning
        // it to slide one left the page with NO h1 as soon as the carousel
        // advanced, because a hidden slide leaves the accessibility tree.
        // A slide outside a slideshow has no position and stays an h2.
        headingLevel: index >= 0 && index === active ? 'h1' : 'h2',
      }}
    />
  )
}

export default defineSection({
  name: 'slide',
  role: 'block',
  title: 'Slide',
  description: 'One slide in a slideshow.',
  category: 'block',
  icon: '▭',
  attributes: {
    image: { type: 'image', label: 'Image' },
    mobileImage: { type: 'image', label: 'Mobile image (optional)' },
    eyebrow: { type: 'text', label: 'Eyebrow' },
    heading: { type: 'text', default: 'New slide', label: 'Heading' },
    body: { type: 'richtext', label: 'Body' },
    buttonLabel: { type: 'text', label: 'Button label' },
    buttonLink: { type: 'url', label: 'Button link' },
    secondaryLabel: { type: 'text', label: 'Secondary button' },
    secondaryLink: { type: 'url', label: 'Secondary button link' },

    // Same approved layout vocabulary as the hero — a slide IS a hero.
    contentPosition: {
      type: 'select',
      label: 'Content position',
      default: 'bottom',
      options: [
        { value: 'top', label: 'Top' },
        { value: 'middle', label: 'Middle' },
        { value: 'bottom', label: 'Bottom' },
      ],
    },
    contentAlignment: { type: 'text_alignment', label: 'Content alignment', default: 'left' },
    textWidth: {
      type: 'select',
      label: 'Text width',
      default: 'narrow',
      options: [
        { value: 'narrow', label: 'Narrow' },
        { value: 'medium', label: 'Medium' },
        { value: 'wide', label: 'Wide' },
      ],
    },
    overlay: {
      type: 'select',
      label: 'Image overlay',
      default: 'medium',
      options: [
        { value: 'none', label: 'None' },
        { value: 'light', label: 'Light' },
        { value: 'medium', label: 'Medium' },
        { value: 'strong', label: 'Strong' },
      ],
    },
  },
  component: SlideItem,
})
