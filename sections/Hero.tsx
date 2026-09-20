import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { HeroComposition } from '../components/HeroComposition'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

/**
 * Hero SECTION — a thin wrapper over the shared composition. Everything about
 * how it is arranged lives in `HeroComposition`, which the slideshow renders
 * too, so the two can no longer drift apart.
 */
export function Hero({ attributes }: SectionProps): JSX.Element {
  const a = attributes as Record<string, string | undefined>
  return (
    <section {...sharedRootProps(attributes)} className="hero-section">
      <HeroComposition
        content={{
          eyebrow: a.eyebrow,
          heading: a.heading || 'Modern essentials',
          subtext: a.subtext,
          buttonLabel: a.buttonLabel,
          buttonLink: a.buttonLink,
          secondaryLabel: a.secondaryLabel,
          secondaryLink: a.secondaryLink,
          image: a.backgroundImage,
          mobileImage: a.mobileImage,
        }}
        layout={{
          size: a.size,
          layout: a.layout,
          contentPosition: a.contentPosition,
          contentAlignment: a.contentAlignment,
          textWidth: a.textWidth,
          overlay: a.overlay,
          imageFit: a.imageFit,
          mediaPosition: a.mediaPosition,
          imageRatio: a.imageRatio,
          mobileContentAlignment: a.mobileContentAlignment,
          mobileMediaPosition: a.mobileMediaPosition,
          headingLevel: 'h1',
          priority: true,
        }}
      />
    </section>
  )
}

export default defineSection({
  name: 'hero',
  role: 'section',
  title: 'Hero',
  category: 'layout',
  icon: '✦',
  attributes: withShared({
    eyebrow: { type: 'text', label: 'Eyebrow' },
    heading: { type: 'text', default: 'Modern essentials', label: 'Heading' },
    subtext: {
      type: 'textarea',
      label: 'Subtext',
      default: 'Designed for everyday rituals — built to last beyond the season.',
    },
    buttonLabel: { type: 'text', default: 'Shop the collection', label: 'Primary button' },
    buttonLink: { type: 'url', default: '/collections/all', label: 'Primary button link' },
    secondaryLabel: { type: 'text', label: 'Secondary button' },
    secondaryLink: { type: 'url', label: 'Secondary button link' },
    backgroundImage: { type: 'image', label: 'Background image' },
    mobileImage: { type: 'image', label: 'Mobile image (optional)' },

    // ── Layout (approved design controls) ────────────────────────────────
    // Semantic presets only: the design system decides the pixel values.
    layout: {
      type: 'select',
      label: 'Layout',
      default: 'image-background',
      options: [
        { value: 'image-background', label: 'Image background' },
        { value: 'split', label: 'Split' },
        { value: 'contained', label: 'Contained media' },
        { value: 'minimal', label: 'Text only' },
      ],
    },
    size: {
      type: 'select',
      label: 'Height',
      default: 'medium',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
        { value: 'fullscreen', label: 'Fullscreen' },
      ],
    },
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
    contentAlignment: {
      type: 'text_alignment',
      label: 'Content alignment',
      default: 'left',
    },
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
      visible_if: "{{ section.settings.backgroundImage != '' }}",
      options: [
        { value: 'none', label: 'None' },
        { value: 'light', label: 'Light' },
        { value: 'medium', label: 'Medium' },
        { value: 'strong', label: 'Strong' },
      ],
    },
    imageFit: {
      type: 'select',
      label: 'Image fit',
      default: 'cover',
      visible_if: "{{ section.settings.backgroundImage != '' }}",
      options: [
        { value: 'cover', label: 'Fill' },
        { value: 'contain', label: 'Fit' },
      ],
    },
    mediaPosition: {
      type: 'select',
      label: 'Media side',
      default: 'right',
      visible_if: "{{ section.settings.layout == 'split' }}",
      options: [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ],
    },
    imageRatio: {
      type: 'select',
      label: 'Media ratio',
      default: 'adapt',
      visible_if: "{{ section.settings.layout != 'image-background' }}",
      options: [
        { value: 'adapt', label: 'Adapt to image' },
        { value: 'landscape', label: 'Landscape' },
        { value: 'square', label: 'Square' },
        { value: 'portrait', label: 'Portrait' },
      ],
    },
    mobileContentAlignment: {
      type: 'text_alignment',
      label: 'Mobile content alignment',
      default: 'left',
    },
    mobileMediaPosition: {
      type: 'select',
      label: 'Mobile media position',
      default: 'before',
      visible_if: "{{ section.settings.layout == 'split' }}",
      options: [
        { value: 'before', label: 'Above content' },
        { value: 'after', label: 'Below content' },
      ],
    },
  }),
  component: Hero,
})
