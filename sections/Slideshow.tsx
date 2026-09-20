import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { Children, useEffect, useState } from 'react'
import { HeroComposition } from '../components/HeroComposition'
import { SlidePositionProvider } from '../components/slide-position'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

type Slide = {
  image?: string
  eyebrow?: string
  heading?: string
  body?: string
  buttonLabel?: string
  buttonLink?: string
  secondaryLabel?: string
  secondaryLink?: string
  contentPosition?: string
  contentAlignment?: string
  textWidth?: string
  overlay?: string
}

function parseSlides(raw: unknown): Slide[] {
  if (Array.isArray(raw)) return raw as Slide[]
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return JSON.parse(raw) as Slide[]
    } catch {
      /* swallow */
    }
  }
  return []
}

const DEFAULT_SLIDES: Slide[] = [
  {
    image: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%22700%22%3E%3Cdefs%3E%3Cpattern%20id%3D%22s%22%20width%3D%2222.63%22%20height%3D%2222.63%22%20patternUnits%3D%22userSpaceOnUse%22%20patternTransform%3D%22rotate%2845%29%22%3E%3Crect%20width%3D%2222.63%22%20height%3D%2222.63%22%20fill%3D%22%23EFEEEB%22%2F%3E%3Crect%20width%3D%2211.31%22%20height%3D%2222.63%22%20fill%3D%22%23E8E6E2%22%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url%28%23s%29%22%2F%3E%3C%2Fsvg%3E',
    eyebrow: 'New season',
    heading: 'Modern essentials',
    body: 'A clean starter storefront powered by Tanqory sections.',
    buttonLabel: 'Shop the collection',
    buttonLink: '/collections/all',
    secondaryLabel: 'Explore collections',
    secondaryLink: '/collections',
  },
]

export function Slideshow({ attributes, children }: SectionProps): JSX.Element {
  const parsed = parseSlides(attributes.slides)
  // BLOCK MODE: child `slide` blocks (editor-managed, reorderable) win over
  // the legacy slides array in settings; DEFAULT_SLIDES only backs a fully
  // unconfigured section.
  const blockCount = Children.count(children)
  const slides = parsed.length > 0 ? parsed : DEFAULT_SLIDES
  const slideCount = blockCount > 0 ? blockCount : slides.length
  // The design offers 4s / 6s / 8s as presets, not a free-form millisecond box.
  const interval = { '4s': 4000, '6s': 6000, '8s': 8000 }[(attributes.interval as string) ?? '6s'] ?? 6000
  const size = (attributes.slideHeight as string) ?? 'medium'
  const autoplay = attributes.autoplay !== false
  const controls = (attributes.controls as string) ?? 'arrows+counter'
  const transition = (attributes.transition as string) ?? 'fade'
  // "Counter replaces dots ≥ 6 slides" — a dot row of 12 is unreadable.
  const showDots = controls === 'dots' || (controls === 'arrows+counter' && slideCount < 6)
  const showCluster = controls === 'arrows+counter'
  const controlsPosition = (attributes.controlsPosition as string) ?? 'bottom-right'
  // The design: "Slideshow with one slide renders as hero (no controls)."
  const hasControls = slideCount > 1 && controls !== 'none'
  const [idx, setIdx] = useState(0)
  /**
   * Hover-pause and the explicit Pause control are SEPARATE.
   *
   * They used to share one flag, and `onMouseLeave` cleared it unconditionally.
   * Because the control lives inside the hovered section, `paused` was already
   * true from hover by the time the pointer reached it: the button rendered as
   * "Resume slideshow", and clicking it STARTED autoplay. For a keyboard or
   * touch user who did manage to pause, the next mouseenter/mouseleave silently
   * restarted rotation — a WCAG 2.2.2 control that does not hold.
   */
  const [stopped, setStopped] = useState(false)
  const [hovered, setHovered] = useState(false)
  const paused = stopped || hovered

  useEffect(() => {
    if (slideCount < 2 || paused || !autoplay) return
    const id = window.setInterval(() => setIdx((i) => (i + 1) % slideCount), interval)
    return () => window.clearInterval(id)
  }, [slideCount, paused, interval, autoplay])

  const go = (n: number) => setIdx(((n % slideCount) + slideCount) % slideCount)

  return (
    <section {...sharedRootProps(attributes)}
      className="tq-slideshow"
      data-controls={controlsPosition}
      data-transition={transition}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="tq-slideshow__viewport" data-size={size}>
        <div
          className="tq-slideshow__track"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {blockCount > 0
            ? Children.map(children, (child, i) => (
                <div className="tq-slideshow__slide" data-active={i === idx ? 'true' : 'false'}>
                  {/* The slide block cannot know its own position, and the
                      heading level depends on it — so the slideshow tells it. */}
                  <SlidePositionProvider value={{ index: i, active: idx }}>{child}</SlidePositionProvider>
                </div>
              ))
            : slides.map((slide, i) => (
            <div key={i} className="tq-slideshow__slide" data-active={i === idx ? 'true' : 'false'}>
              <HeroComposition
                content={{
                  eyebrow: slide.eyebrow,
                  heading: slide.heading,
                  subtext: slide.body,
                  buttonLabel: slide.buttonLabel,
                  buttonLink: slide.buttonLink,
                  secondaryLabel: slide.secondaryLabel,
                  secondaryLink: slide.secondaryLink,
                  image: slide.image,
                }}
                layout={{
                  size,
                  layout: 'image-background',
                  contentPosition: slide.contentPosition ?? 'bottom',
                  contentAlignment: slide.contentAlignment ?? 'left',
                  textWidth: slide.textWidth ?? 'narrow',
                  overlay: slide.overlay ?? 'medium',
                  // Follows the slide on screen, like the block path above: an
                  // inactive slide is `visibility: hidden` and leaves the
                  // accessibility tree, taking the page's only h1 with it.
                  headingLevel: i === idx ? 'h1' : 'h2',
                  priority: i === 0,
                }}
              />
            </div>
          ))}
        </div>

        {/* One control cluster, per the design's artboard: prev / counter /
            next / pause, grouped in a corner — not big arrows floating over
            the copy at mid-height, which is what collided with the heading on
            mobile. Dots stay available as an opt-in for short slideshows. */}
        {hasControls && (
          <div className="tq-slideshow__controls">
            {showDots && (
              <div className="tq-slideshow__dots" role="tablist" aria-label="Slides">
                {Array.from({ length: slideCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className="tq-slideshow__dot"
                    aria-label={`Slide ${i + 1}`}
                    aria-current={i === idx}
                    role="tab"
                    onClick={() => go(i)}
                  />
                ))}
              </div>
            )}
            {showCluster && (
            <div className="tq-slideshow__cluster">
              <button
                className="tq-slideshow__ctl"
                type="button"
                aria-label="Previous slide"
                onClick={() => go(idx - 1)}
              >
                <Arrow direction="left" />
              </button>
              <span className="tq-slideshow__counter" aria-live="polite">
                {idx + 1} / {slideCount}
              </span>
              <button
                className="tq-slideshow__ctl"
                type="button"
                aria-label="Next slide"
                onClick={() => go(idx + 1)}
              >
                <Arrow direction="right" />
              </button>
              {autoplay && (
                <button
                  className="tq-slideshow__ctl"
                  type="button"
                  aria-pressed={stopped}
                  aria-label={stopped ? 'Resume slideshow' : 'Pause slideshow'}
                  onClick={() => setStopped((v) => !v)}
                >
                  {stopped ? '\u25B6' : '\u23F8'}
                </button>
              )}
            </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function Arrow({ direction }: { direction: 'left' | 'right' }): JSX.Element {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: direction === 'left' ? 'rotate(180deg)' : undefined }}
    >
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  )
}

export default defineSection({
  name: 'slideshow',
  role: 'section',
  title: 'Slideshow',
  category: 'layout',
  icon: '▷',
  attributes: withShared({
    slideHeight: {
      type: 'select',
      label: 'Slide height',
      default: 'medium',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
        { value: 'fullscreen', label: 'Fullscreen' },
      ],
    },
    autoplay: { type: 'boolean', default: true, label: 'Auto-advance slides' },
    interval: {
      type: 'select',
      default: '6s',
      label: 'Time between slides',
      visible_if: '{{ section.settings.autoplay == true }}',
      options: [
        { value: '4s', label: '4 seconds' },
        { value: '6s', label: '6 seconds' },
        { value: '8s', label: '8 seconds' },
      ],
    },
    controls: {
      type: 'select',
      default: 'arrows+counter',
      label: 'Navigation',
      options: [
        { value: 'arrows+counter', label: 'Arrows + counter' },
        { value: 'dots', label: 'Dots' },
        { value: 'none', label: 'None' },
      ],
    },
    transition: {
      type: 'select',
      default: 'fade',
      label: 'Transition',
      options: [
        { value: 'fade', label: 'Fade' },
        { value: 'slide', label: 'Slide' },
      ],
    },
    controlsPosition: {
      type: 'select',
      label: 'Controls position',
      default: 'bottom-right',
      options: [
        { value: 'bottom-right', label: 'Bottom right' },
        { value: 'bottom-left', label: 'Bottom left' },
        { value: 'bottom-center', label: 'Bottom center' },
      ],
    },
  }),
  allowedBlocks: ['slide'],
  presets: [
    {
      blocks: [
        { type: 'slide', settings: { eyebrow: 'New season', heading: 'Modern essentials', body: 'A clean starter storefront powered by Tanqory sections.', buttonLabel: 'Shop the collection', buttonLink: '/collections/all', secondaryLabel: 'Explore collections', secondaryLink: '/collections' } },
        { type: 'slide', settings: { heading: 'New season, new staples', body: 'Limited-run pieces drop weekly.', buttonLabel: 'Browse new', buttonLink: '/collections/all' } },
      ],
    },
  ],
  component: Slideshow,
})
