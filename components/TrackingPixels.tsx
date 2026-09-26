import { useEffect } from 'react'
import { useData, pixelConsent, onConsentChange, wrapPixelCode } from '../lib/tanqory/index'

/**
 * Injects the store's CONNECTED tracking pixels (Settings → Customer events) on
 * the live storefront. Each pixel's script is appended to <head> once. The code
 * is the merchant's own snippet (configured in the Dashboard, so trusted).
 *
 * GATED ON CONSENT: pixels are marketing/tracking, so they only inject after an EXPLICIT
 * `marketing` grant (deny until decided) and never under Global Privacy Control — whatever the
 * store's banner setting says (`pixelConsent`; the theme's `hasConsent` is fail-open with no banner
 * and does not read GPC). If the shopper grants later, `onConsentChange` re-runs the injection.
 *
 * Deliberately INERT in the editor/preview planes — we never fire real tracking
 * while a merchant edits the theme.
 */
export function TrackingPixels(): null {
  const { pixels } = useData()

  useEffect(() => {
    if (!pixels) return
    const isPreview =
      /^preview-/.test(window.location.hostname) ||
      new URLSearchParams(window.location.search).has('preview') ||
      new URLSearchParams(window.location.search).has('edit')
    if (isPreview) return

    let cancelled = false
    let cached: Array<{ id: string; code?: string | null }> | null = null

    const inject = (): void => {
      if (cancelled || !cached || !pixelConsent()) return
      for (const p of cached) {
        if (!p.code) continue
        const id = `tq-pixel-${p.id}`
        if (document.getElementById(id)) continue
        const s = document.createElement('script')
        s.id = id
        s.type = 'text/javascript'
        // The wizard's snippets call a bare `analytics.subscribe` — hand them the bus (see pixel-code.ts).
        s.text = wrapPixelCode(p.code)
        document.head.appendChild(s)
      }
    }

    void pixels()
      .then((list) => {
        if (cancelled || !Array.isArray(list)) return
        cached = list
        inject()
      })
      .catch(() => {
        /* tracking is best-effort — never break the page */
      })

    // Re-inject when the shopper grants marketing consent after page load.
    const off = onConsentChange(() => inject())

    return () => {
      cancelled = true
      off()
    }
  }, [pixels])

  return null
}
