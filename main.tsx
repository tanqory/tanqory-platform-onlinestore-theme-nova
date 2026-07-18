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

import {
  mount,
  createLiveData,
  createLiveDataFromSnapshot,
  createMockData,
  createAnalytics,
  hasConsent,
  setBannerRequired,
  type DataApi,
  type LiveDataOptions,
  type MountOptions,
} from '@tanqory/theme-kit'
import { apiBase } from './lib/api-base'
import { decodeHandle } from './lib/handle'
import './assets/styles.css'
import mockCollections from './lib/collections.json'
import settings from './config/settings.json'

// All bundled UI-string maps, e.g. { './locales/en.json': {default:{…}}, './locales/th.json': … }.
// The active locale is chosen at boot from ?locale= / localStorage / default.
const localeModules = import.meta.glob('./locales/*.json', { eager: true }) as Record<
  string,
  { default: Record<string, string> }
>
const DEFAULT_LOCALE = 'en'
const localeMaps: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(localeModules).map(([path, mod]) => [
    path.match(/\/([^/]+)\.json$/)?.[1] ?? DEFAULT_LOCALE,
    mod.default,
  ]),
)
const baseLocale = localeMaps[DEFAULT_LOCALE] ?? {}

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
  // Shop policies (Settings) — a menu item of type "Policy" links to
  // /policies/<handle> (privacy-policy, refund-policy, …).
  if (/^\/policies\/[^/]+$/.test(p)) return 'policy'
  // Customer account — /account and its sub-routes (login, orders, addresses).
  if (p === '/account' || /^\/account\/[^/]+/.test(p)) return 'account'
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
  return m ? decodeHandle(m[1]) : undefined
}

const env = import.meta.env as ImportMetaEnv & {
  VITE_TANQORY_BACKEND?: string
  VITE_TANQORY_STORE_ID?: string
  VITE_TANQORY_STOREFRONT_TOKEN?: string
}

const page =
  typeof window !== 'undefined' ? resolveTemplate(window.location.pathname) : 'index'

// Read the template glob once so both the mount and the variant check share it.
const templateModules = import.meta.glob('./templates/*.json', { eager: true })

/** True when `templates/<name>.json` exists in this theme. */
function templateExists(name: string): boolean {
  return Object.keys(templateModules).some((k) => k.endsWith(`/${name}.json`))
}

/** `<handle>` from `/products/<handle>`, else undefined. */
function resolveProductHandle(pathname: string): string | undefined {
  const m = pathname.match(/^\/products\/([^/]+)\/?$/)
  return m ? decodeHandle(m[1]) : undefined
}

/** `<handle>` from `/collections/<handle>`, else undefined. */
function resolveCollectionHandle(pathname: string): string | undefined {
  const m = pathname.match(/^\/collections\/([^/]+)\/?$/)
  return m ? decodeHandle(m[1]) : undefined
}

/** The detail-route handle vars to prefetch (page/product/collection) so the
 *  fetched record's templateSuffix is available before mount picks the template. */
function detailHandles(pathname: string) {
  const pageHandle = resolvePageHandle(pathname)
  const productHandle = resolveProductHandle(pathname)
  const collectionHandle = resolveCollectionHandle(pathname)
  return {
    ...(pageHandle ? { pageHandle } : {}),
    ...(productHandle ? { productHandle } : {}),
    ...(collectionHandle ? { collectionHandle } : {}),
  }
}

/**
 * Upgrade a page/product/collection render to its Shopify-style template variant.
 * The merchant assigns a template to the resource; it arrives as `templateSuffix`
 * on the fetched record, so we render `templates/<type>.<suffix>.json` when that
 * file exists — otherwise keep the default `<type>` template so a stale or removed
 * suffix never renders a blank page. Only applies on client routes, which always
 * client-render (the else branch below), so it never affects the prerendered/
 * hydrated home markup.
 */
function withTemplateVariant(base: string, data: DataApi): string {
  if (typeof window === 'undefined') return base
  const p = window.location.pathname
  let suffix: string | null | undefined
  if (base === 'page') suffix = data.pageByHandle(resolvePageHandle(p) ?? '')?.templateSuffix
  else if (base === 'product')
    suffix = data.productByHandle(resolveProductHandle(p) ?? '')?.templateSuffix
  else if (base === 'collection')
    suffix = data.collectionByHandle(resolveCollectionHandle(p) ?? '')?.templateSuffix
  else return base
  return variantOf(base, suffix)
}

/** `<type>.<suffix>` when the variant file exists, else the default `<type>`. */
function variantOf(base: string, suffix: string | null | undefined): string {
  const candidate = suffix ? `${base}.${suffix}` : base
  return templateExists(candidate) ? candidate : base
}

/** `<handle>` from `/blogs/<handle>` (blog list), else undefined. */
function resolveBlogHandle(pathname: string): string | undefined {
  const m = pathname.match(/^\/blogs\/([^/]+)\/?$/)
  return m ? decodeHandle(m[1]) : undefined
}

/** `{ blogHandle, articleHandle }` from `/blogs/<blog>/<article>`, else undefined. */
function resolveArticleMatch(
  pathname: string,
): { blogHandle: string; articleHandle: string } | undefined {
  const m = pathname.match(/^\/blogs\/([^/]+)\/([^/]+)\/?$/)
  return m ? { blogHandle: decodeHandle(m[1]), articleHandle: decodeHandle(m[2]) } : undefined
}

/** Build a HeadMeta from a resource's SEO (shared by blog/article, which resolve
 *  their SEO asynchronously rather than from the sync bootstrap). */
function headFrom(
  seo: { title?: string | null; description?: string | null; keywords?: string[] | null } | null | undefined,
  resourceTitle: string,
  shopName: string,
  fallbackDesc?: string | null,
  image?: string | null,
): HeadMeta {
  return {
    title: seo?.title?.trim() ? seo.title.trim() : `${resourceTitle} — ${shopName}`,
    description: (seo?.description || fallbackDesc || '').trim(),
    keywords: (seo?.keywords ?? []).filter(Boolean),
    image: absUrl(image),
    type: 'article',
    siteName: shopName,
    favicon: '',
  }
}

/**
 * Per-route document head (title + meta description) from the merchant's SEO
 * fields. Precedence — title: the resource's SEO title verbatim (merchant owns
 * it) → "<resource title> — <shop>" → shop name; description: SEO description →
 * page bodySummary → shop description (home only). Runs client-side on every
 * route (the SSG only prerenders home), so product/collection/page pages that
 * are client-rendered still get a correct, unique title + description.
 */
interface HeadMeta {
  title: string
  description: string
  keywords: string[]
  /** Absolute URL of the page's lead image, for og:image / twitter:image. */
  image: string
  /** 'website' for the home page, 'product'/'article' for detail pages. */
  type: string
  /** Shop name — og:site_name. */
  siteName: string
  /** Absolute URL for the favicon / tab icon (square brand mark). */
  favicon: string
}

/** Resolve a possibly-relative asset URL to an absolute one, against the
 *  current origin — social scrapers require absolute og:image URLs. */
function absUrl(url: string | undefined | null): string {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  if (typeof window === 'undefined') return url
  return new URL(url, window.location.origin).toString()
}

function computeHead(pathname: string, data: DataApi): HeadMeta {
  const shop = data.shop as
    | {
        name?: string
        description?: string
        brand?: {
          logo?: { url?: string } | null
          squareLogo?: { url?: string } | null
          coverImage?: { url?: string } | null
        } | null
      }
    | undefined
  const shopName = (shop?.name || (settings as { shopName?: string }).shopName || 'Store').trim()
  let seoTitle: string | null | undefined
  let rawTitle: string | undefined
  let description: string | null | undefined
  let keywords: string[] = []
  let image: string | undefined
  let type = 'website'
  const isDetail = { pg: resolvePageHandle(pathname), pr: resolveProductHandle(pathname), co: resolveCollectionHandle(pathname) }
  if (isDetail.pr) {
    const r = data.productByHandle(isDetail.pr) as
      | { seo?: { title?: string | null; description?: string | null; keywords?: string[] }; title?: string; featuredImage?: { url?: string } | null }
      | undefined
    seoTitle = r?.seo?.title; rawTitle = r?.title; description = r?.seo?.description; keywords = r?.seo?.keywords ?? []
    image = r?.featuredImage?.url; type = 'product'
  } else if (isDetail.co) {
    const r = data.collectionByHandle(isDetail.co) as
      | { seo?: { title?: string | null; description?: string | null; keywords?: string[] }; title?: string; image?: { url?: string } | null }
      | undefined
    seoTitle = r?.seo?.title; rawTitle = r?.title; description = r?.seo?.description; keywords = r?.seo?.keywords ?? []
    image = r?.image?.url
  } else if (isDetail.pg) {
    const r = data.pageByHandle(isDetail.pg)
    seoTitle = r?.seo?.title; rawTitle = r?.title; description = r?.seo?.description || r?.bodySummary; keywords = r?.seo?.keywords ?? []
    type = 'article'
  }
  const isHome = !isDetail.pg && !isDetail.pr && !isDetail.co
  const title = seoTitle?.trim() ? seoTitle.trim() : rawTitle ? `${rawTitle} — ${shopName}` : shopName
  return {
    title,
    description: (description || (isHome ? shop?.description : '') || '').trim(),
    keywords: keywords.filter(Boolean),
    // og:image fallback chain: the resource's own image → the brand cover image
    // (Settings → Brand, a purpose-built share banner) → the brand logo. Both
    // brand images were SAVED_ONLY — carried on the SDL, rendered nowhere.
    image: absUrl(image || shop?.brand?.coverImage?.url || shop?.brand?.logo?.url),
    type,
    siteName: shopName,
    // The square brand mark makes the best favicon / tab icon; fall back to the
    // primary logo. Also previously SAVED_ONLY.
    favicon: absUrl(shop?.brand?.squareLogo?.url || shop?.brand?.logo?.url),
  }
}

/**
 * Write the computed head into the live document (client-side).
 *
 * Beyond title/description/keywords this now emits the canonical link + Open
 * Graph + Twitter card tags that were missing entirely — which is why a shared
 * product link previewed as the bare shop name on every page. The canonical and
 * og:url use the page's own URL (the host the storefront is served on is the
 * correct canonical for that page); forcing canonical to a configured primary
 * domain when a shopper is on a different host is the store-api#558 follow-up.
 */
function applyHead({ title, description, keywords, image, type, siteName, favicon }: HeadMeta): void {
  if (typeof document === 'undefined') return
  const head = document.head
  if (title) document.title = title

  const upsert = (selector: string, make: () => HTMLElement, content: string) => {
    if (!content) return
    let el = head.querySelector(selector)
    if (!el) {
      el = make()
      head.appendChild(el)
    }
    if (el.tagName === 'LINK') el.setAttribute('href', content)
    else el.setAttribute('content', content)
  }
  const meta = (name: string, content: string) =>
    upsert(`meta[name="${name}"]`, () => {
      const m = document.createElement('meta')
      m.setAttribute('name', name)
      return m
    }, content)
  const prop = (property: string, content: string) =>
    upsert(`meta[property="${property}"]`, () => {
      const m = document.createElement('meta')
      m.setAttribute('property', property)
      return m
    }, content)

  const url = window.location.origin + window.location.pathname

  meta('description', description)
  meta('keywords', keywords.join(', '))

  upsert('link[rel="canonical"]', () => {
    const l = document.createElement('link')
    l.setAttribute('rel', 'canonical')
    return l
  }, url)

  prop('og:type', type)
  prop('og:url', url)
  prop('og:title', title)
  prop('og:description', description)
  prop('og:site_name', siteName)
  if (image) prop('og:image', image)

  meta('twitter:card', image ? 'summary_large_image' : 'summary')
  meta('twitter:title', title)
  meta('twitter:description', description)
  if (image) meta('twitter:image', image)

  if (favicon) {
    upsert(
      'link[rel="icon"]',
      () => {
        const l = document.createElement('link')
        l.setAttribute('rel', 'icon')
        return l
      },
      favicon,
    )
  }
}

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

/**
 * Active UI locale code — URL ?locale= → localStorage `tq-locale` → default.
 * Mirrors resolveCountry + the LocaleSwitch precedence, and only accepts a code
 * we actually bundle a string map for (else the switcher would blank the UI).
 */
function resolveLocale(): string {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const norm = (v: string | null): string | null =>
    v && /^[A-Za-z]{2}(-[A-Za-z]{2})?$/.test(v) ? v.toLowerCase() : null
  const u = norm(new URLSearchParams(window.location.search).get('locale'))
  if (u && localeMaps[u]) return u
  try {
    const s = norm(window.localStorage.getItem('tq-locale'))
    if (s && localeMaps[s]) return s
  } catch {
    /* private mode etc. */
  }
  return DEFAULT_LOCALE
}

/** The active locale's strings, with the default locale as the fallback base so
 *  a partially-translated locale shows English (not raw keys). */
function pickLocale(): Record<string, string> {
  const code = resolveLocale()
  return code === DEFAULT_LOCALE ? baseLocale : { ...baseLocale, ...(localeMaps[code] ?? {}) }
}

const activeLocale = pickLocale()

/** The locale code to send to the backend (X-Tanqory-Lang) for content
 *  translation — only when non-default, so default-language requests skip the
 *  translation overlay entirely. */
function localeHeader(): string | undefined {
  const code = resolveLocale()
  return code !== DEFAULT_LOCALE ? code : undefined
}

async function bootData(): Promise<DataApi> {
  const { VITE_TANQORY_BACKEND, VITE_TANQORY_STORE_ID, VITE_TANQORY_STOREFRONT_TOKEN } = env
  if (VITE_TANQORY_BACKEND && VITE_TANQORY_STORE_ID) {
    try {
      return await createLiveData({
        endpoint: apiBase(VITE_TANQORY_BACKEND),
        storeId: VITE_TANQORY_STORE_ID,
        token: VITE_TANQORY_STOREFRONT_TOKEN,
        country: resolveCountry(),
        locale: localeHeader(),
        ...(typeof window !== 'undefined' ? detailHandles(window.location.pathname) : {}),
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

/** The SSG data snapshot the prerender step embedded into the page (see
 *  entry-server.tsx) — present only on prerendered storefront HTML. */
declare global {
  interface Window {
    __TQ_STATE__?: { page?: string; bootstrap?: unknown }
  }
}

const baseMountOptions = (data: DataApi): MountOptions => ({
  sections: import.meta.glob('./sections/*.tsx', { eager: true }),
  pages: templateModules,
  shell: import.meta.glob('./layouts/*.tsx', { eager: true }),
  data,
  settings,
  locale: activeLocale,
  page,
})

const ssgState = typeof window !== 'undefined' ? window.__TQ_STATE__ : undefined
const { VITE_TANQORY_BACKEND, VITE_TANQORY_STORE_ID, VITE_TANQORY_STOREFRONT_TOKEN } = env

// Storefront analytics — ONLY on the real published storefront (live data, not
// the editor/preview plane). page_viewed events create sessions + device rows,
// which power the merchant's Analytics/Reports/Live View. Beacons go same-origin
// to /api/v1/analytics/events/batch (the edge worker forwards to the cell).
const isPreviewHost =
  typeof window !== 'undefined' && /^preview-/.test(window.location.hostname)
const analytics =
  VITE_TANQORY_BACKEND && VITE_TANQORY_STORE_ID && !isPreviewHost
    ? createAnalytics({ storeId: VITE_TANQORY_STORE_ID, consent: () => hasConsent('analytics') })
    : null

/** Set the consent gate from shop data BEFORE the first pageViewed, so a store
 *  with the cookie banner enabled doesn't emit until the shopper has consented. */
function armConsent(data: DataApi): void {
  const cb = (data.shop as { cookieBanner?: { enabled?: boolean } } | undefined)?.cookieBanner
  setBannerRequired(Boolean(cb?.enabled))
}

/** Emit the route/VIEW customer events (product/collection/search/cart) that map
 *  to the current URL. Fires once per page load alongside pageViewed — action
 *  events (add-to-cart, remove, checkout) fire from their section handlers. Both
 *  the internal analytics pipeline and connected pixels receive these. */
function emitRouteEvents(pathname: string, data: DataApi): void {
  if (!analytics) return
  try {
    const product = decodeHandle(pathname.match(/\/products\/([^/]+)/)?.[1])
    const collection = decodeHandle(pathname.match(/\/collections\/([^/]+)/)?.[1])
    if (product) {
      const p = data.productByHandle?.(product)
      analytics.track(
        'PRODUCT_VIEWED',
        p ? { productId: p.id, title: p.title, handle: p.handle, price: p.price } : { handle: product },
      )
    } else if (collection) {
      const c = data.collectionByHandle?.(collection)
      analytics.track(
        'COLLECTION_VIEWED',
        c
          ? { collectionId: c.id, title: c.title, handle: collection, productCount: c.products?.length }
          : { handle: collection },
      )
    } else if (/^\/search\b/.test(pathname)) {
      const q = new URLSearchParams(window.location.search).get('q')?.trim()
      if (q) analytics.track('SEARCH_SUBMITTED', { query: q })
    } else if (/^\/cart\b/.test(pathname)) {
      analytics.track('CART_VIEWED', {})
    }
  } catch {
    /* telemetry must never break the page */
  }
}

if (
  ssgState?.bootstrap &&
  VITE_TANQORY_BACKEND &&
  VITE_TANQORY_STORE_ID &&
  page === (ssgState.page ?? 'index') &&
  // SSG bakes the DEFAULT locale's strings; a non-default ?locale= would render
  // different useT() text than the server did → hydration mismatch (#418). Those
  // visitors take the client-render path below instead.
  resolveLocale() === DEFAULT_LOCALE
) {
  // DETERMINISTIC HYDRATION: rebuild the DataApi synchronously from the exact
  // bootstrap the server rendered with — the first client render matches the
  // SSG markup byte-for-byte (no network, no drift, no React #418/#425). Fresh
  // data is fetched AFTER hydration and reconciled in place (SWR).
  const liveOpts: LiveDataOptions = {
    endpoint: apiBase(VITE_TANQORY_BACKEND),
    storeId: VITE_TANQORY_STORE_ID,
    token: VITE_TANQORY_STOREFRONT_TOKEN,
    country: resolveCountry(),
    locale: localeHeader(),
  }
  const data = createLiveDataFromSnapshot(ssgState.bootstrap, liveOpts)
  mount({
    ...baseMountOptions(data),
    revalidate: async () => {
      try {
        return await createLiveData({ ...liveOpts, ...detailHandles(window.location.pathname) })
      } catch {
        return null // keep the snapshot data — a failed refresh must not blank the page
      }
    },
  })
  applyHead(computeHead(window.location.pathname, data))
  armConsent(data)
  analytics?.pageViewed()
  emitRouteEvents(window.location.pathname, data)
} else {
  // No usable snapshot (mock build, or this route isn't the prerendered page).
  // Fetch first, then CLIENT-render: any SSG markup in #root belongs to a
  // different page/data, and hydrating against it would mismatch (#418). Because
  // this path always client-renders, choosing a `/pages/<handle>` template
  // variant here is safe (no prerendered markup to mismatch).
  void bootData().then(async (data) => {
    const pathname = window.location.pathname
    let finalPage = withTemplateVariant(page, data)
    let head = computeHead(pathname, data)
    // Blog + article are fetched on demand (not in the sync bootstrap), so
    // resolve their template variant + SEO head asynchronously before mount.
    const shop = data.shop as { name?: string } | undefined
    const shopName = (shop?.name || (settings as { shopName?: string }).shopName || 'Store').trim()
    const am = resolveArticleMatch(pathname)
    const bh = resolveBlogHandle(pathname)
    if (page === 'article' && am && data.articleByHandle) {
      const a = await data.articleByHandle(am.blogHandle, am.articleHandle)
      if (a) {
        finalPage = variantOf('article', a.templateSuffix)
        head = headFrom(a.seo, a.title, shopName, a.excerpt)
      }
    } else if (page === 'blog' && bh && data.blogByHandle) {
      const b = await data.blogByHandle(bh)
      if (b) {
        finalPage = variantOf('blog', b.templateSuffix)
        head = headFrom(b.seo, b.title, shopName)
      }
    }
    mount({ ...baseMountOptions(data), page: finalPage, forceClientRender: true })
    applyHead(head)
    armConsent(data)
    analytics?.pageViewed()
    emitRouteEvents(pathname, data)
  })
}
