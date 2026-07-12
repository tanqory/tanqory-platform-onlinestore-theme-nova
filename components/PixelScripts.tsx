import { useEffect } from 'react'
import { apiBase } from '../lib/api-base'

/**
 * Injects the store's connected tracking pixels (Settings → Customer events),
 * served by the storefront GraphQL `customPixels { code }` resolver.
 *
 * Self-fetches (rather than reading `data.pixels()`) for the same reason as
 * PageBody/`useStorefrontShop`: the theme-runtime image bakes an older theme-kit.
 * Client-only and idempotent (each pixel injected once, keyed by id). Respects
 * the cookie banner: when consent is enabled and the visitor declined, pixels
 * are not injected; re-runs when consent changes so accepting later still fires.
 */
export function PixelScripts({ bannerEnabled }: { bannerEnabled?: boolean }): null {
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

    const consentDeclined = () => {
      if (!bannerEnabled) return false
      try {
        return window.localStorage.getItem('tq-consent') === 'declined'
      } catch {
        return false
      }
    }

    let cancelled = false
    const inject = async () => {
      if (consentDeclined()) return
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(env.VITE_TANQORY_STOREFRONT_TOKEN
            ? { 'x-publishable-key': env.VITE_TANQORY_STOREFRONT_TOKEN }
            : {}),
        },
        body: JSON.stringify({
          query: 'query NovaPixels { customPixels { id provider code } }',
        }),
      })
        .then((r) => r.json())
        .catch(() => null)
      if (cancelled || !res) return
      const pixels: Array<{ id: string; provider?: string | null; code?: string | null }> =
        res.data?.customPixels ?? []
      for (const p of pixels) {
        if (!p?.code) continue
        const marker = `tq-pixel-${p.id}`
        if (document.getElementById(marker)) continue
        const el = document.createElement('script')
        el.id = marker
        el.type = 'text/javascript'
        el.dataset.tqPixel = p.provider || 'custom'
        el.text = p.code
        document.head.appendChild(el)
      }
    }

    void inject()
    const onConsent = () => void inject()
    window.addEventListener('tq-consent-change', onConsent)
    return () => {
      cancelled = true
      window.removeEventListener('tq-consent-change', onConsent)
    }
  }, [bannerEnabled])

  return null
}
