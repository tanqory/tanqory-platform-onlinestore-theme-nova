import { useEffect, useState } from 'react'
import {
  useData,
  setConsent,
  setConsentMode,
  consentModeFromShop,
  hasDecided,
  useT,
} from '../lib/tanqory/index'
import { Link } from './Link'

interface BannerConfig {
  enabled?: boolean
  title?: string | null
  body?: string | null
  acceptLabel?: string | null
  declineLabel?: string | null
  manageLabel?: string | null
  position?: string | null
  colorTheme?: string | null
}

/**
 * Cookie-consent banner — shown site-wide when the shopper's jurisdiction requires
 * it (EU/UK/CH/BR/TH/Quebec, unknown location → consent first; US opt-out states →
 * notice + opt-out) or the merchant enables it in Settings → Customer privacy; the
 * server folds both into `cookieBanner.mode` (journey-matrix 0.5). Renders the merchant's configured copy/labels/
 * position/theme (not hardcoded) and ENFORCES the choice: Accept/Decline/Manage
 * write the consent state that TrackingPixels + analytics gate on. Lives in the
 * layout Shell, so it wraps every page.
 */
export function CookieConsent(): JSX.Element | null {
  const t = useT()
  const { shop } = useData()
  const cfg = ((shop as { cookieBanner?: BannerConfig })?.cookieBanner ?? {}) as BannerConfig
  // Shop not loaded yet ⇒ nothing to show, and the gate stays closed (OPT_IN) until it is.
  const mode = shop ? consentModeFromShop(shop) : 'OPT_IN'
  const enabled = Boolean(shop) && mode !== 'NONE'
  const [show, setShow] = useState(false)
  const [managing, setManaging] = useState(false)
  // Under consent-first law a pre-ticked box is not consent — start unticked.
  const [analytics, setAnalytics] = useState(mode === 'OPT_OUT')
  const [marketing, setMarketing] = useState(mode === 'OPT_OUT')

  useEffect(() => {
    if (!shop) return
    // Tell the consent layer the verdict for THIS shopper (this gates tracking).
    setConsentMode(mode)
    if (mode !== 'NONE' && !hasDecided()) setShow(true)
  }, [shop, mode])

  if (!enabled || !show) return null

  const decide = (a: boolean, m: boolean): void => {
    setConsent({ analytics: a, marketing: m })
    setShow(false)
  }

  const position = cfg.position === 'top' ? 'cookie-consent--top' : 'cookie-consent--bottom'
  const theme = cfg.colorTheme === 'dark' ? 'cookie-consent--dark' : 'cookie-consent--light'

  return (
    <div
      className={`cookie-consent ${position} ${theme}`}
      role="dialog"
      aria-label={t('cookie.consent')}
    >
      <div className="cookie-consent__inner">
        <div className="cookie-consent__copy">
          {/* Defaulted, not gated — matching the dashboard's own preview, which
              shows "Cookie consent" while saving an empty string. */}
          <strong className="cookie-consent__title">{cfg.title || 'Cookie consent'}</strong>
          <p className="cookie-consent__text">
            {cfg.body || 'We use cookies to improve your experience.'}{' '}
            <Link href="/policies/privacy-policy">Privacy Policy</Link>.
          </p>
        </div>

        {managing ? (
          <div className="cookie-consent__manage">
            <label className="cookie-consent__toggle">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              Analytics
            </label>
            <label className="cookie-consent__toggle">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />
              Marketing
            </label>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => decide(analytics, marketing)}
            >
              {cfg.acceptLabel || 'Save'}
            </button>
          </div>
        ) : (
          <div className="cookie-consent__actions">
            {/* Always rendered. This used to be gated on `cfg.manageLabel`, so a
                blank label removed the ONLY route to granular consent and left
                shoppers with Accept/Decline — which is the thing GDPR/CCPA
                actually require. A missing label is a missing label; it is not
                permission to drop the control. Default the text instead. */}
            <button type="button" className="btn btn--ghost" onClick={() => setManaging(true)}>
              {cfg.manageLabel || 'Manage preferences'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => decide(false, false)}>
              {cfg.declineLabel || 'Decline'}
            </button>
            <button type="button" className="btn btn--primary" onClick={() => decide(true, true)}>
              {cfg.acceptLabel || 'Accept'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
