import { Children, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  collectBoundIdentifiers,
  DynamicSourceProvider,
  SectionTree,
  useCart,
  useData,
  useSettings,
  useT,
  type ContentNode,
  type PageDoc,
  type ResourceContextValue,
} from '@tanqory/theme-kit'
import { apiBase } from '../lib/api-base'
import { CartDrawer } from '../overlays/CartDrawer'
import { SearchModal } from '../overlays/SearchModal'
import { AccountMenu } from '../overlays/AccountMenu'
import { MobileNavDrawer } from '../overlays/MobileNavDrawer'
import { openOverlay, closeOverlay } from '../components/useOverlayChannel'
import { CookieConsent } from '../components/CookieConsent'
import { TrackingPixels } from '../components/TrackingPixels'

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
  // Keep in lockstep with main.tsx's resolveTemplate — this copy drives SPA
  // soft-routing; a route missing HERE renders 404 even when the entry maps it.
  if (/^\/policies\/[^/]+$/.test(p)) return 'policy'
  if (p === '/account' || /^\/account\/[^/]+/.test(p)) return 'account'
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
      // SPA owns. Skipping SPA nav forces a real HTTP navigation that the
      // router can intercept and forward to studio-checkouts / studio-accounts.
      if (
        url.pathname === '/checkout' ||
        url.pathname.startsWith('/checkout/') ||
        url.pathname === '/account' ||
        url.pathname.startsWith('/account/') ||
        url.pathname === '/orders' ||
        url.pathname.startsWith('/orders/')
      ) {
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
   * in-place URL replace. Needed for `country` (prices are baked at fetch time,
   * so only a fresh fetch with the new X-Tanqory-Country header shows the right
   * currency) AND for `locale` (the UI-string map is selected at boot from
   * ?locale=, and the SSG bakes the default locale — a reload re-selects the
   * chosen locale's strings).
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
  const prevHandlesRef = useRef({ header: '', shop: '', help: '', company: '' })

  // GraphQL aliases need to be stable strings, so we resolve handle changes
  // into the dep array — the effect re-fires whenever the merchant picks a
  // different handle in the editor.
  const headerHandle = handles.header
  const shopHandle = handles.footerShop
  const helpHandle = handles.footerHelp
  const companyHandle = handles.footerCompany

  // Seed every slot from the data source's prefetched/mock menus (`data.menu`
  // sync) — this works in BOTH mock preview and live (no network, no env gate),
  // so the header/footer render REAL menu data instead of the hardcoded fallback
  // even in the editor. The GraphQL effect below still upgrades a live store
  // with on-demand menus; the hardcoded list is only the last resort.
  const data = useData()
  useEffect(() => {
    const toLinks = (handle: string): MenuLink[] | null => {
      const m = handle ? data.menu?.(handle) : null
      if (!m?.items?.length) return null
      const links = m.items
        .filter((it) => Boolean(it.url))
        .map((it) => ({ title: it.title, url: it.url as string }))
      return links.length ? links : null
    }
    // When a handle CHANGES (merchant picks a different menu in the editor)
    // RE-RESOLVE that slot fresh — otherwise `prev ?? …` would keep the old
    // menu and the picker would appear to do nothing. When the handle is
    // unchanged (some other re-render) keep the existing value so a live
    // GraphQL-fetched menu isn't clobbered by the sync seed.
    const ph = prevHandlesRef.current
    setMenus((prev) => ({
      main: headerHandle !== ph.header ? toLinks(headerHandle) : prev.main ?? toLinks(headerHandle),
      footerShop: shopHandle !== ph.shop ? toLinks(shopHandle) : prev.footerShop ?? toLinks(shopHandle),
      footerHelp: helpHandle !== ph.help ? toLinks(helpHandle) : prev.footerHelp ?? toLinks(helpHandle),
      footerCompany:
        companyHandle !== ph.company ? toLinks(companyHandle) : prev.footerCompany ?? toLinks(companyHandle),
    }))
    prevHandlesRef.current = { header: headerHandle, shop: shopHandle, help: helpHandle, company: companyHandle }
  }, [data, headerHandle, shopHandle, helpHandle, companyHandle])

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

/** Layout frame (header/footer) wrapping every page's block tree. */
/**
 * Shared header/footer chrome state — derived once, consumed by SiteHeader,
 * SiteFooter, and the Layout's global overlays. Header/footer are EDITABLE
 * SECTIONS now (sections/Header.tsx, Footer.tsx) so they appear in the editor's
 * section tree; the layout only renders the page body + the global overlays.
 */
function useChrome(opts?: Record<string, unknown>) {
  const settings = useSettings()
  const t = useT()
  // A section setting (Header/Footer section attributes) OVERRIDES the global
  // Theme setting; falling back to the global keeps brand-new templates working.
  const a = opts ?? {}
  const headerMenu = (a.menu as string) || (settings.headerMenuHandle as string) || ''
  const footerShopMenu = (a.shopMenu as string) || (settings.footerShopMenuHandle as string) || ''
  const footerHelpMenu = (a.helpMenu as string) || (settings.footerHelpMenuHandle as string) || ''
  const footerCompanyMenu = (a.companyMenu as string) || (settings.footerCompanyMenuHandle as string) || ''
  const menus = useStorefrontMenus({
    header: headerMenu,
    footerShop: footerShopMenu,
    footerHelp: footerHelpMenu,
    footerCompany: footerCompanyMenu,
  })
  const data = useData()
  const { totalQuantity } = useCart()
  const shopName =
    ((a.logo as string) || (settings.shopName as string) || '').trim() ||
    data.shop?.name?.trim() ||
    'Your store'
  // Settings → Brand. Only used when the merchant hasn't overridden the brand
  // with theme text (`a.logo` / settings.shopName) — an explicit theme choice
  // still wins. Until now a merchant could upload a logo and the storefront
  // never showed it: theme-kit didn't even request the field.
  const brandLogo =
    !((a.logo as string) || (settings.shopName as string) || '').trim() && data.shop?.brand?.logo
      ? data.shop.brand.logo
      : null
  // Brand colours as CSS custom properties on the shell, so any section that
  // uses var(--color-brand) follows Settings → Brand without new plumbing.
  const brandColors = data.shop?.brand?.colors?.primary?.[0]
  const brandVars: Record<string, string> = {
    ...(brandColors?.background ? { '--color-brand': brandColors.background } : {}),
    ...(brandColors?.foreground ? { '--color-brand-contrast': brandColors.foreground } : {}),
  }
  const year = new Date().getFullYear()
  const locales = (data.localization?.availableLanguages ?? []).map((l) => ({
    code: l.isoCode,
    label: l.name,
  }))
  const activeLocale = data.localization?.language?.isoCode ?? locales[0]?.code ?? 'en'
  const liveCountries = data.localization?.availableCountries ?? []
  const countries = liveCountries.map((c) => ({
    code: c.isoCode,
    label: c.name,
    currency: c.currency.isoCode,
  }))
  const activeCountry = data.localization?.country.isoCode ?? null
  const showCountrySwitch = countries.length > 0
  const showLocaleSwitch = locales.length > 0
  const showSwitchers = a.showLocale === false ? false : showCountrySwitch || showLocaleSwitch
  const footerTagline =
    (a.tagline as string) ||
    (data.shop?.description as string | undefined) ||
    (settings.footerTagline as string | undefined) ||
    ''
  const footerColumns = [
    { handle: footerShopMenu, links: menus.footerShop },
    { handle: footerHelpMenu, links: menus.footerHelp },
    { handle: footerCompanyMenu, links: menus.footerCompany },
  ]
    .map((c) => ({ title: (c.handle && data.menu?.(c.handle)?.title) || '', links: c.links ?? [] }))
    .filter((c) => c.links.length > 0)
  const flag = (k: string, g: string) => (a[k] !== undefined ? a[k] !== false : settings[g] !== false)
  const enableSearchModal = flag('showSearch', 'enableSearchModal')
  const enableCartDrawer = flag('showCart', 'enableCartDrawer')
  const enableAccountDropdown = flag('showAccount', 'enableAccountDropdown')
  const enableMobileNavDrawer = settings.enableMobileNavDrawer !== false
  // Brand colours ride along on the chrome style that already exists, so
  // Settings → Brand reaches the header without a second mechanism. Section
  // attributes (a.bg/a.fg) still win — an explicit theme choice beats the
  // brand default.
  const chromeStyle =
    a.bg || a.fg || Object.keys(brandVars).length
      ? ({
          ...brandVars,
          ...(a.bg ? { background: a.bg as string } : {}),
          ...(a.fg ? { color: a.fg as string } : {}),
        } as React.CSSProperties)
      : undefined
  const showPoweredBy = a.showPoweredBy !== undefined ? a.showPoweredBy !== false : settings.showPoweredBy !== false
  const poweredByLabel = (a.poweredByLabel as string) || (settings.poweredByLabel as string) || 'Made with Tanqory'
  const navItems: Array<{ title: string; url: string }> =
    menus.main ?? [
      { title: t('nav.shop') || 'Shop', url: '/collections/all' },
      { title: 'Collections', url: '/collections' },
      { title: 'About', url: '/pages/about' },
      { title: 'Journal', url: '/pages/journal' },
    ]
  return {
    settings, t, menus, data, totalQuantity, shopName, year, brandLogo, brandVars,
    locales, activeLocale, countries, activeCountry,
    showCountrySwitch, showLocaleSwitch, showSwitchers,
    footerTagline, footerColumns, chromeStyle, showPoweredBy, poweredByLabel,
    enableSearchModal, enableCartDrawer, enableAccountDropdown, enableMobileNavDrawer,
    navItems,
  }
}

/** Site header — rendered by sections/Header.tsx (an editable section). */
export function SiteHeader({ attributes }: { attributes?: Record<string, unknown> } = {}): JSX.Element {
  const {
    enableMobileNavDrawer, shopName, navItems, showSwitchers, locales,
    showLocaleSwitch, activeLocale, countries, showCountrySwitch, activeCountry,
    enableSearchModal, enableAccountDropdown, settings, totalQuantity, enableCartDrawer, chromeStyle,
    brandLogo,
  } = useChrome(attributes)
  return (
      <header className="site-header" style={chromeStyle}>
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
          <a className="site-header__brand" href="/">
            {brandLogo ? (
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
  )
}

/** Site footer — rendered by sections/Footer.tsx (an editable section). */
export function SiteFooter({
  attributes,
  children,
}: { attributes?: Record<string, unknown>; children?: ReactNode } = {}): JSX.Element {
  const {
    shopName, footerTagline, footerColumns, showSwitchers, locales,
    showLocaleSwitch, activeLocale, countries, showCountrySwitch, activeCountry,
    year, t, chromeStyle, showPoweredBy, poweredByLabel,
  } = useChrome(attributes)
  // Block-composed footer (Shopify Horizon-style): when the section has blocks
  // (Brand / Menu / Text), render them in the grid. With no blocks, fall back
  // to the data-driven default (brand + the three menu columns).
  const hasBlocks = Children.count(children) > 0
  return (
      <footer className="site-footer" style={chromeStyle}>
        <div className="container">
          <div className="site-footer__grid">
            {hasBlocks ? children : (
              <>
                <div className="site-footer__brand">
                  <h2>{shopName}</h2>
                  {footerTagline && (
                    <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '36ch' }}>{footerTagline}</p>
                  )}
                </div>
                {footerColumns.map((col, i) => (
                  <div className="site-footer__col" key={i}>
                    {col.title && <h6>{col.title}</h6>}
                    <ul>
                      {col.links.map((item) => (
                        <li key={`${item.url}-${item.title}`}>
                          <a href={item.url}>{item.title}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            )}
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
            {showPoweredBy && (
              <small>{poweredByLabel}</small>
            )}
          </div>
        </div>
      </footer>
  )
}

export default function Layout({ children }: { children: ReactNode }): JSX.Element {
  const { settings, menus, enableSearchModal, enableCartDrawer, enableMobileNavDrawer } = useChrome()

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

  // Resource context for dynamic sources — bind any block to `product.*` /
  // `collection.*` / `shop.*`. We collect the bound metafield identifiers from
  // the current page's content (collectBoundIdentifiers) and fetch exactly
  // those from the live storefront (`metafields(identifiers)`), then expose the
  // resolved resources. Shop bindings work on every page; product/collection
  // only on their own templates.
  const data = useData()
  const currentPath =
    (enableSpa ? softPathname : null) ??
    (typeof window !== 'undefined' ? window.location.pathname : '/')
  const pageTree = (softTree ?? lookupTemplate(resolveTemplate(currentPath)) ?? []) as ContentNode[]
  const boundIds = useMemo(() => collectBoundIdentifiers(pageTree), [pageTree])
  const [resourceValue, setResourceValue] = useState<ResourceContextValue>({})
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const next: ResourceContextValue = {}
      if (boundIds.shop.length && data.fetchShopMetafields && data.shop) {
        const mf = await data.fetchShopMetafields(boundIds.shop)
        next.shop = { ...data.shop, metafields: mf }
      }
      const productHandle = currentPath.match(/\/products\/([^/?#]+)/)?.[1]
      if (productHandle) {
        next.product = data.fetchProduct
          ? await data.fetchProduct(productHandle, { metafields: boundIds.product })
          : data.productByHandle?.(productHandle) ?? null
      }
      const collectionHandle = currentPath.match(/\/collections\/([^/?#]+)/)?.[1]
      if (collectionHandle) {
        const base = data.collectionByHandle?.(collectionHandle) ?? null
        const cmf =
          boundIds.collection.length && data.fetchCollectionMetafields
            ? await data.fetchCollectionMetafields(collectionHandle, boundIds.collection)
            : {}
        next.collection = base ? { ...base, metafields: cmf } : null
      }
      if (!cancelled) setResourceValue(next)
    })()
    return () => {
      cancelled = true
    }
  }, [data, currentPath, boundIds])

  return (
    <DynamicSourceProvider value={resourceValue}>
      <main>{softTree ? <SectionTree tree={softTree} /> : children}</main>

      <CookieConsent />
      <TrackingPixels />

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
    </DynamicSourceProvider>
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
  // Locale change reloads too: the theme's UI-string map is chosen at boot from
  // ?locale= (main.tsx resolveLocale), and the SSG bakes the default locale, so
  // an in-place swap can't re-render translated chrome — a reload re-selects the
  // right locale map (and refetches, ready for translated CONTENT in Phase 2).
  const [locale, setLocale] = usePersistedChoice('locale', LOCALE_KEY, activeLocale, true)
  // Country change reloads — bound prices are baked at fetch time, not derived.
  const [country, setCountry] = usePersistedChoice('country', COUNTRY_KEY, activeCountry, true)
  const activeCountryRow = countries.find((c) => c.code === country) ?? countries[0]
  // Chrome labels are locale strings (editable via locales/<lang>.json) — never
  // hardcoded English in the markup.
  const t = useT()
  const label = { language: t('footer.language') || 'Language', region: t('footer.region') || 'Country / region' }

  if (compact) {
    return (
      <details className="locale-switch locale-switch--compact">
        <summary className="site-header__icon" aria-label="Region and language">
          <Icon name="globe" />
        </summary>
        <div className="locale-switch__panel" role="dialog" aria-label="Region and language">
          {locales.length > 0 && (
            <div className="locale-switch__group">
              <span className="locale-switch__label">{label.language}</span>
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
              <span className="locale-switch__label">{label.region}</span>
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
            {label.region}
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
            {label.language}
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
          {t('footer.shippingTo') || 'Shipping to'} <strong>{activeCountryRow.label}</strong>.{' '}
          {t('footer.pricesIn') || 'Prices in'} <strong>{activeCountryRow.currency}</strong>.
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
