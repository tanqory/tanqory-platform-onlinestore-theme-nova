import { useT } from '../lib/tanqory/index'
/**
 * ProductGallery — main media plus thumbnails.
 *
 * The design's three desktop layouts: `thumbnails-left` (vertical 72px strip),
 * `thumbnails-below`, and `stacked` (all media in a 2-column grid while the
 * purchase column stays sticky). Below 768 it becomes a 1:1 swipe strip with
 * 16px edge peek.
 *
 * Product media is `contain`, not `cover` — a cropped product photo is a
 * returned order. That rule comes straight from the style system and is the
 * one thing here that must not be "fixed" later.
 */
import { useEffect, useRef, useState } from 'react'
import { IconButton } from './IconButton'
import { Modal } from './Modal'

export interface GalleryMedia {
  url: string
  altText?: string
  /** A video renders a play glyph on its thumb and plays inline, muted. */
  type?: 'image' | 'video'
}

export function ProductGallery({
  media,
  layout = 'thumbnails-left',
  ratio = 'portrait',
  enableZoom = true,
  /** Index the caller wants shown — a variant change moves this. */
  activeIndex,
  onActiveIndexChange,
  badge,
}: {
  media: GalleryMedia[]
  layout?: 'thumbnails-left' | 'thumbnails-below' | 'stacked'
  ratio?: 'adapt' | 'portrait' | 'square'
  enableZoom?: boolean
  activeIndex?: number
  onActiveIndexChange?: (i: number) => void
  badge?: React.ReactNode
}): JSX.Element | null {
  const t = useT()
  const [internal, setInternal] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const strip = useRef<HTMLDivElement>(null)
  const active = activeIndex ?? internal

  const select = (i: number): void => {
    const next = Math.max(0, Math.min(media.length - 1, i))
    if (onActiveIndexChange) onActiveIndexChange(next)
    else setInternal(next)
  }

  // Keep the mobile swipe strip in sync when a variant change moves the
  // selection — otherwise the dots say "2" while the strip still shows 1.
  useEffect(() => {
    const el = strip.current
    if (!el) return
    const child = el.children[Math.min(Math.max(active, 0), el.children.length - 1)] as
      | HTMLElement
      | undefined
    if (child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' })
  }, [active])

  if (media.length === 0) {
    // "No media → frame kept": an absent image must not collapse the layout.
    return <div className="gallery gallery--empty" data-ratio={ratio} aria-hidden />
  }

  /**
   * Clamp the index to what `media` actually holds.
   *
   * `active` can come from the controlled `activeIndex` prop, which only
   * `select()` clamped. A caller keeping `activeIndex=4` while the media array
   * shrinks — a variant or product swap that re-renders with shorter media
   * before its reset effect runs — made `media[active]!` `undefined`, and
   * reading `.type` off it threw and blanked the whole PDP.
   */
  const index = Math.min(Math.max(active, 0), media.length - 1)
  const current = media[index]!
  const single = media.length === 1

  return (
    <div className={`gallery gallery--${layout}`} data-ratio={ratio}>
      <div className="gallery__stage">
        {badge && <div className="gallery__badge">{badge}</div>}
        {current.type === 'video' ? (
          // Muted + controls, never autoplaying with sound.
          <video className="gallery__media" src={current.url} controls muted playsInline preload="metadata" />
        ) : (
          <img
            className="gallery__media"
            src={current.url}
            alt={current.altText ?? ''}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        )}
        {enableZoom && current.type !== 'video' && (
          <IconButton
            label={t('product.zoom')}
            variant="bordered"
            className="gallery__zoom"
            onClick={() => setZoomed(true)}
          >
            <ZoomGlyph />
          </IconButton>
        )}
      </div>

      {/* Mobile swipe strip — same media, a different affordance. */}
      {/* A horizontally scrolling region needs to be reachable by keyboard —
          someone who cannot swipe still has to get to photo three. `tabindex=0`
          makes it focusable so the arrow keys scroll it, and the role plus
          label say what it is once focus lands there. */}
      <div
        className="gallery__swipe"
        ref={strip}
        aria-hidden={media.length < 2}
        {...(media.length > 1
          ? { tabIndex: 0, role: 'group' as const, 'aria-label': t('product.photosScrollable') }
          : {})}
      >
        {media.map((m, i) => (
          <img key={`${m.url}-${i}`} className="gallery__swipe-item" src={m.url} alt={m.altText ?? ''} loading="lazy" />
        ))}
      </div>

      {!single && (
        <div className="gallery__thumbs" role="listbox" aria-label={t('product.media')}>
          {media.map((m, i) => (
            <button
              key={`${m.url}-${i}`}
              type="button"
              role="option"
              aria-selected={i === index}
              aria-label={`${t('product.showImage')} ${i + 1} ${t('product.of')} ${media.length}`}
              className={`gallery__thumb${i === index ? ' is-active' : ''}`}
              onClick={() => select(i)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                  e.preventDefault()
                  select(index + 1)
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                  e.preventDefault()
                  select(index - 1)
                }
              }}
            >
              <img src={m.url} alt="" loading="lazy" />
              {m.type === 'video' && (
                <span className="gallery__thumb-play" aria-hidden>
                  ▶
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {!single && (
        <div className="gallery__dots" aria-hidden>
          {media.map((_, i) => (
            <span key={i} className={`gallery__dot${i === index ? ' is-active' : ''}`} />
          ))}
        </div>
      )}

      {enableZoom && (
        <Modal open={zoomed} onClose={() => setZoomed(false)} title={current.altText || 'Product image'} size="lg">
          <img className="gallery__zoom-img" src={current.url} alt={current.altText ?? ''} />
        </Modal>
      )}
    </div>
  )
}

function ZoomGlyph(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5M11 8v6M8 11h6" />
    </svg>
  )
}
