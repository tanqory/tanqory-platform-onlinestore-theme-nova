/**
 * Empty / Error / Loading — the three states the design specifies together,
 * because they are the same block with different content. Five ad-hoc empty
 * states existed before this and no error or loading state at all.
 *
 * Anatomy the design pins: a glyph, a title, a one-line body and AT MOST one
 * CTA. Never an illustration.
 */
import type { ReactNode } from 'react'
import { Button } from './Button'
import { Spinner } from './Spinner'

export function StateBlock({
  tone = 'empty',
  glyph,
  title,
  body,
  ctaLabel,
  ctaHref,
  onCta,
  children,
}: {
  tone?: 'empty' | 'error' | 'loading'
  glyph?: ReactNode
  title: string
  body?: string
  ctaLabel?: string
  ctaHref?: string
  onCta?: () => void
  children?: ReactNode
}): JSX.Element {
  /**
   * Error announces immediately; loading announces itself as BUSY so assistive
   * tech does not read a half-built list as the finished one. `aria-busy` is
   * what the design asks for on a loading region and was not set anywhere.
   */
  const live =
    tone === 'error'
      ? { role: 'alert' as const }
      : tone === 'loading'
        ? { role: 'status' as const, 'aria-busy': true }
        : {}

  return (
    <div className={`state-block state-block--${tone}`} {...live}>
      <span className="state-block__glyph" aria-hidden>
        {tone === 'loading' ? <Spinner size={24} label={null} /> : glyph}
      </span>
      <p className="state-block__title">{title}</p>
      {body && <p className="state-block__body">{body}</p>}
      {ctaLabel && (
        <Button
          label={ctaLabel}
          {...(ctaHref ? { link: ctaHref } : {})}
          {...(onCta ? { onClick: onCta } : {})}
          variant={tone === 'empty' ? 'primary' : 'secondary'}
        />
      )}
      {children}
    </div>
  )
}
