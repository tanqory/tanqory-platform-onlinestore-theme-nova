/**
 * CartLineItem + CartSummary — the cart page defines the language the drawer
 * reuses, per the design. Two divergent implementations existed (page and
 * drawer) with different row anatomy, different remove affordances and no
 * updating or error state at all.
 *
 * Row states the design pins:
 *   default  — as drawn
 *   updating — quantity dimmed, spinner, totals HOLD THEIR WIDTH so the row
 *              does not jump while a request is in flight
 *   error    — inline Critical message, quantity reverted
 */
import type { ReactNode } from 'react'
import type { Money } from '../lib/tanqory/index'
import { ImageResponsive } from './ImageResponsive'
import { Price } from './Price'
import { QuantityStepper } from './QuantityStepper'
import { Spinner } from './Spinner'

export interface CartLineData {
  id: string
  title: string
  variantTitle?: string
  vendor?: string
  handle?: string
  image?: { url?: string; altText?: string }
  quantity: number
  unitPrice?: Money | null
  lineTotal?: Money | null
  /** Strikethrough original when the line is discounted. */
  compareAtTotal?: Money | null
  /** Caps the stepper; the design tops quantity out at available inventory. */
  maxQuantity?: number
}

export function CartLineItem({
  line,
  onQuantityChange,
  onRemove,
  showVendor = false,
  showCompareAt = true,
  updating = false,
  error,
  compact = false,
  quantityColumn = false,
  removeLabel = 'Remove',
}: {
  line: CartLineData
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  showVendor?: boolean
  showCompareAt?: boolean
  updating?: boolean
  error?: string
  /** The drawer's denser row. Same anatomy, tighter spacing. */
  compact?: boolean
  /**
   * Cart PAGE layout: quantity gets its own column so the row lines up under
   * the PRODUCT / QUANTITY / TOTAL headers. The drawer keeps the stacked row,
   * where there is no room for a fourth column.
   */
  quantityColumn?: boolean
  removeLabel?: string
}): JSX.Element {
  return (
    <div
      className={`cart-line${compact ? ' cart-line--compact' : ''}${
        quantityColumn ? ' cart-line--table' : ''
      }${updating ? ' is-updating' : ''}${error ? ' has-error' : ''}`}
      // `aria-busy` so a screen reader knows the row's numbers are stale.
      aria-busy={updating || undefined}
    >
      <div className="cart-line__thumb">
        <ImageResponsive src={line.image?.url} alt={line.image?.altText ?? line.title} />
      </div>

      <div className="cart-line__info">
        {showVendor && line.vendor && <span className="cart-line__vendor">{line.vendor}</span>}
        <strong className="cart-line__title">
          {line.handle ? <a href={`/products/${line.handle}`}>{line.title}</a> : line.title}
        </strong>
        {line.variantTitle && <span className="cart-line__variant">{line.variantTitle}</span>}
        {line.unitPrice && (
          <span className="cart-line__unit">
            <Price value={line.unitPrice} /> each
          </span>
        )}
        {error && (
          <p className="cart-line__error" role="alert">
            {error}
          </p>
        )}
        <div className="cart-line__controls">
          {!quantityColumn && (
            <QuantityStepper
              value={line.quantity}
              onChange={onQuantityChange}
              max={line.maxQuantity}
              disabled={updating}
              label={`Quantity for ${line.title}`}
              size="sm"
            />
          )}
          {/* Remove is a text link, not a destructive button: the design pairs
              it with an Undo toast rather than a confirmation. */}
          <button type="button" className="cart-line__remove btn btn--link" onClick={onRemove} disabled={updating}>
            {removeLabel}
          </button>
        </div>
      </div>

      {quantityColumn && (
        <div className="cart-line__qty-cell">
          <QuantityStepper
            value={line.quantity}
            onChange={onQuantityChange}
            max={line.maxQuantity}
            disabled={updating}
            label={`Quantity for ${line.title}`}
            size="sm"
          />
        </div>
      )}

      <div className="cart-line__total">
        {updating && <Spinner size={16} label="Updating" />}
        {line.lineTotal && (
          <Price
            value={line.lineTotal}
            {...(showCompareAt && line.compareAtTotal ? { compareAt: line.compareAtTotal } : {})}
          />
        )}
      </div>
    </div>
  )
}

/** CartSummary — subtotal, discount, shipping note, total, then the actions. */
export function CartSummary({
  subtotal,
  discount,
  tax,
  total,
  itemCount,
  children,
  heading = 'Order summary',
  shippingNote = 'Calculated at checkout',
}: {
  subtotal: Money | null
  discount?: Money | null
  /** Estimated tax — the contract leaves it null until checkout knows it. */
  tax?: Money | null
  total?: Money | null
  itemCount?: number
  /** Checkout button, note field, payment marks — supplied by the caller. */
  children?: ReactNode
  heading?: string
  shippingNote?: string
}): JSX.Element {
  return (
    <aside className="cart-summary" aria-label={heading}>
      <h2 className="cart-summary__heading">{heading}</h2>
      <div className="cart-summary__row">
        <span>Subtotal{itemCount !== undefined ? ` · ${itemCount} item${itemCount === 1 ? '' : 's'}` : ''}</span>
        <Price value={subtotal} />
      </div>
      {discount && (
        <div className="cart-summary__row cart-summary__row--discount">
          <span>Discount</span>
          <span>
            − <Price value={discount} />
          </span>
        </div>
      )}
      {tax && (
        <div className="cart-summary__row">
          <span>Tax</span>
          <Price value={tax} />
        </div>
      )}
      <div className="cart-summary__row u-text-muted">
        <span>Shipping</span>
        <span>{shippingNote}</span>
      </div>
      <div className="cart-summary__row cart-summary__row--total">
        <strong>Total</strong>
        <strong>
          <Price value={total ?? subtotal} size="pdp" />
        </strong>
      </div>
      {children}
    </aside>
  )
}
