import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { Children, useEffect, useState } from 'react'
import { Button } from '../components/Button'

type Slide = {
  image?: string
  eyebrow?: string
  heading?: string
  body?: string
  buttonLabel?: string
  buttonLink?: string
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
    image: 'data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%272000%27%20height%3D%27900%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%271%27%20y2%3D%271%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%232d3e50%27/%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%2356708c%27/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20fill%3D%27url%28%23g%29%27/%3E%3C/svg%3E',
    eyebrow: 'New season',
    heading: 'Modern essentials',
    body: 'A clean starter storefront powered by Tanqory sections.',
    buttonLabel: 'Shop the collection',
    buttonLink: '/collections/all',
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
  const interval: number = (attributes.intervalMs as number) ?? 6000
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (slideCount < 2 || paused) return
    const id = window.setInterval(() => setIdx((i) => (i + 1) % slideCount), interval)
    return () => window.clearInterval(id)
  }, [slideCount, paused, interval])

  const go = (n: number) => setIdx(((n % slideCount) + slideCount) % slideCount)

  return (
    <section
      className="tq-slideshow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="tq-slideshow__viewport">
        <div
          className="tq-slideshow__track"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {blockCount > 0 ? children : slides.map((slide, i) => (
            <div key={i} className="tq-slideshow__slide">
              {slide.image && (
                <img
                  src={slide.image}
                  alt={slide.heading ?? ''}
                  className="tq-slideshow__img"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              )}
              <div className="tq-slideshow__overlay">
                {slide.eyebrow && <span className="hero__eyebrow">{slide.eyebrow}</span>}
                {slide.heading && <h2 className="tq-slideshow__heading">{slide.heading}</h2>}
                {slide.body && <p className="tq-slideshow__body">{slide.body}</p>}
                {slide.buttonLabel && (
                  <Button
                    label={slide.buttonLabel}
                    link={slide.buttonLink}
                    variant="inverse"
                    size="lg"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {slideCount > 1 && (
          <>
            <button
              className="tq-slideshow__arrow tq-slideshow__arrow--prev"
              type="button"
              aria-label="Previous slide"
              onClick={() => go(idx - 1)}
            >
              <Arrow direction="left" />
            </button>
            <button
              className="tq-slideshow__arrow tq-slideshow__arrow--next"
              type="button"
              aria-label="Next slide"
              onClick={() => go(idx + 1)}
            >
              <Arrow direction="right" />
            </button>
            <div className="tq-slideshow__dots" role="tablist">
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
          </>
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
  title: 'Slideshow',
  category: 'layout',
  icon: '▷',
  attributes: {
    intervalMs: { type: 'number', default: 6000, label: 'Auto-advance interval (ms)' },
    slides: {
      type: 'textarea',
      label: 'Slides JSON',
      default: '[]',
    },
  },
  allowedBlocks: ['slide'],
  presets: [
    {
      blocks: [
        { type: 'slide', settings: { heading: 'Modern essentials', body: 'A clean starter storefront powered by Tanqory sections.', buttonLabel: 'Shop the collection', buttonLink: '/collections/all' } },
        { type: 'slide', settings: { heading: 'New season, new staples', body: 'Limited-run pieces drop weekly.', buttonLabel: 'Browse new', buttonLink: '/collections/all' } },
      ],
    },
  ],
  component: Slideshow,
})
