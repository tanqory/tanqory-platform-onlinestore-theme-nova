/**
 * Route-level storefront analytics.
 *
 * `pageViewed` plus the VIEW customer event that matches the URL
 * (product/collection/search/cart). Action events — add-to-cart, remove,
 * checkout — fire from their own section handlers, not here.
 *
 * Extracted from `main.tsx` because it has to run on SPA navigation too. It
 * only ran at boot, so with SPA routing on (the default) a shopper who browsed
 * five products produced exactly one PRODUCT_VIEWED — for whichever page they
 * happened to land on first.
 *
 * `emitRoute` is idempotent per route: it remembers the last pathname+search it
 * emitted for and does nothing if asked again. React effects can and do run
 * twice (StrictMode, a re-render mid-navigation), and a double PRODUCT_VIEWED
 * is a silently wrong number in the merchant's reports.
 */
import { getAnalytics } from './tanqory/index'
import type { DataApi } from './tanqory/index'
import { matchRoute } from './routes.ts'

let lastEmitted: string | null = null

/** Forget the last emitted route. Tests only. */
export function resetRouteAnalytics(): void {
  lastEmitted = null
}

/**
 * Emit `pageViewed` + the matching VIEW event for `url`, unless this exact URL
 * was the previous emission.
 *
 * `getAnalytics()` is the kit's singleton: it is a no-op until `createAnalytics`
 * has armed it, so calling this in the editor preview or on a mock build sends
 * nothing rather than needing its own guard.
 */
export function emitRoute(url: { pathname: string; search: string }, data: DataApi): boolean {
  const key = url.pathname + url.search
  if (key === lastEmitted) return false
  lastEmitted = key

  const analytics = getAnalytics()
  try {
    analytics.pageViewed()
    const route = matchRoute(url.pathname)
    if (route.resource === 'product' && route.handle) {
      const p = data.productByHandle?.(route.handle)
      analytics.track(
        'PRODUCT_VIEWED',
        p
          ? { productId: p.id, title: p.title, handle: p.handle, price: p.price }
          : { handle: route.handle },
      )
    } else if (route.resource === 'collection' && route.handle) {
      const c = data.collectionByHandle?.(route.handle)
      analytics.track(
        'COLLECTION_VIEWED',
        c
          ? {
              collectionId: c.id,
              title: c.title,
              handle: route.handle,
              productCount: c.products?.length,
            }
          : { handle: route.handle },
      )
    } else if (route.template === 'search') {
      const q = new URLSearchParams(url.search).get('q')?.trim()
      if (q) analytics.track('SEARCH_SUBMITTED', { query: q })
    } else if (route.template === 'cart') {
      analytics.track('CART_VIEWED', {})
    }
  } catch {
    /* telemetry must never break the page */
  }
  return true
}
