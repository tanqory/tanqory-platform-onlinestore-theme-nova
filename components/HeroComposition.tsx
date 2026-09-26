/**
 * HeroComposition — the one hero composition.
 *
 * The design states it plainly: "Slideshow = hero compositions in a carousel
 * with controls." Before this, `Hero` and each slideshow slide were two
 * separate pieces of markup that had drifted apart — the hero grew the
 * approved layout controls (size, 9-grid position, text width, overlay) and
 * the slide kept a hardcoded dead-centre stack with one CTA. A merchant
 * configuring the hero saw none of it reflected in the slideshow.
 *
 * So the composition lives here and both render it. The slideshow adds a track
 * and controls on top; it composes nothing of its own.
 */
import { richTextHtml } from '../lib/safe-html'
import { Button } from './Button'

/** Everything a slide/hero says. */
export interface HeroContent {
  eyebrow?: string
  heading?: string
  subtext?: string
  buttonLabel?: string
  buttonLink?: string
  secondaryLabel?: string
  secondaryLink?: string
  image?: string
  /** Separate art direction for ≤767px, per the design's `mobileImage`. */
  mobileImage?: string
  imageAlt?: string
}

/** How it is arranged. Every value is a semantic preset, never a raw number. */
export interface HeroLayout {
  /** small 400 · medium 480 · large 640 · fullscreen */
  size?: string
  /** `image-background` | `split` | `contained` | `minimal` */
  layout?: string
  /** Vertical third of the 9-grid: top | middle | bottom */
  contentPosition?: string
  /** Horizontal third + text alignment: left | center | right */
  contentAlignment?: string
  /** narrow | medium | wide */
  textWidth?: string
  /** none | light | medium | strong */
  overlay?: string
  imageFit?: string
  /** Which side the media column takes in `split`: left | right. */
  mediaPosition?: string
  /** adapt | landscape | square | portrait — `split` and `contained` only. */
  imageRatio?: string
  /** Overrides `contentAlignment` below 768. */
  mobileContentAlignment?: string
  /** Which comes first once `split` stacks at 768: before | after */
  mobileMediaPosition?: string
  /** `h1` on a real hero; the slideshow demotes every slide after the first. */
  headingLevel?: 'h1' | 'h2'
  /** First slide / above-the-fold hero loads its image eagerly. */
  priority?: boolean
}

const SIZES = new Set(['small', 'medium', 'large', 'fullscreen'])
const LAYOUTS = new Set(['image-background', 'split', 'contained', 'minimal'])

export function HeroComposition({
  content,
  layout: l = {},
}: {
  content: HeroContent
  layout?: HeroLayout
}): JSX.Element {
  const { eyebrow, heading, subtext, buttonLabel, buttonLink, secondaryLabel, secondaryLink } = content

  const hasImage = Boolean(content.image || content.mobileImage)
  // `minimal` is the design's no-media text hero. A layout that needs media but
  // has none falls back to it rather than rendering an empty coloured band.
  const requested = LAYOUTS.has(l.layout ?? '') ? (l.layout as string) : 'image-background'
  const mode = hasImage ? requested : requested === 'contained' ? 'minimal' : 'minimal'

  const onMedia = mode === 'image-background' && hasImage
  const size = SIZES.has(l.size ?? '') ? (l.size as string) : 'medium'
  const align = l.contentAlignment || 'left'
  const position = `${l.contentPosition || 'bottom'}-${align}`
  const Heading = l.headingLevel === 'h2' ? 'h2' : 'h1'

  const body = (
    <div className="hero__inner">
      <div className="hero__content">
        {eyebrow && <span className="hero__eyebrow">{eyebrow}</span>}
        {heading && <Heading className="hero__heading">{heading}</Heading>}
        {subtext && <div className="hero__subtext rich-text-body" dangerouslySetInnerHTML={{ __html: richTextHtml(subtext) }} />}
        {(buttonLabel || secondaryLabel) && (
          <div className="hero__actions">
            {buttonLabel && (
              <Button
                label={buttonLabel}
                link={buttonLink}
                variant={onMedia ? 'inverse' : 'primary'}
                size="lg"
              />
            )}
            {secondaryLabel && (
              <Button
                label={secondaryLabel}
                link={secondaryLink}
                /* On media the secondary is an outline-on-image, not a ghost
                   that disappears into the photograph. */
                variant={onMedia ? 'outline-inverse' : 'secondary'}
                size="lg"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )

  const media = hasImage ? (
    <div className="hero__media">
      {content.mobileImage && content.image ? (
        <picture>
          <source media="(max-width: 767px)" srcSet={content.mobileImage} />
          <img
            className="hero__img"
            src={content.image}
            alt={content.imageAlt ?? ''}
            loading={l.priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        </picture>
      ) : (
        <img
          className="hero__img"
          src={(content.image ?? content.mobileImage) as string}
          alt={content.imageAlt ?? ''}
          loading={l.priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      {onMedia && <div className="hero__scrim" aria-hidden />}
    </div>
  ) : null

  return (
    <div
      className="hero"
      data-layout={mode}
      data-size={size}
      data-position={position}
      data-align={align}
      data-width={l.textWidth || 'narrow'}
      data-overlay={onMedia ? l.overlay || 'medium' : 'none'}
      data-fit={l.imageFit || 'cover'}
      data-media={l.mediaPosition || 'right'}
      data-ratio={l.imageRatio || 'adapt'}
      data-mobile-align={l.mobileContentAlignment || align}
      data-mobile-media={l.mobileMediaPosition || 'before'}
    >
      {media}
      {body}
    </div>
  )
}
