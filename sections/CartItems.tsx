import { defineSection, getAnalytics, useCart, useT, type SectionProps } from '@tanqory/theme-kit'
import { ImageResponsive } from '../components/ImageResponsive'
import { Money } from '../components/Money'
import { Button } from '../components/Button'
import { Link } from '../components/Link'

export function CartItems({ attributes }: SectionProps): JSX.Element {
  const { lines, subtotal, checkoutUrl, updateQuantity, remove } = useCart()
  const t = useT()

  const heading = (attributes.heading as string) ?? t('cart.title')
  const buttonLabel = (attributes.buttonLabel as string) ?? t('cart.checkout')
  const buttonLink = (attributes.buttonLink as string) ?? checkoutUrl ?? '/checkout'

  return (
    <section className="section">
      <div className="container">
        <h2 style={{ marginBottom: 'var(--space-6)' }}>{heading}</h2>

        {lines.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="cart">
            <div className="cart__list">
              {lines.map((l) => (
                <div key={l.id} className="cart__line">
                  <div className="cart__thumb">
                    <ImageResponsive src={l.image?.url} alt={l.image?.altText ?? l.title} />
                  </div>
                  <div className="cart__info">
                    <strong>
                      {l.productHandle ? (
                        <Link href={`/products/${l.productHandle}`}>{l.title}</Link>
                      ) : (
                        l.title
                      )}
                    </strong>
                    {l.variantTitle && <span className="u-text-muted">{l.variantTitle}</span>}
                    <div className="cart__qty" style={{ marginTop: 'var(--space-2)' }}>
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => void updateQuantity(l.id, l.quantity - 1)}
                      >
                        −
                      </button>
                      <span style={{ minWidth: 32, textAlign: 'center' }}>{l.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => void updateQuantity(l.id, l.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="cart__remove"
                        aria-label={`${t('cart.remove')} ${l.title}`}
                        style={{ marginLeft: 'var(--space-3)' }}
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
                  </div>
                  <Money value={l.lineSubtotal} />
                </div>
              ))}
            </div>

            <aside className="cart__summary">
              <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--type-step-1)', fontWeight: 500, letterSpacing: 0 }}>
                {t('cart.orderSummary')}
              </h3>
              <div className="cart__row">
                <span>{t('cart.subtotal')}</span>
                <Money value={subtotal} />
              </div>
              <div className="cart__row u-text-muted">
                <span>{t('cart.shipping')}</span>
                <span>{t('cart.calculatedAtCheckout')}</span>
              </div>
              <div className="cart__row cart__row--total">
                <strong>{t('cart.total')}</strong>
                <strong><Money value={subtotal} /></strong>
              </div>
              <Button
                label={buttonLabel}
                link={buttonLink}
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => {
                  const a = getAnalytics()
                  a.track('CHECKOUT_STARTED', { value: subtotal, lineCount: lines.length })
                  a.flush()
                }}
              />
              <Link href="/collections/all" className="btn btn--link" style={{ alignSelf: 'center', marginTop: 'var(--space-1)' } as any}>
                {t('common.continueShopping')} →
              </Link>
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}

function EmptyCart(): JSX.Element {
  const t = useT()
  return (
    <div className="not-found">
      <h3>{t('cart.empty.title')}</h3>
      <p className="u-text-muted">{t('cart.empty.sub')}</p>
      <Button label={t('common.shopCollection')} link="/collections/all" variant="primary" size="lg" />
    </div>
  )
}

export default defineSection({
  name: 'cart-items',
  title: 'Cart items',
  category: 'commerce',
  icon: '⊞',
  attributes: {
    heading: { type: 'text', default: 'Your cart', label: 'Heading' },
    buttonLabel: { type: 'text', default: 'Checkout', label: 'Checkout button' },
    buttonLink: { type: 'url', label: 'Checkout link override' },
  },
  component: CartItems,
})
