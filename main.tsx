// Theme entry — picks the page template from window.location.pathname AND
// chooses live vs mock data based on Vite build-time env vars:
//
//   VITE_TANQORY_BACKEND          → https://api-do-sgp1.tanqory.com (prod)
//                                   https://dev-api-do-sgp1.tanqory.com (dev)
//   VITE_TANQORY_STORE_ID         → the store's UUID
//   VITE_TANQORY_STOREFRONT_TOKEN → publishable storefront key (safe to ship)
//
// Either ALL three are set (→ createLiveData) or none are (→ createMockData
// with the bundled lib/collections.json fixtures). Falling back to mocks
// keeps the editor preview + offline dev working unchanged.

import { mount, createLiveData, createMockData, type DataApi } from '@tanqory/theme-kit'
import { apiBase } from './lib/api-base'
import './assets/styles.css'
import mockCollections from './lib/collections.json'
import settings from './config/settings.json'
import locale from './locales/en.json'

/** Map a URL pathname → template name (a file under ./templates). */
function resolveTemplate(pathname: string): string {
  const p = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/'
  if (p === '/' || p === '') return 'index'
  if (p === '/cart') return 'cart'
  if (p === '/search') return 'search'
  if (p === '/contact') return 'contact'
  if (p === '/404') return '404'
  if (p === '/collections') return 'list-collections'
  if (/^\/collections\/[^/]+$/.test(p)) return 'collection'
  if (/^\/products\/[^/]+$/.test(p)) return 'product'
  if (/^\/pages\/[^/]+$/.test(p)) return 'page'
  if (/^\/policies\/[^/]+$/.test(p)) return 'policy'
  // Order matters: `/blogs/<blog>/<article>` must be tested BEFORE
  // `/blogs/<handle>` so blog-list doesn't shadow article-detail.
  if (/^\/blogs\/[^/]+\/[^/]+$/.test(p)) return 'article'
  if (/^\/blogs\/[^/]+$/.test(p)) return 'blog'
  return '404'
}

/** Extract `<handle>` from `/pages/<handle>` so the bootstrap can prefetch the
 *  matching Page in the same GraphQL round-trip the homepage uses. Returns
 *  undefined when the URL isn't a `/pages/...` route. */
function resolvePageHandle(pathname: string): string | undefined {
  const m = pathname.match(/^\/pages\/([^/]+)\/?$/)
  return m ? m[1] : undefined
}

const env = import.meta.env as ImportMetaEnv & {
  VITE_TANQORY_BACKEND?: string
  VITE_TANQORY_STORE_ID?: string
  VITE_TANQORY_STOREFRONT_TOKEN?: string
}

const page =
  typeof window !== 'undefined' ? resolveTemplate(window.location.pathname) : 'index'

/**
 * Pick the country (ISO 3166 alpha-2) for this page load:
 *
 *   URL ?country=SG  →  localStorage tq-country  →  null (no Market header,
 *                                                    backend uses store base)
 *
 * Mirrors the precedence the LocaleSwitch component uses in layout.tsx so
 * that what the user sees in the picker stays in sync with what GraphQL
 * actually returns. Runs at boot; switching country in the picker writes
 * to BOTH URL + localStorage and reloads the page.
 */
function resolveCountry(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const fromUrl = new URLSearchParams(window.location.search).get('country')
  if (fromUrl && /^[A-Za-z]{2}$/.test(fromUrl)) return fromUrl.toUpperCase()
  try {
    const stored = window.localStorage.getItem('tq-country')
    if (stored && /^[A-Za-z]{2}$/.test(stored)) return stored.toUpperCase()
  } catch {
    /* private mode etc. */
  }
  return undefined
}

async function bootData(): Promise<DataApi> {
  const { VITE_TANQORY_BACKEND, VITE_TANQORY_STORE_ID, VITE_TANQORY_STOREFRONT_TOKEN } = env
  if (VITE_TANQORY_BACKEND && VITE_TANQORY_STORE_ID) {
    try {
      const pageHandle =
        typeof window !== 'undefined' ? resolvePageHandle(window.location.pathname) : undefined
      return await createLiveData({
        endpoint: apiBase(VITE_TANQORY_BACKEND),
        storeId: VITE_TANQORY_STORE_ID,
        token: VITE_TANQORY_STOREFRONT_TOKEN,
        country: resolveCountry(),
        ...(pageHandle ? { pageHandle } : {}),
      })
    } catch (err) {
      // Log + fall through to mocks so a broken backend doesn't block the
      // storefront from rendering. Helpful during the cutover.
      // eslint-disable-next-line no-console
      console.error('[nova] live data fetch failed, falling back to mocks:', err)
    }
  }
  return createMockData(mockCollections)
}

void bootData().then((data) =>
  mount({
    sections: import.meta.glob('./sections/*.tsx', { eager: true }),
    pages: import.meta.glob('./templates/*.json', { eager: true }),
    shell: import.meta.glob('./layouts/*.tsx', { eager: true }),
    data,
    settings,
    locale,
    page,
  }),
)
