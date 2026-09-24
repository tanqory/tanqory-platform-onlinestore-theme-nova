/**
 * Link — anchor wrapper. Today it's just an `<a>`; when theme-kit gains
 * client-side routing this is the one place to swap in router-aware
 * navigation (prefetch, soft-nav) without touching every section.
 *
 * Sections should call <Link href={…}> instead of raw <a href={…}> so the
 * upgrade is non-breaking.
 */
import type { CSSProperties, ReactNode } from 'react'
import { safeHref as checkHref } from '../lib/safe-href'

export function Link({
  href,
  children,
  className,
  target,
  rel,
  prefetch: _prefetch = false,
  ariaLabel,
  style,
}: {
  href?: string | null
  children: ReactNode
  className?: string
  target?: '_blank' | '_self'
  rel?: string
  prefetch?: boolean
  ariaLabel?: string
  style?: CSSProperties
}): JSX.Element {
  // Most hrefs here come from a `type: 'url'` setting. A value with a scheme
  // outside http(s)/mailto/tel (`javascript:` …) falls back to '#'.
  const safeHref = checkHref(href) ?? '#'
  const computedRel = target === '_blank' ? rel ?? 'noopener noreferrer' : rel
  return (
    <a
      href={safeHref}
      className={className}
      target={target}
      rel={computedRel}
      aria-label={ariaLabel}
      style={style}
    >
      {children}
    </a>
  )
}
