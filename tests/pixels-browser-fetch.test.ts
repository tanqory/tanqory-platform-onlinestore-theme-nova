/**
 * S8 store-api#2532 C-1 — the buyer's Sec-GPC header must reach store-api's `customPixels` resolver.
 *
 * Browsers attach `Sec-GPC: 1` (set by the user agent itself, so no CORS preflight for it) to EVERY request they make. That
 * only helps if the query runs in the BUYER'S BROWSER. This pins that: `customPixels` is fetched from `TrackingPixels`'s
 * `useEffect` (client only, never during SSG/SSR), through the theme's own `fetch`-based GraphQL client; it is not part of
 * the build-time bootstrap snapshot, and no server-side renderer proxies it. If a server-side path is ever added, the buyer's
 * signal must be forwarded as `X-Tanqory-GPC: 1` (store-api honours both).
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

describe('customPixels runs in the buyer\'s browser', () => {
  it('TrackingPixels fetches pixels inside useEffect (client-only)', () => {
    const src = read('components/TrackingPixels.tsx')
    const effect = src.slice(src.indexOf('useEffect('))
    expect(effect).toMatch(/void pixels\(\)/)
    // never called at module scope or during render
    expect(src.slice(0, src.indexOf('useEffect('))).not.toMatch(/pixels\(\)/)
  })

  it('the pixels query is a live GraphQL fetch, not part of the bootstrap snapshot', () => {
    const data = read('lib/tanqory/data.tsx')
    expect(data).toMatch(/query NovaPixels \{ customPixels/)
    const storefront = read('lib/tanqory/storefront.ts')
    // the SSG/bootstrap query selects the shop + menus, never customPixels
    const bootstrap = storefront.slice(storefront.indexOf('BOOTSTRAP_SHOP_MENU'))
    expect(bootstrap.slice(0, 2500)).not.toMatch(/customPixels/)
  })

  it('no server-side entry fetches customPixels (entry-server never proxies the buyer\'s request)', () => {
    expect(read('entry-server.tsx')).not.toMatch(/customPixels|NovaPixels/)
  })
})
