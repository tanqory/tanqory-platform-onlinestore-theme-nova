// SSG server entry — renders the storefront to an HTML string at build time.
// Tries live GraphQL first (so cold rebuilds bake real product data into
// dist/index.html for SEO + instant first paint) and falls back to the
// bundled mock fixtures if the backend is unreachable / over-budget — same
// graceful-degradation policy as main.tsx.
import { renderStorefrontHTML } from '@tanqory/theme-kit/ssg'
import { createMockData, createLiveData, type DataApi } from '@tanqory/theme-kit'
import collections from './lib/collections.json'
import settings from './config/settings.json'
import locale from './locales/en.json'

const env = import.meta.env as ImportMetaEnv & {
  VITE_TANQORY_BACKEND?: string
  VITE_TANQORY_STORE_ID?: string
  VITE_TANQORY_STOREFRONT_TOKEN?: string
}

async function bootData(): Promise<DataApi> {
  const { VITE_TANQORY_BACKEND, VITE_TANQORY_STORE_ID, VITE_TANQORY_STOREFRONT_TOKEN } = env
  if (VITE_TANQORY_BACKEND && VITE_TANQORY_STORE_ID) {
    try {
      return await createLiveData({
        endpoint: VITE_TANQORY_BACKEND,
        storeId: VITE_TANQORY_STORE_ID,
        token: VITE_TANQORY_STOREFRONT_TOKEN,
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[ssg] live data fetch failed, falling back to mocks:', (err as Error)?.message ?? err)
    }
  }
  return createMockData(collections)
}

/**
 * Returns the SSG HTML plus the serializable data snapshot it was rendered
 * with. The prerender step embeds `state` into the page as
 * `window.__TQ_STATE__`, and main.tsx rebuilds the identical DataApi from it
 * synchronously at hydration — SSR markup and the client's first render match
 * by construction (no React #418/#425). `state` is null when SSG fell back to
 * mocks (no backend at build time) — the client then does a plain CSR boot.
 */
export async function render(
  page = 'index',
): Promise<{
  html: string
  state: unknown | null
  head: { title: string; description: string; keywords: string[] }
}> {
  const data = await bootData()
  const html = renderStorefrontHTML({
    sections: import.meta.glob('./sections/*.tsx', { eager: true }),
    pages: import.meta.glob('./templates/*.json', { eager: true }),
    shell: import.meta.glob('./layouts/*.tsx', { eager: true }),
    data,
    settings,
    locale,
    page,
  })
  const bootstrap = data.getSnapshot?.() ?? null
  // The SSG only prerenders the home page, so its head is the shop's — the
  // client sets per-route heads for everything else (see main.tsx computeHead).
  const shop = (data as { shop?: { name?: string; description?: string } }).shop
  const head = {
    title: (shop?.name || (settings as { shopName?: string }).shopName || 'Store').trim(),
    description: (shop?.description || '').trim(),
    keywords: [] as string[],
  }
  return { html, state: bootstrap ? { page, bootstrap } : null, head }
}
