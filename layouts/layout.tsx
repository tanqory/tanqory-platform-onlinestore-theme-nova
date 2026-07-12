import { useEffect, useState, type ReactNode } from 'react'
import { SectionTree, useCart, useData, useSettings, useT, type ContentNode, type PageDoc } from '@tanqory/theme-kit'
import { apiBase } from '../lib/api-base'
import { CartDrawer } from '../overlays/CartDrawer'
import { SearchModal } from '../overlays/SearchModal'
import { AccountMenu } from '../overlays/AccountMenu'
import { MobileNavDrawer } from '../overlays/MobileNavDrawer'
import { openOverlay, closeOverlay } from '../components/useOverlayChannel'
import { CookieConsent } from '../components/CookieConsent'
import { PixelScripts } from '../components/PixelScripts'

/**
 * Templates are bundled into the layout so the SPA router can swap them in
 * without a network round-trip. `import.meta.glob(..., { eager: true })`
 * costs nothing extra at runtime — mount.tsx already pulls the same files;
 * we're just keeping a second reference here for the soft-route lookup.
 */
const TEMPLATES = import.meta.glob('../templates/*.json', { eager: true }) as Record<
  string,
  { default?: PageDoc }
>

/**
 * The store's public storefront URL, injected in local dev / preview via
 * VITE_TANQORY_STORE_URL (the CLI sets it). On the real storefront it's unset
 * (same-origin) so checkout/account/orders links are relative and the edge
 * router forwards them to the central microservices. In local dev there's no
 * edge router, so we redirect those links to the real store instead of hitting
 * a dead localhost path.
 */
const STORE_URL =
  (import.meta.env?.VITE_TANQORY_STORE_URL as string | undefined)?.replace(/\/+$/, '') || ''

/** Paths owned by the centralized checkout / account / orders microservices. */
function isCentralServicePath(p: string): boolean {
  return (
    p === '/checkout' ||
    p.startsWith('/checkout/') ||
    p === '/account' ||
    p.startsWith('/account/') ||
    p === '/orders' ||
    p.startsWith('/orders/')
  )
}

function lookupTemplate(name: string): ContentNode[] {
  for (const [key, mod] of Object.entries(TEMPLATES)) {
    if (key.endsWith(`/${name}.json`)) return mod.default?.sections ?? []
  }
  return []
}

/** Mirrors `resolveTemplate` in main.tsx — keep both in sync. */
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
  if (/^\/blogs\/[^/]+\/[^/]+$/.test(p)) return 'article'
  if (/^\/blogs\/[^/]+$/.test(p)) return 'blog'
  return '404'
}

/**
 * SPA router — intercepts internal `<a>` clicks, `history.pushState`s the
 * new URL, and triggers a React re-render so the body swaps templates
 * without a full page reload. Cuts perceived navigation time from
 * ~3-6s (cold-start HTML fetch + JS eval) to a few ms.
 *
 * Skips:
 *   - external origins
 *   - `target="_blank"` / `download` / right-click / cmd+click
 *   - links with `data-full-page-nav="true"` (escape hatch — e.g. checkout)
 *   - paths under `/checkout/`, `/account/`, `/orders/` — these are served
 *     by separate centralized microservices (studio-checkouts /
 *     studio-accounts) intercepted by the storefront router at the edge.
 *     SPA navigation would never reach those services because the theme
 *     SPA has no routes for them — it would just render the nova 404.
 *
 * Each section that consumes `window.location.pathname` (PageBody,
 * BlogPosts, ArticleBody, useUrlRedirect) reads it via `useEffect` keyed on
 * `pathname`, so they refetch when the route changes.
 */
function useSoftRoute(enabled: boolean): string {
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/',
  )

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    const navigate = (next: string) => {
      if (next !== window.location.pathname + window.location.search) {
        window.history.pushState({}, '', next)
      }
      setPathname(window.location.pathname)
      // Match a fresh page load — scroll to top unless the merchant is
      // jumping to an in-page anchor.
      if (!next.includes('#')) {
        window.scrollTo({ top: 0, behavior: 'auto' })
      }
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const target = e.target as HTMLElement | null
      const a = target?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a) return
      if (a.target && a.target !== '_self') return
      if (a.hasAttribute('download')) return
      if (a.dataset.fullPageNav === 'true') return
      let url: URL
      try {
        url = new URL(a.href, window.location.origin)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      // Hash-only nav stays a normal anchor jump.
      if (url.pathname === window.location.pathname && url.hash) return
      // Centralized checkout / account / orders microservices are intercepted
      // by the storefront router at the edge — they're NOT routes the theme
      // SPA owns. On the real storefront, skipping SPA nav forces a real HTTP
      // navigation the edge router forwards to studio-checkouts / studio-accounts.
      // In local dev / preview (STORE_URL set to a different origin) there's no
      // edge router here, so redirect to the real storefront domain instead of
      // a dead localhost path.
      if (isCentralServicePath(url.pathname)) {
        if (STORE_URL) {
          try {
            if (new URL(STORE_URL).origin !== window.location.origin) {
              e.preventDefault()
              window.location.href = STORE_URL + url.pathname + url.search
            }
          } catch {
            /* ignore a malformed STORE_URL and fall back to a normal nav */
          }
        }
        return
      }
      e.preventDefault()
      navigate(url.pathname + url.search + url.hash)
    }

    const onPop = () => setPathname(window.location.pathname)

    document.addEventListener('click', onClick)
    window.addEventListener('popstate', onPop)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('popstate', onPop)
    }
  }, [enabled])

  return pathname
}

/**
 * Resolve the user's preferred locale + country.
 *
 * Precedence: URL ?locale= / ?country= (set by the switcher form submission,
 * also shareable) → localStorage (sticky across visits) → SSG default from
 * settings.json. Runs once on mount to avoid SSR/CSR hydration mismatch.
 *
 * The setter persists to BOTH localStorage and the URL search params (replace
 * state, no reload) so deep-linking + back/forward keep working.
 */
const LOCALE_KEY = 'tq-locale'
const COUNTRY_KEY = 'tq-country'

function usePersistedChoice(
  paramName: string,
  storageKey: string,
  fallback: string,
  /**
   * When true, changing the value triggers a full page reload instead of an
   * in-place URL replace. Needed for `country` because the storefront's price
   * data is baked into the bundle at build/SSG time — only a fresh fetch
   * (which carries the new X-Tanqory-Country header) returns the right
   * currency. Locale stays in-place: it's a pure-UI swap.
   */
  reloadOnChange = false,
): [string, (next: string) => void] {
  const [value, setValue] = useState(fallback)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URLSearchParams(window.location.search).get(paramName)
    if (url) {
      setValue(url)
      try {
        window.localStorage.setItem(storageKey, url)
      } catch {
        /* private mode etc. */
      }
      return
    }
    try {
      const stored = window.localStorage.getItem(storageKey)
      if (stored) setValue(stored)
    } catch {
      /* private mode etc. */
    }
  }, [paramName, storageKey])
  const update = (next: string): void => {
    setValue(next)
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey, next)
    } catch {
      /* private mode etc. */
    }
    const url = new URL(window.location.href)
    url.searchParams.set(paramName, next)
    if (reloadOnChange) {
      // Full reload so the storefront's GraphQL bootstrap re-fires with the
      // new X-Tanqory-Country header → fresh Money fields in the new
      // currency. replaceState alone would leave stale prices on screen.
      window.location.href = url.toString()
      return
    }
    window.history.replaceState(null, '', url.toString())
  }
  return [value, update]
}

/**
 * Storefront menu shape (subset of GraphQL `Menu.items`).
 * Each item knows where it links and (optionally) the resource it points at.
 */
interface MenuLink {
  title: string
  url: string
}

/**
 * Checks `Query.urlRedirects` against the current pathname and, if it matches
 * a redirect rule, navigates to the target. Runs once at boot — keeps the
 * fetch off the SSG render path so it costs nothing if the merchant has no
 * redirects configured (resolver returns an empty connection, hook returns
 * synchronously after one round-trip).
 *
 * Why client-side: the storefront is statically served (`vite preview`), so
 * there's no router-level place to intercept the URL before render. A brief
 * flash on the matching path is acceptable for the migration use case
 * (renamed product / collection / page) — it beats a 404.
 */
/**
 * Editor preview cue — paints a selection outline on whichever section the
 * editor has highlighted, and a softer hover outline on whichever section
 * the visitor is pointing at. Only runs inside the `preview-*` iframe; the
 * public storefront never sees these affordances.
 *
 * The selection class is applied via DOM mutation (not React state) because
 * theme-kit's `SectionTree` owns the section wrappers and we don't want to
 * push selection state up through every section component. A
 * MutationObserver re-applies the class after PreviewBridge re-renders
 * (e.g. `tanqory-preview-update-section` swaps a section's settings).
 */
function usePreviewSelection(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    let currentId: string | null = null

    const paint = () => {
      document
        .querySelectorAll('.tq-preview-selected')
        .forEach((el) => el.classList.remove('tq-preview-selected'))
      if (!currentId) return
      const el = document.querySelector(`[data-tq-section-id="${CSS.escape(currentId)}"]`)
      if (el) el.classList.add('tq-preview-selected')
    }

    const onMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return
      if (e.data.type === 'tanqory-preview-select') {
        currentId = String(e.data.sectionId ?? '') || null
        paint()
      }
    }

    // Also self-select on click — instant feedback for the merchant before
    // the editor round-trips through the postMessage protocol.
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      const el = t?.closest?.('[data-tq-section-id]') as HTMLElement | null
      if (!el) return
      currentId = el.dataset.tqSectionId ?? null
      paint()
    }

    // Re-paint after PreviewBridge tree state changes — without this, an
    // edit that re-renders the section drops the highlight.
    const obs = new MutationObserver(() => paint())
    obs.observe(document.body, { childList: true, subtree: true })

    window.addEventListener('message', onMessage)
    document.addEventListener('click', onClick)
    document.body.classList.add('tq-preview')

    return () => {
      window.removeEventListener('message', onMessage)
      document.removeEventListener('click', onClick)
      document.body.classList.remove('tq-preview')
      obs.disconnect()
      document
        .querySelectorAll('.tq-preview-selected')
        .forEach((el) => el.classList.remove('tq-preview-selected'))
    }
  }, [enabled])
}

function useUrlRedirect(pathname?: string): void {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const env = import.meta.env as ImportMetaEnv & {
      VITE_TANQORY_BACKEND?: string
      VITE_TANQORY_STORE_ID?: string
      VITE_TANQORY_STOREFRONT_TOKEN?: string
    }
    if (!env.VITE_TANQORY_BACKEND || !env.VITE_TANQORY_STORE_ID) return
    const url = `${apiBase(env.VITE_TANQORY_BACKEND)}/api/v1/stores/${encodeURIComponent(
      env.VITE_TANQORY_STORE_ID,
    )}/graphql`
    const currentPath = pathname ?? window.location.pathname
    let cancelled = false
    fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(env.VITE_TANQORY_STOREFRONT_TOKEN
          ? { 'x-publishable-key': env.VITE_TANQORY_STOREFRONT_TOKEN }
          : {}),
      },
      body: JSON.stringify({
        // Server-side filter keeps the response small — we only care about
        // exact-path matches. The pageSize cap of 5 lets us tolerate `query`
        // false positives (substring match) without paying for a full list.
        query: `query R($q: String) {
          urlRedirects(first: 5, query: $q) {
            nodes { path target }
          }
        }`,
        variables: { q: currentPath },
      }),
    })
      .then((r) => r.json())
      .then((j: { data?: { urlRedirects?: { nodes: Array<{ path: string; target: string }> } } }) => {
        if (cancelled) return
        const match = j.data?.urlRedirects?.nodes.find((n) => n.path === currentPath)
        if (match) window.location.replace(match.target)
      })
      .catch(() => {
        /* a failed redirect lookup should never break the page */
      })
    return () => {
      cancelled = true
    }
  }, [pathname])
}

/**
 * Fetches the four menus this layout renders (header + 3 footer columns) in
 * a single GraphQL round-trip. Which Menu handle drives each slot is set in
 * the editor's Theme settings panel (`headerMenuHandle`, etc.) so merchants
 * can rename or re-wire navigations without touching theme code. Returns
 * `null` for any slot whose handle is blank, missing in the backend, or
 * empty — callers fall back to their hardcoded link list so the theme stays
 * usable on a brand-new store.
 *
 * Inlined here (rather than going through `theme-kit`) for the same reason
 * `PageBody` does: the runtime image bakes a copy of theme-kit and rebuilding
 * the image is a heavier operation than hot-PUTting a theme file.
 */
function useStorefrontMenus(handles: {
  header: string
  footerShop: string
  footerHelp: string
  footerCompany: string
}): {
  main: MenuLink[] | null
  footerShop: MenuLink[] | null
  footerHelp: MenuLink[] | null
  footerCompany: MenuLink[] | null
} {
  const [menus, setMenus] = useState<{
    main: MenuLink[] | null
    footerShop: MenuLink[] | null
    footerHelp: MenuLink[] | null
    footerCompany: MenuLink[] | null
  }>({ main: null, footerShop: null, footerHelp: null, footerCompany: null })

  // GraphQL aliases need to be stable strings, so we resolve handle changes
  // into the dep array — the effect re-fires whenever the merchant picks a
  // different handle in the editor.
  const headerHandle = handles.header
  const shopHandle = handles.footerShop
  const helpHandle = handles.footerHelp
  const companyHandle = handles.footerCompany

  useEffect(() => {
    const env = import.meta.env as ImportMetaEnv & {
      VITE_TANQORY_BACKEND?: string
      VITE_TANQORY_STORE_ID?: string
      VITE_TANQORY_STOREFRONT_TOKEN?: string
    }
    if (!env.VITE_TANQORY_BACKEND || !env.VITE_TANQORY_STORE_ID) return
    const url = `${apiBase(env.VITE_TANQORY_BACKEND)}/api/v1/stores/${encodeURIComponent(
      env.VITE_TANQORY_STORE_ID,
    )}/graphql`
    // Only request slots whose handle is set — an empty handle means "fall
    // back to hardcoded" and we don't want to spend an alias on it.
    const slots: Array<{ alias: string; handle: string }> = []
    if (headerHandle) slots.push({ alias: 'main', handle: headerHandle })
    if (shopHandle) slots.push({ alias: 'footerShop', handle: shopHandle })
    if (helpHandle) slots.push({ alias: 'footerHelp', handle: helpHandle })
    if (companyHandle) slots.push({ alias: 'footerCompany', handle: companyHandle })
    if (slots.length === 0) return

    const fieldList = slots
      .map((s, i) => `${s.alias}: menu(handle: $h${i}) { items { title url } }`)
      .join('\n          ')
    const argList = slots.map((_, i) => `$h${i}: String!`).join(', ')
    const variables = Object.fromEntries(slots.map((s, i) => [`h${i}`, s.handle]))

    let cancelled = false
    fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(env.VITE_TANQORY_STOREFRONT_TOKEN
          ? { 'x-publishable-key': env.VITE_TANQORY_STOREFRONT_TOKEN }
          : {}),
      },
      body: JSON.stringify({
        query: `query M(${argList}) {
          ${fieldList}
        }`,
        variables,
      }),
    })
      .then((r) => r.json())
      .then((j: { data?: Record<string, { items?: Array<{ title: string; url?: string | null }> } | null> }) => {
        if (cancelled) return
        const pluck = (key: string): MenuLink[] | null => {
          const m = j.data?.[key]
          if (!m?.items?.length) return null
          return m.items
            .filter((it): it is { title: string; url: string } => Boolean(it.url))
            .map((it) => ({ title: it.title, url: it.url }))
        }
        setMenus({
          main: pluck('main'),
          footerShop: pluck('footerShop'),
          footerHelp: pluck('footerHelp'),
          footerCompany: pluck('footerCompany'),
        })
      })
      .catch(() => {
        /* leave hardcoded fallback */
      })
    return () => {
      cancelled = true
    }
  }, [headerHandle, shopHandle, helpHandle, companyHandle])

  return menus
}

interface ShopLogo {
  url: string
  altText?: string | null
}
interface ShopPolicyLink {
  title: string
  url: string
}
export interface StorefrontShop {
  name?: string | null
  description?: string | null
  brand?: {
    logo?: ShopLogo | null
    slogan?: string | null
    shortDescription?: string | null
  } | null
  policies: ShopPolicyLink[]
  cookieBanner?: {
    enabled: boolean
    dataSharingTitle?: string | null
    dataSharingVisible?: boolean
    title?: string | null
    body?: string | null
    acceptLabel?: string | null
    declineLabel?: string | null
    manageLabel?: string | null
    position?: string | null
    colorTheme?: string | null
  } | null
}

/**
 * Self-fetch the store's identity, legal policies, and cookie-banner config.
 *
 * Mirrors `useStorefrontMenus` and follows the same reasoning as PageBody: the
 * theme-runtime image bakes its own (older) copy of `@tanqory/theme-kit`, so
 * relying on `data.shop` wouldn't reach prod until the runtime image is rebuilt.
 * Fetching directly keeps the wire-up to this one hot-PUT-able theme file. When
 * the baked theme-kit catches up this can be swapped for `useData().shop`.
 */
function useStorefrontShop(): StorefrontShop | null {
  const [shop, setShop] = useState<StorefrontShop | null>(null)

  useEffect(() => {
    const env = import.meta.env as ImportMetaEnv & {
      VITE_TANQORY_BACKEND?: string
      VITE_TANQORY_STORE_ID?: string
      VITE_TANQORY_STOREFRONT_TOKEN?: string
    }
    if (!env.VITE_TANQORY_BACKEND || !env.VITE_TANQORY_STORE_ID) return
    const url = `${apiBase(env.VITE_TANQORY_BACKEND)}/api/v1/stores/${encodeURIComponent(
      env.VITE_TANQORY_STORE_ID,
    )}/graphql`
    let cancelled = false
    fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(env.VITE_TANQORY_STOREFRONT_TOKEN
          ? { 'x-publishable-key': env.VITE_TANQORY_STOREFRONT_TOKEN }
          : {}),
      },
      body: JSON.stringify({
        query: `query Shop {
          shop {
            name
            description
            brand { logo { url altText } slogan shortDescription }
            shippingPolicy { title url }
            refundPolicy { title url }
            privacyPolicy { title url }
            termsOfService { title url }
            subscriptionPolicy { title url }
            cookieBanner {
              enabled dataSharingTitle dataSharingVisible
              title body acceptLabel declineLabel manageLabel position colorTheme
            }
          }
        }`,
      }),
    })
      .then((r) => r.json())
      .then(
        (j: {
          data?: {
            shop?: {
              name?: string | null
              description?: string | null
              brand?: StorefrontShop['brand']
              shippingPolicy?: ShopPolicyLink | null
              refundPolicy?: ShopPolicyLink | null
              privacyPolicy?: ShopPolicyLink | null
              termsOfService?: ShopPolicyLink | null
              subscriptionPolicy?: ShopPolicyLink | null
              cookieBanner?: StorefrontShop['cookieBanner']
            } | null
          }
        }) => {
          if (cancelled) return
          const s = j.data?.shop
          if (!s) return
          const policies = [
            s.shippingPolicy,
            s.refundPolicy,
            s.privacyPolicy,
            s.termsOfService,
            s.subscriptionPolicy,
          ]
            .filter((p): p is ShopPolicyLink => Boolean(p && p.url))
            .map((p) => ({ title: p.title, url: p.url }))
          setShop({
            name: s.name,
            description: s.description,
            brand: s.brand ?? null,
            policies,
            cookieBanner: s.cookieBanner ?? null,
          })
        },
      )
      .catch(() => {
        /* leave theme-default fallbacks in place */
      })
    return () => {
      cancelled = true
    }
  }, [])

  return shop
}

/** Layout frame (header/footer) wrapping every page's block tree. */
export default function Layout({ children }: { children: ReactNode }): JSX.Element {
  const settings = useSettings()
  const t = useT()
  const menus = useStorefrontMenus({
    header: (settings.headerMenuHandle as string) ?? '',
    footerShop: (settings.footerShopMenuHandle as string) ?? '',
    footerHelp: (settings.footerHelpMenuHandle as string) ?? '',
    footerCompany: (settings.footerCompanyMenuHandle as string) ?? '',
  })

  // SPA routing — when enabled, internal link clicks update React state
  // instead of triggering a full page load. Falls back to native nav when
  // off (or in SSG / no-JS).
  //
  // Disable in preview mode (the editor's iframe): the editor pushes live
  // section/setting updates via `tanqory-preview-update-section` into the
  // bridge's tree state, and the bridge re-renders its own `<SectionTree>`
  // as `children`. If softRoute is on, the layout would overwrite that
  // child render with its own template lookup and every edit would silently
  // get lost. Same logic for the click-to-navigate interceptor — clicking a
  // CTA in preview mode should select the section, not navigate away.
  const isPreview =
    typeof window !== 'undefined' &&
    (/^preview-/.test(window.location.hostname) ||
      new URLSearchParams(window.location.search).has('preview'))

  const enableSpa = !isPreview && settings.enableSpaNavigation !== false
  const softPathname = useSoftRoute(enableSpa)
  const softTree = enableSpa ? lookupTemplate(resolveTemplate(softPathname)) : null

  useUrlRedirect(softPathname)
  usePreviewSelection(isPreview)
  const data = useData()
  const { totalQuantity } = useCart()
  // Real store identity (Settings → General / Brand) wins over theme defaults;
  // theme settings are only the offline/mock fallback.
  const shop = useStorefrontShop()
  const shopName = shop?.name || (settings.shopName as string) || 'nova'
  const brandLogo = shop?.brand?.logo ?? null
  const brandBlurb =
    shop?.brand?.shortDescription ||
    shop?.brand?.slogan ||
    (settings.footerBlurb as string) ||
    'Modern essentials, designed for everyday rituals.'
  const year = new Date().getFullYear()

  // Legal footer links built from the store's real published policies
  // (Settings → Policies). Each resolves to `/policies/<handle>`.
  const policyLinks = shop?.policies ?? []

  // Languages stay theme-config until i18n lands — themes ship a working
  // picker, merchants tune labels in settings.json.
  const locales =
    (settings.locales as Array<{ code: string; label: string }>) ?? [
      { code: 'en', label: 'English' },
      { code: 'th', label: 'ไทย' },
      { code: 'ja', label: '日本語' },
      { code: 'zh', label: '中文' },
    ]
  const activeLocale = (settings.activeLocale as string) ?? 'en'

  // Countries come from the live `localization` query. Empty when the
  // merchant hasn't configured any active Markets yet — in that case we
  // suppress the country picker (no fake options) and the rest of the
  // storefront just uses the store's base currency.
  const liveCountries = data.localization?.availableCountries ?? []
  const countries = liveCountries.map((c) => ({
    code: c.isoCode,
    label: c.name,
    currency: c.currency.isoCode,
  }))
  const activeCountry = data.localization?.country.isoCode ?? null
  const showCountrySwitch = countries.length > 0
  const showLocaleSwitch = locales.length > 0
  const showSwitchers = showCountrySwitch || showLocaleSwitch

  // Behaviour toggles — merchant flips these in Theme settings to switch
  // each icon between "open overlay" (pro UX) and "navigate to page"
  // (progressive enhancement fallback).
  const enableSearchModal = settings.enableSearchModal !== false
  const enableCartDrawer = settings.enableCartDrawer !== false
  const enableAccountDropdown = settings.enableAccountDropdown !== false
  const enableMobileNavDrawer = settings.enableMobileNavDrawer !== false

  const navItems: Array<{ title: string; url: string }> =
    menus.main ??
    [
      { title: t('nav.shop') || 'Shop', url: '/collections/all' },
      { title: 'Collections', url: '/collections' },
      { title: 'About', url: '/pages/about' },
      { title: 'Journal', url: '/pages/journal' },
    ]

  return (
    <>
      <header className="site-header">
        <div className="container site-header__inner">
          {enableMobileNavDrawer && (
            <button
              type="button"
              className="site-header__hamburger"
              aria-label="Open menu"
              onClick={() => openOverlay('mobile-nav')}
            >
              <Icon name="menu" />
            </button>
          )}
          <a className="site-header__brand" href="/" aria-label={shopName}>
            {brandLogo?.url ? (
              <img
                className="site-header__logo"
                src={brandLogo.url}
                alt={brandLogo.altText || shopName}
              />
            ) : (
              shopName
            )}
          </a>
          <nav className="site-nav" aria-label="Primary">
            {navItems.map((item) => (
              <a key={`${item.url}-${item.title}`} href={item.url}>
                {item.title}
              </a>
            ))}
          </nav>
          <div className="site-header__actions">
            {showSwitchers && (
              <LocaleSwitch
                locales={showLocaleSwitch ? locales : []}
                activeLocale={activeLocale}
                countries={showCountrySwitch ? countries : []}
                activeCountry={activeCountry ?? countries[0]?.code ?? ''}
                compact
              />
            )}
            {enableSearchModal ? (
              <button
                type="button"
                className="site-header__icon"
                aria-label="Search"
                onClick={() => openOverlay('search')}
              >
                <Icon name="search" />
              </button>
            ) : (
              <a href="/search" className="site-header__icon" aria-label="Search">
                <Icon name="search" />
              </a>
            )}
            {enableAccountDropdown ? (
              <div className="site-header__account-wrap">
                <button
                  type="button"
                  className="site-header__icon"
                  aria-label="Account"
                  aria-haspopup="dialog"
                  data-overlay-trigger="account"
                  onClick={() => {
                    // Toggle: clicking the trigger while open should close.
                    const isOpen = document
                      .querySelector('.account-menu')
                      ?.classList.contains('account-menu--open')
                    if (isOpen) closeOverlay()
                    else openOverlay('account')
                  }}
                >
                  <Icon name="user" />
                </button>
                <AccountMenu
                  loggedIn={Boolean(settings.accountLoggedIn)}
                  heading={settings.accountHeading as string | undefined}
                  subtext={settings.accountSubtext as string | undefined}
                  primaryLabel={settings.accountPrimaryLabel as string | undefined}
                  primaryHref={settings.accountPrimaryHref as string | undefined}
                  secondaryLabel={settings.accountSecondaryLabel as string | undefined}
                  secondaryHref={settings.accountSecondaryHref as string | undefined}
                  links={settings.accountExtraLinks as string | undefined}
                />
              </div>
            ) : (
              <a href="/account" className="site-header__icon" aria-label="Account">
                <Icon name="user" />
              </a>
            )}
            {enableCartDrawer ? (
              <button
                type="button"
                className="site-header__icon site-header__cart"
                aria-label={`Cart${totalQuantity > 0 ? ` (${totalQuantity})` : ''}`}
                onClick={() => openOverlay('cart')}
              >
                <Icon name="bag" />
                {totalQuantity > 0 && <span className="site-header__cart-count">{totalQuantity}</span>}
              </button>
            ) : (
              <a
                href="/cart"
                className="site-header__icon site-header__cart"
                aria-label={`Cart${totalQuantity > 0 ? ` (${totalQuantity})` : ''}`}
              >
                <Icon name="bag" />
                {totalQuantity > 0 && <span className="site-header__cart-count">{totalQuantity}</span>}
              </a>
            )}
          </div>
        </div>
      </header>

      <main>{softTree ? <SectionTree tree={softTree} /> : children}</main>

      <footer className="site-footer">
        <div className="container">
          <div className="site-footer__grid">
            <div className="site-footer__brand">
              <h2>{shopName}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '36ch' }}>
                {brandBlurb}
              </p>
            </div>
            <div className="site-footer__col">
              <h6>Shop</h6>
              <ul>
                {(menus.footerShop ?? [
                  { title: 'All products', url: '/collections/all' },
                  { title: 'New arrivals', url: '/collections/new' },
                  { title: 'Sale', url: '/collections/sale' },
                  { title: 'Gift cards', url: '/pages/gift-cards' },
                ]).map((item) => (
                  <li key={`${item.url}-${item.title}`}>
                    <a href={item.url}>{item.title}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="site-footer__col">
              <h6>Help</h6>
              <ul>
                {(
                  menus.footerHelp ??
                  (policyLinks.length > 0
                    ? [{ title: t('nav.contact') || 'Contact', url: '/pages/contact' }, ...policyLinks]
                    : [
                        { title: 'Contact', url: '/pages/contact' },
                        { title: 'Shipping', url: '/pages/shipping' },
                        { title: 'Returns', url: '/pages/returns' },
                        { title: 'FAQ', url: '/pages/faq' },
                      ])
                ).map((item) => (
                  <li key={`${item.url}-${item.title}`}>
                    <a href={item.url}>{item.title}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="site-footer__col">
              <h6>Company</h6>
              <ul>
                {(menus.footerCompany ?? [
                  { title: 'About', url: '/pages/about' },
                  { title: 'Journal', url: '/pages/journal' },
                  { title: 'Sustainability', url: '/pages/sustainability' },
                  { title: 'Press', url: '/pages/press' },
                ]).map((item) => (
                  <li key={`${item.url}-${item.title}`}>
                    <a href={item.url}>{item.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {showSwitchers && (
            <div className="site-footer__market">
              <LocaleSwitch
                locales={showLocaleSwitch ? locales : []}
                activeLocale={activeLocale}
                countries={showCountrySwitch ? countries : []}
                activeCountry={activeCountry ?? countries[0]?.code ?? ''}
              />
            </div>
          )}

          <div className="site-footer__bottom">
            <small>© {year} {shopName}. {t('footer.rights')}</small>
            <small>Made with Tanqory</small>
          </div>
        </div>
      </footer>

      {/* Overlay surfaces — render once per shell. Each is a no-op when its
       *  matching overlay isn't the active one (driven by useOverlayChannel),
       *  so mounting them all here is cheap. */}
      {enableSearchModal && (
        <SearchModal
          placeholder={(settings.searchPlaceholder as string) || 'Search products…'}
          ctaLabel={(settings.searchCtaLabel as string) || 'See all results →'}
          maxWidth={(settings.searchModalWidth as string) || '640px'}
          debounceMs={Number(settings.searchDebounceMs ?? 250)}
          maxResults={Number(settings.searchMaxResults ?? 6)}
        />
      )}
      {enableCartDrawer && (
        <CartDrawer
          width={(settings.cartDrawerWidth as string) || '420px'}
          emptyHeading={(settings.cartEmptyHeading as string) || 'Your cart is empty'}
          emptySubtext={
            (settings.cartEmptySubtext as string) || 'Add a few things to get started.'
          }
          checkoutLabel={(settings.cartCheckoutLabel as string) || 'Checkout'}
          viewCartLabel={(settings.cartViewLabel as string) || 'View full cart'}
        />
      )}
      {enableMobileNavDrawer && (
        <MobileNavDrawer
          width={(settings.mobileNavWidth as string) || '320px'}
          heading={(settings.mobileNavHeading as string) || 'Menu'}
          links={menus.main}
        />
      )}

      {/* Store-driven shell surfaces: cookie-consent banner (Settings → Customer
       *  privacy) and connected tracking pixels (Settings → Customer events). */}
      <CookieConsent banner={shop?.cookieBanner} />
      <PixelScripts bannerEnabled={shop?.cookieBanner?.enabled} />
    </>
  )
}

/* ============================================================================
 * Locale + market switcher
 *
 * Compact (header) — single icon button that opens a small grouped panel.
 * Full (footer)   — two side-by-side dropdowns with labels.
 *
 * Both wrap native <form>/<select> so they work without client JS (Shopify
 * convention). The storefront is served statically by `vite preview` — there
 * is no API server inside the runtime pod — so the forms GET back to `/` with
 * the selected value as a query param (e.g. `/?locale=th`, `/?country=TH`).
 * Clients with JS can intercept onChange to persist + apply without reload;
 * no-JS submitters get a clean page reload instead of a 404 on /api/locale.
 * Once the storefront grows server-side locale persistence (cookie + URL
 * prefix), swap the action back to POST /api/locale | /api/country.
 * ============================================================================ */

interface LocaleSwitchProps {
  locales: Array<{ code: string; label: string }>
  activeLocale: string
  countries: Array<{ code: string; label: string; currency: string }>
  activeCountry: string
  compact?: boolean
}

function LocaleSwitch({
  locales,
  activeLocale,
  countries,
  activeCountry,
  compact,
}: LocaleSwitchProps): JSX.Element {
  const [locale, setLocale] = usePersistedChoice('locale', LOCALE_KEY, activeLocale)
  // Country change reloads — bound prices are baked at fetch time, not derived.
  const [country, setCountry] = usePersistedChoice('country', COUNTRY_KEY, activeCountry, true)
  const activeCountryRow = countries.find((c) => c.code === country) ?? countries[0]

  if (compact) {
    return (
      <details className="locale-switch locale-switch--compact">
        <summary className="site-header__icon" aria-label="Region and language">
          <Icon name="globe" />
        </summary>
        <div className="locale-switch__panel" role="dialog" aria-label="Region and language">
          {locales.length > 0 && (
            <div className="locale-switch__group">
              <span className="locale-switch__label">Language</span>
              <select
                className="locale-switch__select"
                value={locale}
                onChange={(e) => setLocale(e.currentTarget.value)}
                aria-label="Language"
              >
                {locales.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {countries.length > 0 && (
            <div className="locale-switch__group">
              <span className="locale-switch__label">Country / region</span>
              <select
                className="locale-switch__select"
                value={country}
                onChange={(e) => setCountry(e.currentTarget.value)}
                aria-label="Country / region"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label} · {c.currency}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </details>
    )
  }

  return (
    <div className="locale-switch locale-switch--full">
      {countries.length > 0 && (
        <div className="locale-switch__group">
          <label className="locale-switch__label" htmlFor="market-country">
            Country / region
          </label>
          <select
            id="market-country"
            className="locale-switch__select"
            value={country}
            onChange={(e) => setCountry(e.currentTarget.value)}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label} ({c.currency})
              </option>
            ))}
          </select>
        </div>
      )}
      {locales.length > 0 && (
        <div className="locale-switch__group">
          <label className="locale-switch__label" htmlFor="market-locale">
            Language
          </label>
          <select
            id="market-locale"
            className="locale-switch__select"
            value={locale}
            onChange={(e) => setLocale(e.currentTarget.value)}
          >
            {locales.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {activeCountryRow && (
        <p className="locale-switch__hint">
          Shipping to <strong>{activeCountryRow.label}</strong>. Prices in{' '}
          <strong>{activeCountryRow.currency}</strong>.
        </p>
      )}
    </div>
  )
}

/* Tiny inline SVG icons — keep the bundle from depending on an icon lib. */
function Icon({ name }: { name: 'search' | 'user' | 'bag' | 'globe' | 'menu' }): JSX.Element {
  const props = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (name === 'search') {
    return (
      <svg {...props}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    )
  }
  if (name === 'user') {
    return (
      <svg {...props}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.5 3.5-8 8-8s8 3.5 8 8" />
      </svg>
    )
  }
  if (name === 'globe') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    )
  }
  if (name === 'menu') {
    return (
      <svg {...props}>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    )
  }
  return (
    <svg {...props}>
      <path d="M6 7h12l-1 13H7L6 7Z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  )
}
