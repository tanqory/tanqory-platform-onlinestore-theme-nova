import { useEffect, useState, type CSSProperties } from 'react'

/**
 * Cookie-consent banner driven by the store's real Customer-privacy settings
 * (Settings → Customer privacy → Data sharing), served as `shop.cookieBanner`
 * and passed in by the layout (which self-fetches shop — see `useStorefrontShop`).
 *
 * Renders nothing until mounted on the client (consent state lives in
 * localStorage), so SSR/hydration stay in sync and there's no flash. Shows only
 * when the merchant enabled the banner and the visitor hasn't chosen yet.
 *
 * The current backend exposes `{ enabled, dataSharingTitle, dataSharingVisible }`.
 * Rich copy/button/position config lands with the Phase 2 backend work; this
 * reads whatever fields exist and falls back to sensible defaults, so it upgrades
 * automatically once those fields are served.
 */

const CONSENT_KEY = 'tq-consent'

export interface CookieBannerConfig {
  enabled: boolean
  dataSharingTitle?: string | null
  dataSharingVisible?: boolean
  title?: string | null
  body?: string | null
  acceptLabel?: string | null
  declineLabel?: string | null
  manageLabel?: string | null
  /** "bottom" | "top" | "bottom-left" | "bottom-right" */
  position?: string | null
  /** "light" | "dark" */
  colorTheme?: string | null
}

export function CookieConsent({ banner }: { banner?: CookieBannerConfig | null }): JSX.Element | null {
  const [decided, setDecided] = useState(true) // assume decided until we read storage

  useEffect(() => {
    try {
      setDecided(!!window.localStorage.getItem(CONSENT_KEY))
    } catch {
      setDecided(false)
    }
  }, [])

  if (!banner?.enabled || decided) return null

  const choose = (value: 'accepted' | 'declined') => {
    try {
      window.localStorage.setItem(CONSENT_KEY, value)
      window.dispatchEvent(new CustomEvent('tq-consent-change', { detail: value }))
    } catch {
      /* storage blocked — still dismiss for this session */
    }
    setDecided(true)
  }

  // Merchant-configured copy (Settings → Customer privacy → Cookie banner)
  // with sensible defaults so the banner is complete before it's tuned.
  const title = banner.title || banner.dataSharingTitle || 'We value your privacy'
  const body =
    banner.body ||
    'We use cookies to enhance your browsing experience, serve personalized content, and analyze traffic. You can accept all cookies or decline non-essential ones.'
  const acceptLabel = banner.acceptLabel || 'Accept Cookies'
  const declineLabel = banner.declineLabel || 'Decline'
  const dark = banner.colorTheme === 'dark'
  const pos = banner.position || 'bottom'
  const edge: CSSProperties =
    pos === 'top' ? { top: 0, borderBottom: '1px solid' } : { bottom: 0, borderTop: '1px solid' }
  const side: CSSProperties =
    pos === 'bottom-left'
      ? { right: 'auto', maxWidth: 420, margin: 'var(--space-4)' }
      : pos === 'bottom-right'
        ? { left: 'auto', maxWidth: 420, margin: 'var(--space-4)' }
        : {}

  return (
    <>
      <style>{`
        .tq-consent {
          position: fixed; z-index: 60; left: 0; right: 0;
          display: flex; gap: var(--space-4, 1rem); align-items: center;
          flex-wrap: wrap; justify-content: space-between;
          padding: var(--space-4, 1rem) var(--space-5, 1.5rem);
          box-shadow: 0 -8px 30px rgba(0,0,0,0.08);
          animation: tq-consent-in 380ms cubic-bezier(0.16,1,0.3,1);
        }
        .tq-consent--light { background: var(--color-bg, #fff); color: var(--color-fg, #111); border-color: var(--color-fg, #111); }
        .tq-consent--dark  { background: #111; color: #fff; border-color: #111; }
        .tq-consent__text { flex: 1 1 340px; min-width: 0; }
        .tq-consent__title { font-family: var(--font-display, inherit); font-size: 1rem; margin: 0 0 0.25rem; }
        .tq-consent__body { opacity: 0.75; font-size: 0.85rem; margin: 0; max-width: 68ch; }
        .tq-consent__actions { display: flex; gap: var(--space-3, 0.75rem); flex-wrap: wrap; }
        @keyframes tq-consent-in { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .tq-consent { animation: none; } }
      `}</style>
      <div
        className={`tq-consent ${dark ? 'tq-consent--dark' : 'tq-consent--light'}`}
        style={{ ...edge, ...side }}
        role="region"
        aria-label={title}
      >
        <div className="tq-consent__text">
          <p className="tq-consent__title">{title}</p>
          <p className="tq-consent__body">{body}</p>
        </div>
        <div className="tq-consent__actions">
          <button type="button" className="btn btn--secondary" onClick={() => choose('declined')}>
            {declineLabel}
          </button>
          <button type="button" className="btn btn--primary" onClick={() => choose('accepted')}>
            {acceptLabel}
          </button>
        </div>
      </div>
    </>
  )
}
