/**
 * Per-route document head — title, description, canonical, Open Graph, Twitter
 * card and favicon — computed from the merchant's own SEO fields.
 *
 * Extracted from `main.tsx` so BOTH entry points can use it: the boot path
 * (which runs once) and the SPA router in `layouts/layout.tsx` (which runs on
 * every soft navigation). Previously only boot applied a head, so every page a
 * shopper reached by clicking kept the previous page's <title>, canonical and
 * og: tags — including the link they then shared.
 *
 * Title precedence: the resource's SEO title verbatim (the merchant owns it) →
 * "<resource title> — <shop>" → the shop name. Description: SEO description →
 * page bodySummary → shop description (home only).
 */
import type { DataApi } from '@tanqory/theme-kit'
import { matchRoute } from './routes'

/** Build a HeadMeta from a resource's SEO (shared by blog/article, which resolve
 *  their SEO asynchronously rather than from the sync bootstrap). */
export function headFrom(
  seo: { title?: string | null; description?: string | null; keywords?: string[] | null } | null | undefined,
  resourceTitle: string,
  shopName: string,
  fallbackDesc?: string | null,
  image?: string | null,
): HeadMeta {
  return {
    title: seo?.title?.trim() ? seo.title.trim() : `${resourceTitle} — ${shopName}`,
    description: (seo?.description || fallbackDesc || '').trim(),
    keywords: (seo?.keywords ?? []).filter(Boolean),
    image: absUrl(image),
    type: 'article',
    siteName: shopName,
    favicon: '',
  }
}

/**
 * Per-route document head (title + meta description) from the merchant's SEO
 * fields. Precedence — title: the resource's SEO title verbatim (merchant owns
 * it) → "<resource title> — <shop>" → shop name; description: SEO description →
 * page bodySummary → shop description (home only). Runs client-side on every
 * route (the SSG only prerenders home), so product/collection/page pages that
 * are client-rendered still get a correct, unique title + description.
 */
export interface HeadMeta {
  title: string
  description: string
  keywords: string[]
  /** Absolute URL of the page's lead image, for og:image / twitter:image. */
  image: string
  /** 'website' for the home page, 'product'/'article' for detail pages. */
  type: string
  /** Shop name — og:site_name. */
  siteName: string
  /** Absolute URL for the favicon / tab icon (square brand mark). */
  favicon: string
}

/** Resolve a possibly-relative asset URL to an absolute one, against the
 *  current origin — social scrapers require absolute og:image URLs. */
export function absUrl(url: string | undefined | null): string {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  if (typeof window === 'undefined') return url
  return new URL(url, window.location.origin).toString()
}

export function computeHead(
  pathname: string,
  data: DataApi,
  settings: { shopName?: string },
): HeadMeta {
  const shop = data.shop as
    | {
        name?: string
        description?: string
        brand?: {
          logo?: { url?: string } | null
          squareLogo?: { url?: string } | null
          coverImage?: { url?: string } | null
        } | null
      }
    | undefined
  const shopName = (shop?.name || settings.shopName || 'Store').trim()
  let seoTitle: string | null | undefined
  let rawTitle: string | undefined
  let description: string | null | undefined
  let keywords: string[] = []
  let image: string | undefined
  let type = 'website'
  const route = matchRoute(pathname)
  const isDetail = {
    pg: route.resource === 'page' ? route.handle : undefined,
    pr: route.resource === 'product' ? route.handle : undefined,
    co: route.resource === 'collection' ? route.handle : undefined,
  }
  if (isDetail.pr) {
    const r = data.productByHandle(isDetail.pr) as
      | { seo?: { title?: string | null; description?: string | null; keywords?: string[] }; title?: string; featuredImage?: { url?: string } | null }
      | undefined
    seoTitle = r?.seo?.title; rawTitle = r?.title; description = r?.seo?.description; keywords = r?.seo?.keywords ?? []
    image = r?.featuredImage?.url; type = 'product'
  } else if (isDetail.co) {
    const r = data.collectionByHandle(isDetail.co) as
      | { seo?: { title?: string | null; description?: string | null; keywords?: string[] }; title?: string; image?: { url?: string } | null }
      | undefined
    seoTitle = r?.seo?.title; rawTitle = r?.title; description = r?.seo?.description; keywords = r?.seo?.keywords ?? []
    image = r?.image?.url
  } else if (isDetail.pg) {
    const r = data.pageByHandle(isDetail.pg)
    seoTitle = r?.seo?.title; rawTitle = r?.title; description = r?.seo?.description || r?.bodySummary; keywords = r?.seo?.keywords ?? []
    type = 'article'
  }
  const isHome = !isDetail.pg && !isDetail.pr && !isDetail.co
  const title = seoTitle?.trim() ? seoTitle.trim() : rawTitle ? `${rawTitle} — ${shopName}` : shopName
  return {
    title,
    description: (description || (isHome ? shop?.description : '') || '').trim(),
    keywords: keywords.filter(Boolean),
    // og:image fallback chain: the resource's own image → the brand cover image
    // (Settings → Brand, a purpose-built share banner) → the brand logo. Both
    // brand images were SAVED_ONLY — carried on the SDL, rendered nowhere.
    image: absUrl(image || shop?.brand?.coverImage?.url || shop?.brand?.logo?.url),
    type,
    siteName: shopName,
    // The square brand mark makes the best favicon / tab icon; fall back to the
    // primary logo. Also previously SAVED_ONLY.
    favicon: absUrl(shop?.brand?.squareLogo?.url || shop?.brand?.logo?.url),
  }
}

/**
 * Write the computed head into the live document (client-side).
 *
 * Beyond title/description/keywords this now emits the canonical link + Open
 * Graph + Twitter card tags that were missing entirely — which is why a shared
 * product link previewed as the bare shop name on every page. The canonical and
 * og:url use the page's own URL (the host the storefront is served on is the
 * correct canonical for that page); forcing canonical to a configured primary
 * domain when a shopper is on a different host is the store-api#558 follow-up.
 */
export function applyHead({ title, description, keywords, image, type, siteName, favicon }: HeadMeta): void {
  if (typeof document === 'undefined') return
  const head = document.head
  if (title) document.title = title

  /**
   * Write a head tag, or REMOVE it when the new page has no value for it.
   *
   * Skipping empty values left the previous route's head in place on a soft
   * navigation: opening a product set `og:description`, `og:image` and
   * `keywords`, and clicking through to a page without them kept all three, so
   * sharing that URL previewed the product you had just left — the exact stale
   * -head bug this module exists to fix.
   */
  const upsert = (selector: string, make: () => HTMLElement, content: string) => {
    const existing = head.querySelector(selector)
    if (!content) {
      // Only ever remove a tag this function owns, never one the document
      // shipped with that we have no replacement for.
      if (existing && existing.getAttribute('data-tq-head') === 'true') existing.remove()
      return
    }
    let el = existing
    if (!el) {
      el = make()
      el.setAttribute('data-tq-head', 'true')
      head.appendChild(el)
    }
    if (el.tagName === 'LINK') el.setAttribute('href', content)
    else el.setAttribute('content', content)
  }
  const meta = (name: string, content: string) =>
    upsert(`meta[name="${name}"]`, () => {
      const m = document.createElement('meta')
      m.setAttribute('name', name)
      return m
    }, content)
  const prop = (property: string, content: string) =>
    upsert(`meta[property="${property}"]`, () => {
      const m = document.createElement('meta')
      m.setAttribute('property', property)
      return m
    }, content)

  const url = window.location.origin + window.location.pathname

  meta('description', description)
  meta('keywords', keywords.join(', '))

  upsert('link[rel="canonical"]', () => {
    const l = document.createElement('link')
    l.setAttribute('rel', 'canonical')
    return l
  }, url)

  prop('og:type', type)
  prop('og:url', url)
  prop('og:title', title)
  prop('og:description', description)
  prop('og:site_name', siteName)
  prop('og:image', image)

  meta('twitter:card', image ? 'summary_large_image' : 'summary')
  meta('twitter:title', title)
  meta('twitter:description', description)
  meta('twitter:image', image)

  if (favicon) {
    upsert(
      'link[rel="icon"]',
      () => {
        const l = document.createElement('link')
        l.setAttribute('rel', 'icon')
        return l
      },
      favicon,
    )
  }
}
