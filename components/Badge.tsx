/**
 * Badge — informational, never interactive.
 *
 * The design is explicit that tone is "set by data, not merchant", so there is
 * no colour prop: a caller says what the badge MEANS and the tone follows.
 * `sold-out` deliberately recedes (surface + secondary text) rather than
 * shouting, because a sold-out product should not draw the eye harder than a
 * sale.
 */
export type BadgeTone = 'sale' | 'new' | 'sold-out' | 'low-stock' | 'in-stock' | 'pre-order'

export function Badge({
  tone = 'new',
  children,
}: {
  tone?: BadgeTone
  children: React.ReactNode
}): JSX.Element {
  return <span className={`badge badge--${tone}`}>{children}</span>
}
