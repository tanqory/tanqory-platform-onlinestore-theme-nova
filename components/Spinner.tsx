/** Spinner — 16 / 24 / 32, the design's three sizes. */
export function Spinner({
  size = 24,
  label = 'Loading',
}: {
  size?: 16 | 24 | 32
  /** Set to null inside a control that already announces its own busy state. */
  label?: string | null
}): JSX.Element {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size }}
      {...(label ? { role: 'status', 'aria-label': label } : { 'aria-hidden': true })}
    />
  )
}

/**
 * Skeleton — a placeholder at the FINAL dimensions of what is loading.
 * The design requires the product-grid skeletons to sit at the card's real
 * ratio so the page does not reflow when content arrives.
 */
export function Skeleton({
  width,
  height,
  ratio,
  radius = 'sm',
  className,
}: {
  width?: string | number
  height?: string | number
  /** e.g. `4 / 5` — use instead of height for media placeholders. */
  ratio?: string
  radius?: 'sm' | 'circle'
  className?: string
}): JSX.Element {
  return (
    <span
      className={['skeleton', `skeleton--${radius}`, className].filter(Boolean).join(' ')}
      style={{ width, height, aspectRatio: ratio }}
      aria-hidden
    />
  )
}
