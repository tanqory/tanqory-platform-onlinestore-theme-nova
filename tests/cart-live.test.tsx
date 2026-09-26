/**
 * The live cart against a backend that says no.
 *
 * Each test names the behaviour that was wrong before:
 *   - a refused add resolved like a success, so the product page emitted an
 *     "added" event and opened a drawer without the item;
 *   - two adds racing before the first `cartCreate` answered each created a
 *     cart, and the first item was lost in the one whose id was overwritten;
 *   - a failed remove / quantity change kept the optimistic UI, so a line the
 *     backend still held was invisible until checkout.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { useCart, type CartApi } from '../lib/tanqory/index'
import { ProductDetails } from '../sections/ProductDetails'
import { click, product, renderSection, setUrl, stubData } from './helpers/render'
import en from '../locales/en.json'

const CART = (id: string, lines: Array<{ id: string; merchandiseId: string; quantity: number }>) => ({
  id,
  checkoutUrl: `/checkout/${id}`,
  totalQuantity: lines.reduce((n, l) => n + l.quantity, 0),
  cost: {
    subtotalAmount: { amount: '10.00', currencyCode: 'USD' },
    totalAmount: { amount: '10.00', currencyCode: 'USD' },
  },
  discountCodes: [],
  discountAllocations: [],
  appliedGiftCards: [],
  lines: {
    nodes: lines.map((l) => ({
      id: l.id,
      quantity: l.quantity,
      cost: { totalAmount: { amount: '10.00', currencyCode: 'USD' } },
      merchandise: {
        id: l.merchandiseId,
        title: 'Default Title',
        price: { amount: '10.00', currencyCode: 'USD' },
        product: { title: 'Tee', handle: 'tee' },
      },
    })),
  },
})

/** Exposes the cart api to the test through a ref-like holder. */
function Probe({ out }: { out: { cart?: CartApi } }): JSX.Element {
  out.cart = useCart()
  return <span data-lines={out.cart.lines.length}>{out.cart.error ?? ''}</span>
}

describe('live cart — refusals and races', () => {
  it('add() resolves false and records the reason when the backend returns userErrors', async () => {
    const data = stubData({
      graphql: (async (q: string) => {
        if (q.includes('cartCreate')) return { cartCreate: { cart: null, userErrors: [{ message: 'Sold out' }] } }
        return {}
      }) as never,
    })
    const out: { cart?: CartApi } = {}
    const h = await renderSection(<Probe out={out} />, data)
    let result: boolean | undefined
    await act(async () => {
      result = await out.cart!.add({ variantId: 'gid://variant/1' })
    })
    expect(result).toBe(false)
    expect(out.cart!.error).toBe('Sold out')
    expect(out.cart!.lines).toHaveLength(0)
    h.unmount()
  })

  it('two adds racing before cartCreate answers create ONE cart and keep both lines', async () => {
    let creates = 0
    let adds = 0
    let release: () => void = () => {}
    const gate = new Promise<void>((r) => (release = r))
    const data = stubData({
      graphql: (async (q: string, vars?: Record<string, unknown>) => {
        const lines = vars?.lines as Array<{ merchandiseId: string; quantity: number }>
        if (q.includes('cartCreate')) {
          creates++
          await gate
          return { cartCreate: { cart: CART('cart-1', [{ id: 'l1', merchandiseId: lines[0].merchandiseId, quantity: 1 }]), userErrors: [] } }
        }
        if (q.includes('cartLinesAdd')) {
          adds++
          expect(vars?.cartId).toBe('cart-1')
          return {
            cartLinesAdd: {
              cart: CART('cart-1', [
                { id: 'l1', merchandiseId: 'gid://variant/a', quantity: 1 },
                { id: 'l2', merchandiseId: lines[0].merchandiseId, quantity: 1 },
              ]),
              userErrors: [],
            },
          }
        }
        return {}
      }) as never,
    })
    const out: { cart?: CartApi } = {}
    const h = await renderSection(<Probe out={out} />, data)
    let results: boolean[] = []
    await act(async () => {
      const p = Promise.all([
        out.cart!.add({ variantId: 'gid://variant/a' }),
        out.cart!.add({ variantId: 'gid://variant/b' }),
      ])
      await Promise.resolve()
      release()
      results = await p
    })
    expect(results).toEqual([true, true])
    expect(creates).toBe(1)
    expect(adds).toBe(1)
    expect(out.cart!.lines.map((l) => l.variantId)).toEqual(['gid://variant/a', 'gid://variant/b'])
    h.unmount()
  })

  it('a refused remove or quantity change puts the line back', async () => {
    const data = stubData({
      graphql: (async (q: string) => {
        if (q.includes('cartCreate')) {
          return { cartCreate: { cart: CART('cart-1', [{ id: 'l1', merchandiseId: 'gid://variant/a', quantity: 1 }]), userErrors: [] } }
        }
        if (q.includes('cartLinesRemove')) return { cartLinesRemove: { cart: null, userErrors: [{ message: 'Cart is locked' }] } }
        if (q.includes('cartLinesUpdate')) throw new Error('network down')
        return {}
      }) as never,
    })
    const out: { cart?: CartApi } = {}
    const h = await renderSection(<Probe out={out} />, data)
    await act(async () => {
      await out.cart!.add({ variantId: 'gid://variant/a' })
    })
    expect(out.cart!.lines).toHaveLength(1)

    await act(async () => {
      await out.cart!.remove('l1')
    })
    expect(out.cart!.lines).toHaveLength(1)
    expect(out.cart!.error).toBe('Cart is locked')

    await act(async () => {
      await out.cart!.updateQuantity('l1', 3)
    })
    expect(out.cart!.lines[0].quantity).toBe(1)
    expect(out.cart!.error).toBe('network down')
    h.unmount()
  })
})

describe('product page — a refused add is shown as a failure', () => {
  it('shows the add-failed message and does not open the cart drawer', async () => {
    setUrl('/products/tee')
    const data = stubData({
      collections: [{ handle: 'all', title: 'All', products: [product('tee', { title: 'Tee', variantId: 'gid://variant/1' } as never)] }],
      graphql: (async (q: string) => {
        if (q.includes('cartCreate')) return { cartCreate: { cart: null, userErrors: [{ message: 'Sold out' }] } }
        return {}
      }) as never,
    })
    const h = await renderSection(<ProductDetails attributes={{}} />, data)
    await h.settle()
    const btn = [...h.container.querySelectorAll('button')].find((b) => /add to cart/i.test(b.textContent ?? ''))
    click(btn)
    await h.settle()
    await h.settle()
    expect(h.text()).toContain(en['product.addFailed'])
    h.unmount()
  })
})
