/**
 * Price — the single money renderer.
 *
 * Absorbs what were two near-identical components: `Money` (null-safe,
 * `.tq-money`) and the old `Price` (not null-safe, `.tq-card-price`). Neither
 * of their class names had any CSS, and neither rendered the things the design
 * actually asks for: a compare-at strikethrough, the sale colour, a save
 * badge, tabular figures, or an unavailable state.
 *
 * `Money` is kept as a thin alias so existing imports keep working.
 */
import { formatMoney, type Money as MoneyValue } from '@tanqory/theme-kit'

export interface PriceProps {
  value?: MoneyValue | null
  /** Original price. Renders struck through, and turns `value` into the sale role. */
  compareAt?: MoneyValue | null
  /** `Save 20%` chip beside the pair. */
  showSave?: boolean
  /** PDP sizing (20px) instead of card sizing (15px). */
  size?: 'card' | 'pdp'
  className?: string
}

export function Price({
  value,
  compareAt = null,
  showSave = false,
  size = 'card',
  className,
}: PriceProps): JSX.Element | null {
  if (!value) return null

  const current = Number(value.amount)
  const was = compareAt ? Number(compareAt.amount) : 0
  // Only a REAL markdown counts — the backend returns a compare-at range even
  // when it equals the price, which would render a pointless strikethrough.
  const onSale = !!compareAt && was > current
  const save = onSale ? Math.round(((was - current) / was) * 100) : 0

  const classes = [
    'tq-price',
    size === 'pdp' ? 'tq-price--pdp' : null,
    onSale ? 'tq-price--sale' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes}>
      <span className="tq-price__current">{formatMoney(value)}</span>
      {onSale && (
        <s className="tq-price__compare">{formatMoney(compareAt)}</s>
      )}
      {onSale && showSave && save > 0 && (
        <span className="tq-price__save">Save {save}%</span>
      )}
    </span>
  )
}
