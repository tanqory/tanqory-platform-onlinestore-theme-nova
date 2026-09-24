/**
 * Reusable UI primitive (= a commerce-standard "snippet") — NOT an editor section.
 * Sections import it; merchants configure it via the parent section's settings.
 */

/**
 * `outline-inverse` is the design's secondary action ON a photograph: a white
 * outline over the image, not a ghost that vanishes into it. Needed because a
 * media hero's two CTAs are filled-white + outlined-white, never filled+ghost.
 *
 * `tertiary` and `destructive` complete the design's six-variant matrix
 * (02 UI Primitives): Primary · Secondary · Tertiary · Ghost · Text · Destructive.
 */
import { safeHref } from '../lib/safe-href'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'ghost'
  | 'inverse'
  | 'outline-inverse'
  | 'link'
  | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

export function Button({
  label,
  link,
  variant = 'primary',
  size = 'md',
  className,
  fullWidth,
  onClick,
  disabled,
  loading,
}: {
  label?: string
  link?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  fullWidth?: boolean
  /** When provided (and no `link`), renders a real <button> that fires this. */
  onClick?: () => void
  disabled?: boolean
  /**
   * In-flight. The design's sixth state: a spinner replaces the label and the
   * button HOLDS ITS WIDTH, so a row of actions does not reflow mid-request.
   * The label stays in the DOM at `opacity: 0` — not `visibility: hidden`,
   * which would drop it from the accessibility tree and leave the button with
   * no accessible name — so the width AND the name survive while `aria-busy`
   * announces the change.
   */
  loading?: boolean
}): JSX.Element {
  const classes = [
    'btn',
    `btn--${variant}`,
    size !== 'md' ? `btn--${size}` : '',
    fullWidth ? 'btn--block' : '',
    loading ? 'btn--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const body = (
    <>
      <span className="btn__label">{label ?? 'Button'}</span>
      {loading && <span className="btn__spinner" aria-hidden />}
    </>
  )

  // An action button (add to cart, etc.) renders a <button>; a navigation
  // button renders an <a>. With BOTH onClick + link (e.g. checkout: fire an
  // analytics event, then navigate), the handler runs on the anchor before the
  // browser follows the href — analytics uses sendBeacon, so it survives the nav.
  if (onClick && !link) {
    return (
      <button
        type="button"
        className={classes}
        onClick={onClick}
        disabled={disabled || loading}
        {...(loading ? { 'aria-busy': true } : {})}
      >
        {body}
      </button>
    )
  }

  // An anchor cannot be disabled. It previously ignored `disabled` entirely,
  // so a "disabled" link button stayed fully clickable; `aria-disabled` plus
  // removing it from the tab order is the accessible equivalent, and
  // `.btn[aria-disabled='true']` was already styled for exactly this.
  const inert = disabled || loading
  // `link` is a merchant `type: 'url'` setting on every CTA — same check as Link.
  const href = safeHref(link) ?? '#'
  return (
    <a
      className={classes}
      href={inert ? undefined : href}
      {...(inert ? { 'aria-disabled': true, role: 'link', tabIndex: -1 } : {})}
      {...(loading ? { 'aria-busy': true } : {})}
      onClick={(e) => {
        if (inert) {
          e.preventDefault()
          return
        }
        onClick?.()
      }}
    >
      {body}
    </a>
  )
}
