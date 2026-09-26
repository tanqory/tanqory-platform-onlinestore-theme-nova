import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `checkout_completed` — the event every purchase pixel binds to — and the `analytics` binding the
 * wizard's snippets need. The snippets below are the pixel wizard's own handlers, verbatim
 * (tanqory-platform-store …/settings/customer_events/pixels/new/page.tsx).
 */
const META = `analytics.subscribe("checkout_completed", (event) => {
  fbq('track', 'Purchase', {
    value: event.data.checkout?.totalPrice?.amount,
    currency: event.data.checkout?.totalPrice?.currencyCode,
    content_ids: event.data.checkout?.lineItems?.map(item => item.variant?.id),
    content_type: 'product',
    num_items: event.data.checkout?.lineItems?.length,
  });
});`
const GA4 = `analytics.subscribe("checkout_completed", (event) => {
  gtag('event', 'purchase', {
    transaction_id: event.data.checkout?.order?.id,
    value: event.data.checkout?.totalPrice?.amount,
    currency: event.data.checkout?.totalPrice?.currencyCode,
    items: event.data.checkout?.lineItems?.map(item => ({
      item_id: item.variant?.id,
      item_name: item.title,
    }))
  });
});`

const completed = (currency: string, total: number, orderId = 'ord-1') => ({
  checkout: {
    currencyCode: currency,
    totalPrice: { amount: total, currencyCode: currency },
    lineItems: [{ title: 'Widget', quantity: 1, variant: { id: 'var-1' } }],
    order: { id: orderId, number: '1001' },
  },
})

async function fresh() {
  vi.resetModules()
  // `window.tqAnalytics` is set once per page; a new test module instance is a new page
  delete (window as unknown as { tqAnalytics?: unknown }).tqAnalytics
  const mod = await import('../lib/tanqory/index')
  const analytics = mod.createAnalytics({ storeId: '11111111-1111-4111-8111-111111111111' })
  return { ...mod, analytics }
}

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'sendBeacon', { value: vi.fn(() => true), configurable: true })
})

describe('checkout_completed on the pixel bus', () => {
  it('delivers a purchase named checkout_completed with the shape the snippets read', async () => {
    const { analytics, subscribe } = await fresh()
    const seen: Array<{ name: string; type: string; data: any }> = []
    subscribe('checkout_completed', (e) => seen.push(e as any))
    expect(analytics.checkoutCompleted(completed('USD', 105) as any)).toBe(true)
    expect(seen).toHaveLength(1)
    expect(seen[0].type).toBe('CHECKOUT_COMPLETED')
    expect(seen[0].data.checkout.totalPrice).toEqual({ amount: 105, currencyCode: 'USD' })
    expect(seen[0].data.checkout.order.id).toBe('ord-1')
  })

  it('publishes an order at most ONCE — a second call and a reload do not double-count', async () => {
    const first = await fresh()
    const a: unknown[] = []
    first.subscribe('checkout_completed', (e) => a.push(e))
    expect(first.analytics.checkoutCompleted(completed('EUR', 99.9) as any)).toBe(true)
    expect(first.analytics.checkoutCompleted(completed('EUR', 99.9) as any)).toBe(false)
    expect(a).toHaveLength(1)

    // a fresh page load in the same browser (module state reset, localStorage kept)
    const reload = await fresh()
    const b: unknown[] = []
    reload.subscribe('checkout_completed', (e) => b.push(e))
    expect(reload.analytics.checkoutCompleted(completed('EUR', 99.9) as any)).toBe(false)
    expect(b).toHaveLength(0)
    // a different order is a new purchase
    expect(reload.analytics.checkoutCompleted(completed('EUR', 10, 'ord-2') as any)).toBe(true)
  })

  it('needs marketing consent, and a purchase seen before consent is NOT lost or marked sent', async () => {
    const { analytics, subscribe, setBannerRequired, setConsent } = await fresh()
    setBannerRequired(true) // deny until decided
    const seen: unknown[] = []
    subscribe('checkout_completed', (e) => seen.push(e))
    expect(analytics.checkoutCompleted(completed('USD', 5) as any)).toBe(false)
    expect(seen).toHaveLength(0)
    expect(localStorage.getItem('tq-px-sent')).toBeNull()
    setConsent({ analytics: true, marketing: false })
    expect(analytics.checkoutCompleted(completed('USD', 5) as any)).toBe(false)
    setConsent({ analytics: true, marketing: true })
    expect(analytics.checkoutCompleted(completed('USD', 5) as any)).toBe(true)
    expect(seen).toHaveLength(1)
  })

  it('global: the currency is the ORDER’s — USD, EUR, THB, JPY — and an unknown one is refused, never defaulted', async () => {
    for (const [cur, total] of [['USD', 105], ['EUR', 99.9], ['THB', 3590], ['JPY', 15000]] as const) {
      const { analytics, subscribe } = await fresh()
      localStorage.clear()
      let got: any
      subscribe('checkout_completed', (e) => (got = e))
      expect(analytics.checkoutCompleted(completed(cur, total) as any)).toBe(true)
      expect(got.data.checkout.totalPrice).toEqual({ amount: total, currencyCode: cur })
    }
    const { analytics } = await fresh()
    expect(analytics.checkoutCompleted(completed('', 5) as any)).toBe(false)
    expect(analytics.checkoutCompleted(completed('US', 5) as any)).toBe(false)
    expect(analytics.checkoutCompleted(completed('usd', 5) as any)).toBe(false)
    const mismatch = completed('USD', 5)
    mismatch.checkout.currencyCode = 'THB'
    expect(analytics.checkoutCompleted(mismatch as any)).toBe(false)
    expect(analytics.checkoutCompleted(completed('USD', 5, '') as any)).toBe(false)
  })
})

describe('the `analytics` binding the wizard snippets need', () => {
  it('an unwrapped snippet throws (the defect: no global `analytics` exists)', () => {
    expect(() => new Function(META)()).toThrow(ReferenceError)
  })

  it('wrapPixelCode hands the bus in: Meta and GA4 each get exactly one Purchase', async () => {
    const { analytics, wrapPixelCode } = await fresh()
    const fbq = vi.fn()
    const gtag = vi.fn()
    Object.assign(globalThis, { fbq, gtag })
    new Function(wrapPixelCode(META))()
    new Function(wrapPixelCode(GA4))()
    analytics.checkoutCompleted(completed('JPY', 15000) as any)
    expect(fbq).toHaveBeenCalledTimes(1)
    expect(fbq).toHaveBeenCalledWith('track', 'Purchase', {
      value: 15000,
      currency: 'JPY',
      content_ids: ['var-1'],
      content_type: 'product',
      num_items: 1,
    })
    expect(gtag).toHaveBeenCalledTimes(1)
    expect(gtag.mock.calls[0][2]).toMatchObject({ transaction_id: 'ord-1', value: 15000, currency: 'JPY' })
  })

  it('a snippet that throws does not stop the others', async () => {
    const { analytics, wrapPixelCode } = await fresh()
    const fbq = vi.fn()
    Object.assign(globalThis, { fbq })
    new Function(wrapPixelCode('analytics.subscribe("checkout_completed", () => { throw new Error("x") })'))()
    new Function(wrapPixelCode(META))()
    analytics.checkoutCompleted(completed('USD', 5) as any)
    expect(fbq).toHaveBeenCalledTimes(1)
  })
})
