// SSG server entry — renders the storefront to an HTML string at build time.
//
// A build CONFIGURED for a backend (VITE_TANQORY_BACKEND + VITE_TANQORY_STORE_ID)
// renders live GraphQL data, so cold rebuilds bake real product data into
// dist/index.html for SEO + instant first paint. If that fetch fails the build
// FAILS — it does not fall back to fixtures. Prerendering mock products into a
// real store's index.html ships example products at example prices to shoppers
// and to crawlers, and the page looks healthy while it does it.
//
// An UNCONFIGURED build (offline dev, a theme with no store attached) renders
// the bundled fixtures, which is the whole point of mock mode.
import { renderStorefrontHTML } from '@tanqory/theme-kit/ssg'
import { createMockData, createLiveData, type DataApi } from '@tanqory/theme-kit'
import collections from './lib/collections.json'
import settings from './config/settings.json'
import { documentTitle, shopNameOf } from './lib/head'
import { localeStrings, themeLocaleOf } from './lib/theme-locale'

// The theme's own language (`config/settings.json` `locale`) is what the SSG
// bakes — the same choice main.tsx makes, so hydration matches (lib/theme-locale.ts).
const localeMaps: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(
    import.meta.glob('./locales/*.json', { eager: true }) as Record<
      string,
      { default: Record<string, string> }
    >,
  ).map(([path, mod]) => [path.match(/\/([^/]+)\.json$/)?.[1] ?? 'en', mod.default]),
)
const locale = localeStrings(
  themeLocaleOf((settings as { locale?: unknown }).locale, Object.keys(localeMaps)),
  localeMaps,
)

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
      // Fail the build. A configured store must never be prerendered from
      // fixtures — that is how "Example product · $99" reaches a real
      // storefront's HTML and its search-engine snapshot.
      throw new Error(
        `[ssg] live data fetch failed for store ${VITE_TANQORY_STORE_ID} at ${VITE_TANQORY_BACKEND}: ` +
          `${(err as Error)?.message ?? String(err)}. ` +
          'Refusing to prerender a configured storefront from mock fixtures.',
      )
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
    groups: import.meta.glob('./groups/*.json', { eager: true }),
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
    title: documentTitle({
      shopName: shopNameOf((settings as { shopName?: unknown }).shopName, shop?.name),
    }),
    description: (shop?.description || '').trim(),
    keywords: [] as string[],
  }
  return { html, state: bootstrap ? { page, bootstrap } : null, head }
}
