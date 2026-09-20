/**
 * The theme's own language — which of `locales/*.json` its fixed interface
 * words are drawn from — and the rule for copy that ships with an English
 * default a merchant may have kept or replaced.
 *
 * Why. A theme built for a Thai shop (production build 7270019a, 2026-09-15:
 * "ผ้าเก่าเล่าเรื่อง") showed "Sign in for faster checkout." in the account
 * menu and "We read every note." over the contact form on every page, with a
 * Thai site around them. nova already had a Thai string map; nothing chose it
 * except a visitor's own `?locale=`. `config/settings.json` `locale` is now the
 * theme's language: the default map, before any visitor choice.
 *
 * Pure (no DOM, no React) so it is unit-tested directly (lib/theme-locale.test.ts).
 */

/** The map every other one is laid over, and the language of a theme that names none. */
export const FALLBACK_LOCALE = 'en'

const LOCALE_CODE = /^[a-z]{2}(?:-[a-z]{2})?$/i

/**
 * The locale a theme's `locale` setting names, when a string map for it is
 * bundled (`th`, or `th` for `th-TH`); the fallback otherwise — blank, malformed
 * or a language this theme has no strings for.
 */
export function themeLocaleOf(setting: unknown, available: Iterable<string>): string {
  if (typeof setting !== 'string') return FALLBACK_LOCALE
  const code = setting.trim().toLowerCase()
  if (!LOCALE_CODE.test(code)) return FALLBACK_LOCALE
  const have = new Set(available)
  if (have.has(code)) return code
  const base = code.split('-')[0]
  return have.has(base) ? base : FALLBACK_LOCALE
}

/**
 * The strings for `code`: the fallback map with that locale's own map laid over
 * it, so a partly translated locale shows English rather than raw keys.
 */
export function localeStrings(
  code: string,
  maps: Record<string, Record<string, string>>,
): Record<string, string> {
  const base = maps[FALLBACK_LOCALE] ?? {}
  return code === FALLBACK_LOCALE ? base : { ...base, ...(maps[code] ?? {}) }
}

/**
 * Copy a merchant may override, which nova ships with an English default in a
 * theme setting or a template (the cart drawer's "Checkout", the contact form's
 * "Send us a message").
 *
 *   - Words the merchant wrote — anything that is not one of nova's `stock`
 *     defaults — are theirs and are returned exactly as they are.
 *   - Blank, or still nova's English default: the active locale's string for
 *     `key`. A key the locale lacks falls back to the stock English.
 *
 * So an English theme renders exactly what it did, and a Thai theme renders
 * Thai without anyone rewriting its settings or templates.
 */
export function localizedCopy(
  value: unknown,
  stock: string | readonly string[],
  key: string,
  t: (key: string) => string,
): string {
  const stocks: readonly string[] = typeof stock === 'string' ? [stock] : stock
  const text = typeof value === 'string' ? value.trim() : ''
  if (text && !stocks.includes(text)) return value as string
  const translated = t(key)
  if (translated && translated !== key) return translated
  return text || stocks[0] || ''
}

/**
 * A section setting whose English defaults each have their own string — the
 * contact form ships "Send us a message" in its templates and "Get in touch" in
 * its schema, and each must stay itself on an English theme.
 *
 *   - `''`: the merchant cleared it; stays `''` (the section hides it).
 *   - absent: `fallback` (a stock English string, or undefined for "none").
 *   - one of `stocks`' English strings: that string's locale entry.
 *   - anything else: the merchant's words, as written.
 */
export function stockCopy(
  value: unknown,
  stocks: Readonly<Record<string, string>>,
  fallback: string | undefined,
  t: (key: string) => string,
): string | undefined {
  if (value === '') return ''
  const text = typeof value === 'string' ? value.trim() : ''
  const english = text || fallback
  if (english === undefined) return undefined
  const key = stocks[english]
  if (!key) return value as string
  return localizedCopy(english, english, key, t)
}

/**
 * store-api's own policy titles (`graphql/storefront/data/shop.ts`
 * `POLICY_HANDLE`): a store has no per-policy title, so every policy arrives
 * with one of these English names whatever language its text is in.
 */
const STOCK_POLICY_TITLES: Record<string, string> = {
  'privacy-policy': 'Privacy Policy',
  'refund-policy': 'Refund Policy',
  'terms-of-service': 'Terms of Service',
  'shipping-policy': 'Shipping Policy',
  'contact-information': 'Contact Information',
  'legal-notice': 'Legal Notice',
  'subscription-policy': 'Subscription Policy',
}

/** A policy page's heading: the store's title, in the theme's language when it is the stock one. */
export function policyTitle(
  handle: string,
  storeTitle: unknown,
  t: (key: string) => string,
): string {
  const stock = STOCK_POLICY_TITLES[handle]
  if (!stock) return typeof storeTitle === 'string' ? storeTitle : ''
  return localizedCopy(storeTitle, stock, `policy.${handle}`, t)
}

/** nova's default account links (`config/settings.json` `accountExtraLinks`), by label. */
const STOCK_ACCOUNT_LINKS: Record<string, string> = {
  Orders: 'account.orders',
  Addresses: 'account.addresses',
}

/** An account-menu link label: the merchant's own, or nova's default in the theme's language. */
export function accountLinkLabel(label: string, t: (key: string) => string): string {
  const key = STOCK_ACCOUNT_LINKS[label.trim()]
  return key ? localizedCopy(label, label.trim(), key, t) : label
}
