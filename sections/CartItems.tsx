import { useEffect, useState } from 'react'
import { defineSection, getAnalytics, useCart, useData, useT, type SectionProps } from '@tanqory/theme-kit'
import { SectionHead } from '../components/SectionHead'
import { ProductGrid } from '../components/ProductGrid'
import { toCard } from '../components/ProductCard'
import { Button } from '../components/Button'
import { Link } from '../components/Link'
import { CartLineItem, CartSummary } from '../components/CartLineItem'
import { Textarea } from '../components/Field'
import { PaymentIcons } from './PaymentIcons'
import { showToast } from '../components/Overlays'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

/**
 * CART ITEMS — the cart page body, and the language the cart drawer reuses.
 *
 * Rows and the summary are the shared `CartLineItem` / `CartSummary`
 * components, so the page and the drawer can no longer disagree about row
 * anatomy, remove affordance or updating state.
 */
/**
 * Pre-discount total for a line, derived from its discount allocations.
 * `CartLine` has no `compareAtPrice`, but the allocations carry the amount
 * taken off — so the struck-through figure is real, not invented.
 */
function lineCompareAt(line: {
  lineSubtotal?: { amount: string; currencyCode: string } | null
  discountAllocations?: Array<{ amount: { amount: string; currencyCode: string } }>
}): { amount: string; currencyCode: string } | null {
  const off = (line.discountAllocations ?? []).reduce((sum, d) => sum + Number(d.amount.amount || 0), 0)
  if (!off || !line.lineSubtotal) return null
  // Keep the subtotal's own precision. `toFixed(2)` rendered a struck-through
  // `¥5000.00` beside a correctly formatted `¥4500` on JPY/KRW, and silently
  // rounded a 3-decimal currency (KWD, BHD) so the "savings" on screen did not
  // equal `discountAllocations`.
  const decimals = (line.lineSubtotal.amount.split('.')[1] ?? '').length
  return {
    amount: (Number(line.lineSubtotal.amount) + off).toFixed(decimals),
    currencyCode: line.lineSubtotal.currencyCode,
  }
}

export function CartItems({ attributes }: SectionProps): JSX.Element {
  // Map the whole cart contract, not just its subtotal. `total` is the amount
  // after discounts and gift cards — showing `subtotal` as the total is simply
  // the wrong number the moment either applies.
  const {
    lines, subtotal, total, tax, discountAmount, note: cartNote, totalQuantity,
    checkoutUrl, error, updateQuantity, remove, updateNote,
  } = useCart()
  const t = useT()

  const heading = (attributes.heading as string) ?? t('cart.title')
  const buttonLabel = (attributes.buttonLabel as string) ?? t('cart.checkout')
  const buttonLink = (attributes.buttonLink as string) ?? checkoutUrl ?? '/checkout'
  const showVendor = attributes.showVendor === true
  const showLineCompareAt = attributes.showLineCompareAt !== false
  const enableNote = attributes.enableNote !== false
  const showPaymentIcons = attributes.showPaymentIcons !== false
  const summaryPosition = (attributes.summaryPosition as string) ?? 'right'
  const emptyStateCollection = (attributes.emptyStateCollection as string | undefined)?.trim() || undefined

  // Which line is mid-request. The row dims and holds its width rather than
  // the whole page flashing — the design's `updating` state.
  /**
   * The line ids currently mid-request — a SET, not one slot.
   *
   * A single slot was cleared in `finally` regardless of which line set it:
   * bump line A, then immediately line B, and A's response (arriving second)
   * cleared B's `updating` state while B's request was still open, so B became
   * interactive again and could be incremented against a quantity the server
   * had not acknowledged.
   */
  const [busy, setBusy] = useState<ReadonlySet<string>>(() => new Set())
  // Seeded from the cart and written back through `updateNote` — the note used
  // to live in local state only, so whatever the shopper typed was discarded.
  const [note, setNote] = useState(cartNote ?? '')
  useEffect(() => {
    setNote(cartNote ?? '')
  }, [cartNote])

  const change = async (id: string, quantity: number): Promise<void> => {
    setBusy((prev) => new Set(prev).add(id))
    try {
      await updateQuantity(id, quantity)
    } finally {
      setBusy((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <section {...sharedRootProps(attributes)} className="section">
      <div className="container">
        {/* The design puts the line count beside the heading and moves
            "Continue shopping" to the top right, where it is a way out of the
            page rather than an afterthought under the checkout button. */}
        <div className="cart__titlebar">
          <h1 className="cart__heading">
            {heading}
            {lines.length > 0 && <span className="cart__count"> ({lines.length})</span>}
          </h1>
          <Link href="/collections/all" className="cart__continue">
            {t('common.continueShopping')}
          </Link>
        </div>

        {lines.length === 0 ? (
          <EmptyCart {...(emptyStateCollection ? { collection: emptyStateCollection } : {})} />
        ) : (
          <div className="cart" data-summary={summaryPosition}>
            {error && (
              <p className="cart__error u-text-error" role="alert">
                {error}
              </p>
            )}
            <div className="cart__list">
              {/* Column headers, per the design's cart board. */}
              <div className="cart__columns" aria-hidden>
                <span>{t('cart.product')}</span>
                <span>{t('cart.quantity')}</span>
                <span>{t('cart.total')}</span>
              </div>
              {lines.map((l) => (
                <CartLineItem
                  key={l.id}
                  line={{
                    id: l.id,
                    title: l.title,
                    ...(l.variantTitle ? { variantTitle: l.variantTitle } : {}),
                    ...(l.productHandle ? { handle: l.productHandle } : {}),
                    ...(l.image ? { image: l.image } : {}),
                    quantity: l.quantity,
                    lineTotal: l.lineSubtotal,
                    ...(l.price ? { unitPrice: l.price } : {}),
                    // Real discount data: the contract has no `compareAtPrice`
                    // on a line, but a discounted line carries its allocations,
                    // and subtotal + allocations IS the pre-discount amount.
                    ...(lineCompareAt(l) ? { compareAtTotal: lineCompareAt(l) } : {}),
                  }}
                  quantityColumn
                  showVendor={showVendor}
                  showCompareAt={showLineCompareAt}
                  updating={busy.has(l.id)}
                  removeLabel={t('cart.remove')}
                  onQuantityChange={(q) => void change(l.id, q)}
                  onRemove={() => {
                    getAnalytics().track('PRODUCT_REMOVED_FROM_CART', {
                      lineId: l.id,
                      title: l.title,
                      quantity: l.quantity,
                      ...(l.productHandle ? { handle: l.productHandle } : {}),
                    })
                    void remove(l.id)
                    // The design pairs remove with an Undo toast rather than a
                    // confirmation dialog.
                    showToast(`${l.title} removed`)
                  }}
                />
              ))}

              {enableNote && (
                <div className="cart__note">
                  <Textarea
                    label={t('cart.note')}
                    placeholder={t('cart.notePlaceholder')}
                    value={note}
                    rows={3}
                    maxLength={500}
                    showCount
                    onChange={(e) => setNote(e.target.value)}
                    onBlur={() => {
                      if ((cartNote ?? '') !== note) void updateNote(note)
                    }}
                  />
                </div>
              )}
            </div>

            <CartSummary
              subtotal={subtotal}
              {...(discountAmount ? { discount: discountAmount } : {})}
              {...(tax ? { tax } : {})}
              total={total}
              itemCount={totalQuantity}
              heading={t('cart.orderSummary')}
            >
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
              {showPaymentIcons && <PaymentIcons attributes={{}} />}
            </CartSummary>
          </div>
        )}
      </div>
    </section>
  )
}

function EmptyCart({ collection }: { collection?: string }): JSX.Element {
  const t = useT()
  const { collectionByHandle } = useData()
  // The merchant can point an empty cart at a collection, so the page offers
  // something to buy rather than just a way out.
  const suggested = collection ? (collectionByHandle(collection)?.products ?? []).slice(0, 4) : []
  return (
    <div className="not-found">
      {/* h2, not h3: this sits directly under the page's h1 and skipping a
          level misreports the outline to anyone navigating by heading. */}
      <h2>{t('cart.empty.title')}</h2>
      <p className="u-text-muted">{t('cart.empty.sub')}</p>
      <Button label={t('common.shopCollection')} link="/collections/all" variant="primary" size="lg" />
      {suggested.length > 0 && (
        <div className="cart__suggested">
          <SectionHead heading={t('cart.youMayLike')} align="center" />
          <ProductGrid products={suggested.map(toCard)} columns={4} />
        </div>
      )}
    </div>
  )
}

export default defineSection({
  name: 'cart-items',
  role: 'section',
  requiresContext: ['cart'],
  title: 'Cart items',
  category: 'commerce',
  icon: '⊞',
  attributes: withShared({
    heading: { type: 'text', default: 'Your cart', label: 'Heading' },
    buttonLabel: { type: 'text', default: 'Checkout', label: 'Checkout button' },
    buttonLink: { type: 'url', label: 'Checkout link override' },
    showLineCompareAt: { type: 'boolean', default: true, label: 'Show original price on discounted lines' },
    showVendor: { type: 'boolean', default: false, label: 'Show vendor' },
    enableNote: { type: 'boolean', default: true, label: 'Allow an order note' },
    showPaymentIcons: { type: 'boolean', default: true, label: 'Show payment marks' },
    emptyStateCollection: { type: 'collection', label: 'Products to suggest when the cart is empty' },
    summaryPosition: {
      type: 'select',
      default: 'right',
      label: 'Summary position',
      options: [
        { value: 'right', label: 'Right' },
        { value: 'below', label: 'Below the items' },
      ],
    },
  }),
  component: CartItems,
})
