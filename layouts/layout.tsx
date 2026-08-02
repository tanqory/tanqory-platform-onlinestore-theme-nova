import { Children, type ReactNode } from 'react'
import {
  AccountMenu,
  COUNTRY_KEY,
  LOCALE_KEY,
  StorefrontShell,
  useChrome,
  usePersistedChoice,
} from '@tanqory/theme-kit/app'
import { useT, type PageDoc } from '@tanqory/theme-kit'
import { openOverlay, closeOverlay } from '../components/useOverlayChannel'

/**
 * nova's layout — PRESENTATION ONLY.
 *
 * The application plumbing (SPA soft-route + its /checkout|/account|/orders
 * bail-outs, url redirects, live menus, editor preview selection, dynamic
 * -source metafield binding, and the global overlay surfaces) lives in
 * `<StorefrontShell>` from `@tanqory/theme-kit/app`, shared by every theme.
 *
 * What stays here is what a theme should own: the header/footer markup and the
 * locale/market switcher. `useChrome()` hands us the derived state (menus,
 * brand, toggles) those need.
 */

/**
 * Templates are handed to the shell so its SPA router can swap them in without
 * a network round-trip. The glob MUST be evaluated here — `import.meta.glob`
 * resolves relative to the file it appears in, so it can only run from the
 * theme.
 */
const TEMPLATES = import.meta.glob('../templates/*.json', { eager: true }) as Record<
  string,
  { default?: PageDoc }
>

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
  // Block-composed footer (commerce-standard standard): when the section has blocks
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
  return (
    <StorefrontShell templates={TEMPLATES} env={import.meta.env}>
      {children}
    </StorefrontShell>
  )
}

/* ============================================================================
 * Locale + market switcher
 *
 * Compact (header) — single icon button that opens a small grouped panel.
 * Full (footer)   — two side-by-side dropdowns with labels.
 *
 * Both wrap native <form>/<select> so they work without client JS (commerce-standard
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
  // ?locale= (the kit's resolveLocale), and the SSG bakes the default locale, so
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
