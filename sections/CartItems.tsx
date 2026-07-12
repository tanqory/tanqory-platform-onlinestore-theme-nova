import { defineSection, useCart, type SectionProps } from '@tanqory/theme-kit'
import { useEffect, useState } from 'react'
import { ImageResponsive } from '../components/ImageResponsive'
import { Money } from '../components/Money'
import { Button } from '../components/Button'
import { Link } from '../components/Link'

export function CartItems({ attributes }: SectionProps): JSX.Element {
  const { lines, subtotal, total, tax, note, checkoutUrl, updateQuantity, remove, updateNote } =
    useCart()
  const [draftNote, setDraftNote] = useState(note ?? '')
  useEffect(() => setDraftNote(note ?? ''), [note])

  const heading = (attributes.heading as string) ?? 'Your cart'
  const showNote = (attributes.showOrderNote as boolean) !== false
  const buttonLabel = (attributes.buttonLabel as string) ?? 'Checkout'
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
                        aria-label={`Remove ${l.title}`}
                        style={{ marginLeft: 'var(--space-3)' }}
                        onClick={() => void remove(l.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <Money value={l.lineSubtotal} />
                </div>
              ))}
            </div>

            <aside className="cart__summary">
              <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--type-step-1)', fontWeight: 500, letterSpacing: 0 }}>
                Order summary
              </h3>
              <div className="cart__row">
                <span>Subtotal</span>
                <Money value={subtotal} />
              </div>
              {tax ? (
                <div className="cart__row">
                  <span>Tax</span>
                  <Money value={tax} />
                </div>
              ) : (
                <div className="cart__row u-text-muted">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>
              )}
              <div className="cart__row u-text-muted">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="cart__row cart__row--total">
                <strong>Total</strong>
                <strong><Money value={total ?? subtotal} /></strong>
              </div>
              {showNote && (
                <label className="cart__note" style={{ display: 'block', marginTop: 'var(--space-4)' }}>
                  <span className="u-text-muted" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--type-step--1)' }}>
                    Order note
                  </span>
                  <textarea
                    rows={2}
                    value={draftNote}
                    placeholder="Add delivery instructions…"
                    onChange={(e) => setDraftNote(e.target.value)}
                    onBlur={() => {
                      if (updateNote && draftNote !== (note ?? '')) void updateNote(draftNote)
                    }}
                    style={{ width: '100%', resize: 'vertical', padding: 'var(--space-2)', font: 'inherit' }}
                  />
                </label>
              )}
              <Button label={buttonLabel} link={buttonLink} variant="primary" size="lg" fullWidth />
              <Link href="/collections/all" className="btn btn--link" style={{ alignSelf: 'center', marginTop: 'var(--space-1)' } as any}>
                Continue shopping →
              </Link>
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}

function EmptyCart(): JSX.Element {
  return (
    <div className="not-found">
      <h3>Your cart is empty</h3>
      <p className="u-text-muted">Add a few things from the collection to get started.</p>
      <Button label="Shop the collection" link="/collections/all" variant="primary" size="lg" />
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
    showOrderNote: { type: 'boolean', default: true, label: 'Show order note field' },
  },
  component: CartItems,
})
