import { Children, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  collectBoundIdentifiers,
  DynamicSourceProvider,
  SectionTree,
  groupsFromGlob,
  resolvePageSections,
  useCart,
  useData,
  useT,
  type ContentNode,
  type PageDoc,
  type ResourceContextValue,
} from '@tanqory/theme-kit'
import { applyHead, computeHead } from '../lib/head'
import { emitRoute } from '../lib/route-analytics'
import { resolvePageTemplate } from '../lib/routes'
import { isEditorPreview } from '../lib/runtime'
import { ToastHost } from '../components/Overlays'
import { useMenu } from '../components/use-menu'
import { CartDrawer } from '../overlays/CartDrawer'
import { SearchModal } from '../overlays/SearchModal'
import { AccountMenu } from '../overlays/AccountMenu'
import { MobileNavDrawer } from '../overlays/MobileNavDrawer'
import { openOverlay, closeOverlay } from '../components/useOverlayChannel'
import { CookieConsent } from '../components/CookieConsent'
import { TrackingPixels } from '../components/TrackingPixels'
import { Select } from '../components/Select'
import { ThemeSettingsProvider, useThemeSettings } from '../components/ThemeSettings'
import { resolveLogo, type BrandFallback } from '../lib/theme-settings'
import { localizedCopy } from '../lib/theme-locale'
import { fallbackNav } from '../lib/fallback-nav'

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
/** The shared header/footer groups the templates bind (see `groups/`). */
const GROUPS = groupsFromGlob(import.meta.glob('../groups/*.json', { eager: true }))

/** Same keys, same values by identity — enough to tell "nothing was resolved" apart. */
function sameResourceContext(a: ResourceContextValue, b: ResourceContextValue): boolean {
  const ka = Object.keys(a) as Array<keyof ResourceContextValue>
  const kb = Object.keys(b) as Array<keyof ResourceContextValue>
  if (ka.length !== kb.length) return false
  return ka.every((k) => a[k] === b[k])
}

/** True when this theme ships `templates/<name>.json`. */
function templateExists(name: string): boolean {
  return Object.keys(TEMPLATES).some((k) => k.endsWith(`/${name}.json`))
}

/**
 * The section tree for a template, or null when the theme ships no such
 * template file.
 *
 * Returning `null` rather than `[]` is load-bearing: the caller renders
 * `softTree ? <SectionTree/> : children`, and `[]` is truthy — so an
 * unconditional array meant `children` was NEVER rendered while SPA routing was
 * on (the default), silently discarding the suffix-aware template the entry had
 * already mounted.
 */
function lookupTemplate(name: string): ContentNode[] | null {
  for (const [key, mod] of Object.entries(TEMPLATES)) {
    // Through the kit's resolver, so a soft navigation renders the same shared
    // header the entry mounted with — not the template's raw, header-less body.
    if (key.endsWith(`/${name}.json`)) return resolvePageSections(mod.default, GROUPS)
  }
  return null
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
 *
 * The state holds pathname + SEARCH. Tracking the pathname alone meant a
 * query-only navigation never re-rendered: going from `/search?q=shirt` to
 * `/search?q=hat` pushed the new URL and left the previous query's results on
 * screen, because the value every section keys off did not change.
 */
function useSoftRoute(enabled: boolean): string {
  const here = (): string =>
    typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
  const [pathname, setPathname] = useState<string>(here)

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    const navigate = (next: string) => {
      if (next !== window.location.pathname + window.location.search) {
        window.history.pushState({}, '', next)
      }
      setPathname(window.location.pathname + window.location.search)
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

    const onPop = () => setPathname(window.location.pathname + window.location.search)

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
  const { graphql } = useData()
  useEffect(() => {
    if (typeof window === 'undefined' || !graphql) return
    const currentPath = pathname ?? window.location.pathname
    let cancelled = false
    // Server-side filter keeps the response small — only exact-path matches
    // matter. The cap of 5 tolerates `query` substring false positives without
    // paying for a full list.
    void graphql<{ urlRedirects?: { nodes: Array<{ path: string; target: string }> } }>(
      `query R($q: String) {
          urlRedirects(first: 5, query: $q) {
            nodes { path target }
          }
        }`,
      { q: currentPath },
    )
      .then((res) => {
        if (cancelled) return
        const match = res?.urlRedirects?.nodes.find((n) => n.path === currentPath)
        if (match) window.location.replace(match.target)
      })
      .catch(() => {
        /* a failed redirect lookup should never break the page */
      })
    return () => {
      cancelled = true
    }
  }, [pathname, graphql])
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
/**
 * De-duplicate the menu query across hook instances.
 *
 * `useChrome` runs three times per page — once in `Layout` for the overlays,
 * once in `SiteHeader`, once in `SiteFooter` — and each instance owned its own
 * copy of this effect, so the SAME menu query went out three times on every
 * page despite the hook's "derived once" comment. Keyed by query + variables,
 * with the in-flight promise shared and then released, so a later navigation
 * still refetches.
 */
type MenuResponse = Record<string, { items?: Array<{ title: string; url?: string | null }> } | null> | null
const menusInFlight = new Map<string, Promise<MenuResponse>>()

function menuRequest(
  graphql: (q: string, v: Record<string, string>) => Promise<MenuResponse>,
  query: string,
  variables: Record<string, string>,
): Promise<MenuResponse> {
  const key = `${query}|${JSON.stringify(variables)}`
  const existing = menusInFlight.get(key)
  if (existing) return existing
  const p = graphql(query, variables).finally(() => {
    menusInFlight.delete(key)
  })
  menusInFlight.set(key, p)
  return p
}

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
  const { graphql } = data
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
    if (!graphql) return
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
    void menuRequest(graphql, `query M(${argList}) {
          ${fieldList}
        }`, variables)
      .then((res: Record<string, { items?: Array<{ title: string; url?: string | null }> } | null> | null) => {
        if (cancelled) return
        const pluck = (key: string): MenuLink[] | null => {
          const m = res?.[key]
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
  }, [headerHandle, shopHandle, helpHandle, companyHandle, graphql])

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
  // Effective theme settings — the built values, plus the Theme panel's unsaved
  // edits while inside the editor preview (components/ThemeSettings.tsx).
  const settings = useThemeSettings()
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
  // Text settings are read as text only: a non-string (a malformed settings
  // file) must not reach `.trim()` and take the whole layout down.
  const text = (v: unknown): string => (typeof v === 'string' ? v : '')
  const shopName =
    (text(a.logo) || text(settings.shopName)).trim() ||
    data.shop?.name?.trim() ||
    'Your store'
  // Header logo image — Theme settings logo, else the Settings → Brand logo.
  // With neither, the header shows `shopName` as text. Text never hides an
  // image: the shop name / Header "Logo text" is what shows when there is no
  // logo to show.
  const logo = resolveLogo(settings, data.shop?.brand as BrandFallback | null | undefined)
  // Brand colours no longer ride on the header/footer element: the layout's
  // ThemeSettingsProvider sets --color-brand (theme setting, else Settings →
  // Brand) on the root element, which the chrome inherits like everything else.
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
  // Section attributes (a.bg/a.fg) colour this header/footer only — an
  // explicit section choice beats the theme-wide colours it inherits.
  const chromeStyle =
    a.bg || a.fg
      ? ({
          ...(a.bg ? { background: a.bg as string } : {}),
          ...(a.fg ? { color: a.fg as string } : {}),
        } as React.CSSProperties)
      : undefined
  const showPoweredBy = a.showPoweredBy !== undefined ? a.showPoweredBy !== false : settings.showPoweredBy !== false
  const poweredByLabel = localizedCopy(
    (a.poweredByLabel as string) || (settings.poweredByLabel as string),
    'Made with Tanqory',
    'footer.poweredBy',
    t,
  )
  const navItems: Array<{ title: string; url: string }> =
    menus.main ?? fallbackNav(t)
  return {
    settings, t, menus, data, totalQuantity, shopName, year, logo,
    locales, activeLocale, countries, activeCountry,
    showCountrySwitch, showLocaleSwitch, showSwitchers,
    footerTagline, footerColumns, chromeStyle, showPoweredBy, poweredByLabel,
    enableSearchModal, enableCartDrawer, enableAccountDropdown, enableMobileNavDrawer,
    navItems,
  }
}

/** Site header — rendered by sections/Header.tsx (an editable section). */
/**
 * Header scroll state — the two things the design asks the header to know:
 * whether the page has scrolled at all (the design gives the header "no shadow
 * until scrolled"), and, in `on-scroll-up` mode, whether the shopper is
 * scrolling down (hide) or up (reveal).
 *
 * Passive listener, state written only when the value actually changes, so a
 * scroll does not re-render the whole header on every frame.
 */
function useHeaderScroll(sticky: string): { scrolled: boolean; hidden: boolean } {
  const [state, setState] = useState({ scrolled: false, hidden: false })
  const lastY = useRef(0)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onScroll = (): void => {
      const y = window.scrollY
      const goingDown = y > lastY.current
      lastY.current = y
      setState((prev) => {
        const scrolled = y > 4
        // Never hide near the top, and only ever hide in on-scroll-up mode.
        const hidden = sticky === 'on-scroll-up' && goingDown && y > 120
        return prev.scrolled === scrolled && prev.hidden === hidden ? prev : { scrolled, hidden }
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [sticky])
  return state
}

export function SiteHeader({ attributes }: { attributes?: Record<string, unknown> } = {}): JSX.Element {
  const {
    enableMobileNavDrawer, shopName, navItems, showSwitchers, locales,
    showLocaleSwitch, activeLocale, countries, showCountrySwitch, activeCountry,
    enableSearchModal, enableAccountDropdown, settings, totalQuantity, enableCartDrawer, chromeStyle,
    logo,
  } = useChrome(attributes)

  // Two approved layout controls. `logo-left` keeps Nova's current
  // arrangement; `logo-center` is the design's alternative — same markup, the
  // grid decides, so nothing about the DOM order or tab order changes.
  const layout = (attributes?.layout as string) === 'logo-left' ? 'logo-left' : 'logo-center'
  const sticky = ['always', 'on-scroll-up', 'none'].includes(attributes?.sticky as string)
    ? (attributes?.sticky as string)
    : 'always'
  const headerState = useHeaderScroll(sticky)
  // Three header controls that were declared in the editor and read nowhere.
  const searchStyle = (attributes?.searchStyle as string) === 'inline-field' ? 'inline-field' : 'icon'
  const cartAction = (attributes?.cartAction as string) === 'page' ? 'page' : 'drawer'
  const transparentOnHero = attributes?.transparentOnHero === true
  // Design: segmented small 24 / medium 32 / large 40, mobile −8px. The CSS
  // hard-coded 30px, which is not even one of the three options, so the
  // control shipped dead while `templates/index.json` persisted a value for it.
  const logoHeight = ['small', 'medium', 'large'].includes(attributes?.logoHeight as string)
    ? (attributes?.logoHeight as string)
    : 'medium'

  return (
      <header
        className="site-header"
        style={chromeStyle}
        data-layout={layout}
        data-sticky={sticky}
        data-scrolled={headerState.scrolled ? 'true' : 'false'}
        data-hidden={headerState.hidden ? 'true' : 'false'}
        data-search={searchStyle}
        data-logo-height={logoHeight}
        {...(transparentOnHero ? { 'data-transparent': 'true' } : {})}
      >
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
            {logo ? (
              <img
                className="site-header__logo"
                src={logo.url}
                alt={logo.altText || shopName}
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
            {searchStyle === 'inline-field' ? (
              <form className="site-header__search" action="/search" method="get" role="search">
                <Icon name="search" />
                <input
                  type="search"
                  name="q"
                  placeholder="Search"
                  aria-label="Search the store"
                  className="site-header__search-input"
                />
              </form>
            ) : enableSearchModal ? (
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
            {cartAction === 'drawer' && enableCartDrawer ? (
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
  const a = attributes ?? {}
  const background = (a.background as string) ?? 'surface-secondary'
  const mobileMenus = (a.mobileMenus as string) ?? 'accordion'
  const showSocial = a.showSocial !== false
  const showPayment = a.showPayment !== false
  const legalMenu = useMenu((a.legalMenu as string) || '')
  // Block-composed footer (commerce-standard standard): when the section has blocks
  // (Brand / Menu / Text), render them in the grid. With no blocks, fall back
  // to the data-driven default (brand + the three menu columns).
  const hasBlocks = Children.count(children) > 0
  return (
      <footer
        className="site-footer"
        style={chromeStyle}
        data-background={background}
        data-mobile-menus={mobileMenus}
        data-social={showSocial ? 'true' : 'false'}
        data-payment={showPayment ? 'true' : 'false'}
      >
        <div className="container">
          <div className="site-footer__grid">
            {hasBlocks ? children : (
              <>
                <div className="site-footer__brand">
                  <h2>{shopName}</h2>
                  {footerTagline && (
                    <p className="site-footer__muted">{footerTagline}</p>
                  )}
                </div>
                {footerColumns.map((col, i) => (
                  <div className="site-footer__col" key={i}>
                    {col.title && <h3 className="site-footer__col-title">{col.title}</h3>}
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

          {/* One legal row: copyright and legal links on the left, the locale
              selector and payment marks on the right — the design does not
              give the selector a row of its own. */}
          <div className="site-footer__bottom">
            <small>© {year} {shopName}. {t('footer.rights', 'All rights reserved.')}</small>
            {(legalMenu?.items ?? []).length > 0 && (
              <nav className="site-footer__legal-links" aria-label="Legal">
                {(legalMenu?.items ?? [])
                  .filter((it) => Boolean(it.url))
                  .map((it) => (
                    <a key={`${it.url}-${it.title}`} href={it.url as string}>
                      {it.title}
                    </a>
                  ))}
              </nav>
            )}
            <div className="site-footer__legal-end">
              {showSwitchers && (
                <LocaleSwitch
                  locales={showLocaleSwitch ? locales : []}
                  activeLocale={activeLocale}
                  countries={showCountrySwitch ? countries : []}
                  activeCountry={activeCountry ?? countries[0]?.code ?? ''}
                  compact
                />
              )}
              {showPoweredBy && <small>{poweredByLabel}</small>}
            </div>
          </div>
        </div>
      </footer>
  )
}

export default function Layout({ children }: { children: ReactNode }): JSX.Element {
  // Theme settings apply to the whole shell — header/footer sections, the page
  // body and the overlays all render inside the provider.
  return (
    <ThemeSettingsProvider>
      <LayoutBody>{children}</LayoutBody>
    </ThemeSettingsProvider>
  )
}

function LayoutBody({ children }: { children: ReactNode }): JSX.Element {
  const { settings, menus, enableSearchModal, enableCartDrawer, enableMobileNavDrawer, t } =
    useChrome()
  // Drawer copy: the merchant's own words, else nova's default in the theme's language.
  const copy = (key: string, stock: string, i18n: string): string =>
    localizedCopy(settings[key], stock, i18n, t)

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
  const isPreview = isEditorPreview()

  const enableSpa = !isPreview && settings.enableSpaNavigation !== false
  // `useSoftRoute` returns pathname + search, so a query-only navigation is a
  // real state change. Everything that resolves a TEMPLATE or a resource wants
  // the bare pathname, so split it once here rather than at each call site.
  const softLocation = useSoftRoute(enableSpa)
  const softPathname = softLocation.split('?')[0] ?? '/'
  const softSearch = softLocation.includes('?') ? `?${softLocation.split('?')[1] ?? ''}` : ''

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

  // The path the entry mounted for. Its template was already resolved there —
  // including the merchant's `templateSuffix` — so on the landing route the
  // layout must render `children` and not second-guess it. Only a soft
  // navigation AWAY from that path is the layout's to resolve.
  const entryPathRef = useRef(currentPath)
  const navigatedAway = enableSpa && softPathname !== entryPathRef.current

  // Soft navigation resolves the template the same way the entry does —
  // `resolvePageTemplate` applies `templateSuffix`, so a product assigned
  // `product.bundle` renders the bundle template whether the shopper typed the
  // URL or clicked a link. The previous lookup used the BASE template only.
  //
  // Both trees are memoised: `lookupTemplate` resolves the shared groups into a
  // NEW array on every call, and `boundIds` below (and the effect that depends
  // on it) key off the tree's identity. Rebuilding it each render re-ran the
  // effect, whose setState re-rendered, which rebuilt the tree — an update loop
  // on every page.
  const softTree = useMemo(
    () =>
      navigatedAway
        ? lookupTemplate(resolvePageTemplate(softPathname, data, templateExists)) ??
          lookupTemplate('404') ??
          []
        : null,
    [navigatedAway, softPathname, data],
  )

  const pageTree = useMemo(
    () =>
      (softTree ?? lookupTemplate(resolvePageTemplate(currentPath, data, templateExists)) ?? []) as ContentNode[],
    [softTree, currentPath, data],
  )

  // Per-route document head + analytics. Both used to run only at boot, so with
  // SPA routing on every soft navigation kept the landing page's <title>,
  // canonical and og: tags, and emitted no view event of its own.
  // `emitRoute` de-duplicates by URL, so the boot emission is not repeated here.
  useEffect(() => {
    if (!enableSpa || typeof window === 'undefined') return
    applyHead(computeHead(softPathname, data, settings as { shopName?: string }))
    emitRoute({ pathname: softPathname, search: softSearch }, data)
    // `softPathname` also changes on query-only navigation (search), which is
    // exactly when the head and the SEARCH_SUBMITTED event need to change.
  }, [enableSpa, softPathname, softSearch, data, settings])
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
      // Bail when nothing changed (the common case: an empty context on a page
      // with no bound sources), so this effect can never feed its own re-run.
      if (!cancelled) setResourceValue((prev) => (sameResourceContext(prev, next) ? prev : next))
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

      {/* Toast host — mounted once for the whole shell. Without it `showToast`
       *  updates a store nothing is listening to, so the cart's "removed"
       *  message and the article share confirmation silently never appear. */}
      <ToastHost />

      {/* Overlay surfaces — render once per shell. Each is a no-op when its
       *  matching overlay isn't the active one (driven by useOverlayChannel),
       *  so mounting them all here is cheap. */}
      {enableSearchModal && (
        <SearchModal
          placeholder={copy('searchPlaceholder', 'Search products…', 'search.placeholder')}
          ctaLabel={copy('searchCtaLabel', 'See all results →', 'search.cta')}
          maxWidth={(settings.searchModalWidth as string) || '640px'}
          debounceMs={Number(settings.searchDebounceMs ?? 250)}
          maxResults={Number(settings.searchMaxResults ?? 6)}
        />
      )}
      {enableCartDrawer && (
        <CartDrawer
          width={(settings.cartDrawerWidth as string) || '420px'}
          emptyHeading={copy('cartEmptyHeading', 'Your cart is empty', 'cart.empty.title')}
          emptySubtext={copy(
            'cartEmptySubtext',
            'Add a few things to get started.',
            'cart.drawer.emptySub',
          )}
          checkoutLabel={copy('cartCheckoutLabel', 'Checkout', 'cart.checkout')}
          viewCartLabel={copy('cartViewLabel', 'View full cart', 'cart.drawer.view')}
        />
      )}
      {enableMobileNavDrawer && (
        <MobileNavDrawer
          width={(settings.mobileNavWidth as string) || '320px'}
          heading={copy('mobileNavHeading', 'Menu', 'nav.menu')}
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
 * Both use the design system's Select — a control plus a panel it draws
 * itself. They were native <select> elements with a chevron painted on top,
 * which leaves the browser drawing the open state (commerce-standard
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
  const label = { language: t('footer.language', 'Language'), region: t('footer.region', 'Country / region') }

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
              <Select
                label="Language"
                value={locale}
                onChange={setLocale}
                options={locales.map((l) => ({ value: l.code, label: l.label }))}
              />
            </div>
          )}
          {countries.length > 0 && (
            <div className="locale-switch__group">
              <span className="locale-switch__label">{label.region}</span>
              <Select
                label="Country / region"
                value={country}
                onChange={setCountry}
                options={countries.map((c) => ({ value: c.code, label: c.label, note: c.currency }))}
              />
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
          <Select
            id="market-country"
            label={label.region}
            value={country}
            onChange={setCountry}
            options={countries.map((c) => ({ value: c.code, label: c.label, note: c.currency }))}
          />
        </div>
      )}
      {locales.length > 0 && (
        <div className="locale-switch__group">
          <label className="locale-switch__label" htmlFor="market-locale">
            {label.language}
          </label>
          <Select
            id="market-locale"
            label={label.language}
            value={locale}
            onChange={setLocale}
            options={locales.map((l) => ({ value: l.code, label: l.label }))}
          />
        </div>
      )}
      {activeCountryRow && (
        <p className="locale-switch__hint">
          {t('footer.shippingTo', 'Shipping to')} <strong>{activeCountryRow.label}</strong>.{' '}
          {t('footer.pricesIn', 'Prices in')} <strong>{activeCountryRow.currency}</strong>.
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
