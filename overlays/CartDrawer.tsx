import { getAnalytics, useCart, useT } from '@tanqory/theme-kit'
import { useEffect } from 'react'
import { Drawer } from '../components/Drawer'
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
  const { lines, subtotal, checkoutUrl, updateQuantity, remove } = useCart()
  const t = useT()

  // The mini-cart is nova's primary cart surface (auto-opens after add-to-cart),
  // so opening it is a cart_viewed for the merchant's funnel.
  useEffect(() => {
    if (open) getAnalytics().track('CART_VIEWED', { lineCount: lines.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Drawer open={open} side="right" width={widthAttr} ariaLabel="Cart">
      <header className="drawer__head">
        <h2 className="drawer__title">{t('cart.title')}</h2>
        <button
          type="button"
          className="drawer__close"
          aria-label="Close cart"
          onClick={() => closeOverlay()}
        >
          ✕
        </button>
      </header>

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
                  <div className="drawer__qty" role="group" aria-label="Quantity">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => void updateQuantity(l.id, l.quantity - 1)}
                    >
                      −
                    </button>
                    <span aria-live="polite">{l.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => void updateQuantity(l.id, l.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
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
                    }}
                  >
                    {t('cart.remove')}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <footer className="drawer__foot">
            <div className="drawer__row">
              <span>{t('cart.subtotal')}</span>
              <strong><Money value={subtotal} /></strong>
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
                a.track('CHECKOUT_STARTED', { value: subtotal, lineCount: lines.length })
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
