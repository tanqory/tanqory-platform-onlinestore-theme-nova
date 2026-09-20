import { useEffect, useState } from 'react'

/**
 * Responsive image — wraps `<img>` with sensible storefront defaults:
 * lazy loading, async decoding, intrinsic width/height to reserve layout
 * space (no CLS), and an optional `sizes` hint for srcset-aware backends.
 *
 * Today the URL is passed through unchanged; the CDN asset pipeline will
 * later attach `srcset` here (see [tanqory-studio/apps/examples/react/README.md]).
 */
export function ImageResponsive({
  src,
  alt,
  width,
  height,
  sizes,
  loading = 'lazy',
  className,
  style,
}: {
  src?: string | null
  alt?: string | null
  width?: number
  height?: number
  sizes?: string
  loading?: 'lazy' | 'eager'
  className?: string
  /** Escape hatch for object-fit, which the card sets per merchant setting. */
  style?: import('react').CSSProperties
}): JSX.Element | null {
  // A URL that fails to load must degrade to the section's placeholder, not
  // leave a blank frame. Real stores have dead media references — one product
  // in the dev store points at an R2 object that 404s and returns HTML, which
  // the browser refuses to treat as an image.
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) return null
  return (
    <img
      src={src}
      onError={() => setFailed(true)}
      alt={alt ?? ''}
      width={width}
      height={height}
      sizes={sizes}
      loading={loading}
      decoding="async"
      className={className}
      style={style}
    />
  )
}
