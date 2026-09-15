/**
 * The document `<title>` — one rule for every route, so no template can name
 * the shop differently from the header.
 *
 * Why. nova#14 made the head prefer the theme's shop name, like the header. A
 * production build for "ผ้าเก่าเล่าเรื่อง" still showed "การจัดส่งและการคืนสินค้า —
 * Demo-2" (the store ACCOUNT's name) because the precedence was an inline
 * expression repeated in three places. It lives here now, pinned by
 * lib/head.test.ts, and main.tsx and entry-server.tsx both call it.
 *
 * Pure (no DOM, no React).
 */

/**
 * The shop's name as the storefront shows it: the theme's `shopName` setting
 * (an AI-built theme names the brand it was built for), else the store's own
 * name, else 'Store'.
 */
export function shopNameOf(themeShopName: unknown, storeName: unknown): string {
  const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
  return text(themeShopName) || text(storeName) || 'Store'
}

/**
 * A route's title: the resource's SEO title verbatim (the merchant owns it),
 * else "<resource title> — <shop>", else the shop name alone.
 */
export function documentTitle(input: {
  seoTitle?: string | null
  resourceTitle?: string | null
  shopName: string
}): string {
  const seo = input.seoTitle?.trim()
  if (seo) return seo
  const title = input.resourceTitle?.trim()
  return title ? `${title} — ${input.shopName}` : input.shopName
}
