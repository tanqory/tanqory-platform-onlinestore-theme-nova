import { getAnalytics, useCart, useT } from '@tanqory/theme-kit'
import { useEffect } from 'react'
import { Drawer } from '../components/Drawer'
import { showToast } from '../components/Overlays'
import { QuantityStepper } from '../components/QuantityStepper'
import { ImageResponsive } from '../components/ImageResponsive'
import { Money } from '../components/Money'
import { Button } from '../components/Button'
import { closeOverlay, useOverlay } from '../components/useOverlayChannel'

interface CartDrawerProps {
  width: string
  emptyHeading: string
  emptySubtext: string
  checkoutLabel: string
  viewCartLabel: string
}

/**
 * Slide-over cart summary — the "mini cart" pattern. Triggered by the header
 * 🛒 button or (optionally) auto-opens after add-to-cart. Shows live line
 * items, subtotal, checkout CTA + a "View full cart" escape hatch to `/cart`.
 *
 * Reads the real cart from `useCart()` (theme-kit): +/- update quantity,
 * Remove deletes the line, and the subtotal recomputes from the backend after
 * every mutation. In editor/offline (mock) mode the same controls drive an
 * in-memory cart so the surface still demonstrates correctly.
 */
export function CartDrawer(props: CartDrawerProps): JSX.Element {
  const open = useOverlay('cart')
  const { width: widthAttr, emptyHeading, emptySubtext, checkoutLabel, viewCartLabel } = props
  // Same contract as the cart page: the drawer must not quote a different
  // total from the page it links to.
  const { lines, subtotal, total, discountAmount, totalQuantity, checkoutUrl, error, updateQuantity, remove } = useCart()
  const t = useT()

  // The mini-cart is nova's primary cart surface (auto-opens after add-to-cart),
  // so opening it is a cart_viewed for the merchant's funnel.
  useEffect(() => {
    if (open) getAnalytics().track('CART_VIEWED', { lineCount: lines.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Drawer open={open} side="right" width={widthAttr} ariaLabel="Cart">
      {/* A div, not <header>: a bare <header> outside a sectioning element is a
          `banner` landmark, and the page already has one. Every route was
          reporting two. */}
      <div className="drawer__head">
        <h2 className="drawer__title">{t('cart.title')}</h2>
        <button
          type="button"
          className="drawer__close"
          aria-label="Close cart"
          onClick={() => closeOverlay()}
        >
          ✕
        </button>
      </div>

      {lines.length === 0 ? (
        <div className="drawer__empty">
          <h3>{emptyHeading}</h3>
          <p className="u-text-muted">{emptySubtext}</p>
          <Button label={t('common.shopCollection')} link="/collections/all" variant="primary" size="lg" />
        </div>
      ) : (
        <>
          <ul className="drawer__lines">
            {lines.map((l) => (
              <li key={l.id} className="drawer__line">
                <div className="drawer__thumb">
                  <ImageResponsive src={l.image?.url} alt={l.image?.altText ?? l.title} />
                </div>
                <div className="drawer__body">
                  <strong className="drawer__line-title">{l.title}</strong>
                  {l.variantTitle && (
                    <span className="u-text-muted drawer__variant">{l.variantTitle}</span>
                  )}
                  <QuantityStepper
                    value={l.quantity}
                    onChange={(q) => void updateQuantity(l.id, q)}
                    label={`Quantity for ${l.title}`}
                    size="sm"
                  />
                </div>
                <div className="drawer__line-price">
                  <Money value={l.lineSubtotal} />
                  <button
                    type="button"
                    className="drawer__remove"
                    aria-label={`${t('cart.remove')} ${l.title}`}
                    onClick={() => {
                      getAnalytics().track('PRODUCT_REMOVED_FROM_CART', {
                        lineId: l.id,
                        title: l.title,
                        quantity: l.quantity,
                        ...(l.productHandle ? { handle: l.productHandle } : {}),
                      })
                      void remove(l.id)
                      showToast(`${l.title} removed`)
                    }}
                  >
                    {t('cart.remove')}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <footer className="drawer__foot">
            {error && (
              <p className="u-text-error" role="alert">
                {error}
              </p>
            )}
            <div className="drawer__row">
              <span>{t('cart.subtotal')}</span>
              <Money value={subtotal} />
            </div>
            {discountAmount && (
              <div className="drawer__row cart-summary__row--discount">
                <span>{t('cart.discount')}</span>
                <span>
                  − <Money value={discountAmount} />
                </span>
              </div>
            )}
            <div className="drawer__row drawer__row--total">
              <strong>{t('cart.total')}</strong>
              <strong><Money value={total ?? subtotal} /></strong>
            </div>
            <p className="u-text-muted drawer__shipping-note">
              {t('cart.shippingNote')}
            </p>
            <Button
              label={checkoutLabel}
              link={checkoutUrl ?? '/checkout'}
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                const a = getAnalytics()
                a.track('CHECKOUT_STARTED', {
                  value: total ?? subtotal,
                  lineCount: lines.length,
                  itemCount: totalQuantity,
                })
                a.flush()
              }}
            />
            <a href="/cart" className="drawer__view-cart" onClick={() => closeOverlay()}>
              {viewCartLabel} →
            </a>
          </footer>
        </>
      )}
    </Drawer>
  )
}

export default CartDrawer
