/**
 * IconButton — 44×44 hit area around a 20px glyph.
 *
 * Ghost by default; `bordered` for toolbars. An icon-only control has no
 * accessible name of its own, so `label` is required, not optional — the
 * header had four of these relying on a nearby heading instead.
 */
export function IconButton({
  label,
  children,
  onClick,
  href,
  variant = 'ghost',
  count,
  pressed,
  disabled,
  className,
}: {
  label: string
  children: React.ReactNode
  onClick?: () => void
  href?: string
  variant?: 'ghost' | 'bordered'
  /** Renders a pill count badge (cart, filters). ≥100 shows 99+, per the design. */
  count?: number
  pressed?: boolean
  disabled?: boolean
  className?: string
}): JSX.Element {
  const cls = ['icon-btn', `icon-btn--${variant}`, className].filter(Boolean).join(' ')
  const badge =
    count && count > 0 ? (
      <span className="icon-btn__count">{count > 99 ? '99+' : count}</span>
    ) : null

  if (href) {
    return (
      <a className={cls} href={href} aria-label={label}>
        {children}
        {badge}
      </a>
    )
  }
  return (
    <button
      type="button"
      className={cls}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      {...(pressed === undefined ? {} : { 'aria-pressed': pressed })}
    >
      {children}
      {badge}
    </button>
  )
}
