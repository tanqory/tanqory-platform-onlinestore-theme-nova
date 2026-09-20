/**
 * The theme's ONE route table.
 *
 * `resolveTemplate` used to exist twice, byte-for-byte, in `main.tsx` and
 * `layouts/layout.tsx`, each with a comment asking the next person to keep them
 * in sync. They drive different things — the entry picks the template to mount,
 * the layout picks the template to swap in on a soft navigation — so a route
 * added to one and not the other renders a 404 on exactly one of the two paths.
 *
 * Route matching lives here. Anything that needs "what does this URL mean" reads
 * it from this module.
 */
import { decodeHandle } from './handle.ts'

/** The resource a URL addresses, if it addresses one. */
export interface RouteMatch {
  /** Base template name — a file under `templates/<name>.json`. */
  template: string
  /** Resource kind, for the record types that carry a `templateSuffix`. */
  resource?: 'product' | 'collection' | 'page' | 'blog' | 'article'
  /** Decoded handle of the addressed resource. */
  handle?: string
  /** Blog handle, for article routes (`/blogs/<blog>/<article>`). */
  blogHandle?: string
}

/** Strip the trailing slash(es) from a pathname, keeping "/" itself. */
function normalize(pathname: string): string {
  return pathname !== '/' ? pathname.replace(/\/+$/, '') || '/' : '/'
}

/**
 * Match a URL pathname to a template + the resource it addresses.
 *
 * Order matters: `/blogs/<blog>/<article>` must be tested BEFORE
 * `/blogs/<handle>` so the blog list doesn't shadow article detail.
 */
export function matchRoute(pathname: string): RouteMatch {
  const p = normalize(pathname)
  if (p === '/') return { template: 'index' }
  if (p === '/cart') return { template: 'cart' }
  if (p === '/search') return { template: 'search' }
  if (p === '/contact') return { template: 'contact' }
  if (p === '/404') return { template: '404' }
  if (p === '/collections') return { template: 'list-collections' }

  let m: RegExpMatchArray | null
  if ((m = p.match(/^\/collections\/([^/]+)$/)))
    return { template: 'collection', resource: 'collection', handle: decodeHandle(m[1]) }
  if ((m = p.match(/^\/products\/([^/]+)$/)))
    return { template: 'product', resource: 'product', handle: decodeHandle(m[1]) }
  if ((m = p.match(/^\/pages\/([^/]+)$/)))
    return { template: 'page', resource: 'page', handle: decodeHandle(m[1]) }
  // Shop policies (Settings) — a menu item of type "Policy" links to
  // /policies/<handle> (privacy-policy, refund-policy, …).
  if (/^\/policies\/[^/]+$/.test(p)) return { template: 'policy' }
  // Customer account — /account and its sub-routes (login, orders, addresses).
  if (p === '/account' || /^\/account\/[^/]+/.test(p)) return { template: 'account' }
  if ((m = p.match(/^\/blogs\/([^/]+)\/([^/]+)$/)))
    return {
      template: 'article',
      resource: 'article',
      blogHandle: decodeHandle(m[1]),
      handle: decodeHandle(m[2]),
    }
  if ((m = p.match(/^\/blogs\/([^/]+)$/)))
    return { template: 'blog', resource: 'blog', handle: decodeHandle(m[1]) }
  return { template: '404' }
}

/** Base template name for a pathname. */
export function resolveTemplate(pathname: string): string {
  return matchRoute(pathname).template
}

/** The handle a pathname addresses for a given resource kind, else undefined. */
export function routeHandle(
  pathname: string,
  resource: NonNullable<RouteMatch['resource']>,
): string | undefined {
  const match = matchRoute(pathname)
  return match.resource === resource ? match.handle : undefined
}

/**
 * The detail-route handle variables the bootstrap query should prefetch, so a
 * record's `templateSuffix` is known before the template is chosen.
 */
export function detailHandles(pathname: string): {
  pageHandle?: string
  productHandle?: string
  collectionHandle?: string
} {
  const m = matchRoute(pathname)
  if (m.resource === 'page' && m.handle) return { pageHandle: m.handle }
  if (m.resource === 'product' && m.handle) return { productHandle: m.handle }
  if (m.resource === 'collection' && m.handle) return { collectionHandle: m.handle }
  return {}
}

/**
 * `<base>.<suffix>` when the theme ships that template file, else `<base>`.
 *
 * `templateExists` is injected rather than globbed here so the entry and the
 * layout can each pass the glob they already hold, and so this module stays
 * testable without Vite.
 */
export function variantOf(
  base: string,
  suffix: string | null | undefined,
  templateExists: (name: string) => boolean,
): string {
  const candidate = suffix ? `${base}.${suffix}` : base
  return templateExists(candidate) ? candidate : base
}

/** Minimal shape of the data layer this module needs to read a templateSuffix. */
export interface TemplateSuffixSource {
  productByHandle: (handle: string) => { templateSuffix?: string | null } | null
  collectionByHandle: (handle: string) => { templateSuffix?: string | null } | null
  pageByHandle: (handle: string) => { templateSuffix?: string | null } | null
}

/**
 * The template to actually render for a pathname, including the merchant's
 * per-resource template assignment (`templateSuffix`).
 *
 * This is the function the SPA router was missing: soft navigation looked up
 * the BASE template only, so a product assigned `product.bundle` rendered
 * `product` once the shopper arrived by clicking rather than by URL.
 *
 * Blog and article suffixes are resolved asynchronously by the caller (they are
 * not in the sync bootstrap), so they are left at their base here.
 */
export function resolvePageTemplate(
  pathname: string,
  data: TemplateSuffixSource,
  templateExists: (name: string) => boolean,
): string {
  const m = matchRoute(pathname)
  if (!m.resource || !m.handle) return m.template
  let suffix: string | null | undefined
  if (m.resource === 'product') suffix = data.productByHandle(m.handle)?.templateSuffix
  else if (m.resource === 'collection') suffix = data.collectionByHandle(m.handle)?.templateSuffix
  else if (m.resource === 'page') suffix = data.pageByHandle(m.handle)?.templateSuffix
  else return m.template
  return variantOf(m.template, suffix, templateExists)
}
