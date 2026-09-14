/**
 * Theme settings → what the storefront actually renders.
 *
 * `config/settings.json` holds the merchant's theme-wide values (edited in the
 * studio's Theme panel, schema in `config/settings.schema.ts`). Until now nova
 * declared `accent` but nothing read it, so a merchant could change it and the
 * storefront never moved. This module is the one place that turns those values
 * into nova's own design tokens (`assets/tokens.css`), so every section — and
 * every AI section, whose `--tq-*` tokens alias nova's variables — follows them.
 *
 * Precedence, for every value: a theme setting → the store's Settings → Brand →
 * the theme's own default (tokens.css / ai-tokens.css). An empty theme setting
 * means "not set", never "blank".
 *
 * Pure: no React, no DOM, no theme-kit import, so the layout (SSR + client) and
 * the section-preview renderer share it, and it is unit-tested directly
 * (lib/theme-settings.test.ts).
 */

export type ThemeSettings = Record<string, unknown>

/** The slice of `shop.brand` (Settings → Brand) that theme settings fall back to. */
export interface BrandFallback {
  logo?: { url?: string | null; altText?: string | null } | null
  colors?: {
    primary?: Array<{ background?: string | null; foreground?: string | null }> | null
  } | null
  /** Family names in priority order: [0] headings, [1] body. */
  fonts?: Array<string | null> | null
}

/**
 * Message the studio's Theme panel posts into the editor preview while a
 * merchant edits, so the canvas restyles before Save (Save rebuilds the theme).
 * `settings: null` drops the live values and returns to the built ones.
 */
export const LIVE_SETTINGS_MESSAGE = 'tq:theme-settings'

/**
 * The value every nova install shipped for `accent` before anything read it.
 * Nothing ever rendered it, so no merchant has seen it take effect — and it
 * equals nova's light-scheme text colour. Applying it now would paint primary
 * buttons near-black for visitors on a dark OS scheme on every existing store,
 * so it is read as "not set". A merchant who wants that exact black button can
 * pick any other near-black.
 */
export const LEGACY_ACCENT_PLACEHOLDER = '#0a0a0a'

type FontCategory = 'sans' | 'serif'

/** Google Fonts families offered by the Heading / Body font settings. */
export const FONT_CHOICES: ReadonlyArray<{ family: string; category: FontCategory }> = [
  { family: 'Inter', category: 'sans' },
  { family: 'DM Sans', category: 'sans' },
  { family: 'Work Sans', category: 'sans' },
  { family: 'Poppins', category: 'sans' },
  { family: 'Montserrat', category: 'sans' },
  { family: 'Roboto', category: 'sans' },
  { family: 'Open Sans', category: 'sans' },
  { family: 'Lato', category: 'sans' },
  { family: 'Nunito Sans', category: 'sans' },
  { family: 'Space Grotesk', category: 'sans' },
  { family: 'Noto Sans Thai', category: 'sans' },
  { family: 'IBM Plex Sans Thai', category: 'sans' },
  { family: 'Prompt', category: 'sans' },
  { family: 'Kanit', category: 'sans' },
  { family: 'Sarabun', category: 'sans' },
  { family: 'Playfair Display', category: 'serif' },
  { family: 'DM Serif Display', category: 'serif' },
  { family: 'Cormorant Garamond', category: 'serif' },
  { family: 'EB Garamond', category: 'serif' },
  { family: 'Libre Baskerville', category: 'serif' },
  { family: 'Lora', category: 'serif' },
  { family: 'Merriweather', category: 'serif' },
]

/** `select` options for the font settings; '' keeps Settings → Brand / the theme default. */
export const FONT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Default (Settings → Brand, else theme font)' },
  ...FONT_CHOICES.map((f) => ({ value: f.family, label: f.family })),
]

const SANS_STACK = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
const SERIF_STACK = "Georgia, 'Times New Roman', Times, serif"

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const FUNCTIONAL = /^(?:rgb|rgba|hsl|hsla)\(\s*[0-9.%,\s/+-]+(?:deg)?[0-9.%,\s/+-]*\)$/i

/**
 * A colour safe to write into a stylesheet, or null. Hex and rgb()/hsl() only —
 * the value lands inside a `<style>` element, so anything that could close a
 * declaration or the element is refused rather than escaped.
 */
export function normalizeColor(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  if (HEX.test(v)) return v.toLowerCase()
  if (FUNCTIONAL.test(v)) return v
  return null
}

/** A font family name safe to quote in CSS and put in a Google Fonts URL, or null. */
export function normalizeFontFamily(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim().replace(/\s+/g, ' ')
  return /^[A-Za-z0-9][A-Za-z0-9 -]{0,63}$/.test(v) ? v : null
}

/** An image URL the header may render: absolute http(s), protocol-relative, or root-relative. */
export function normalizeImageUrl(value: unknown): string | null {
  const raw =
    typeof value === 'string'
      ? value
      : value && typeof value === 'object' && typeof (value as { url?: unknown }).url === 'string'
        ? (value as { url: string }).url
        : null
  if (raw === null) return null
  const v = raw.trim()
  if (!v || /[\s"'<>]/.test(v)) return null
  return /^https?:\/\//i.test(v) || /^\/\/[^/]/.test(v) || /^\/[^/]/.test(v) ? v : null
}

function hexToRgb(hex: string): [number, number, number] | null {
  if (!HEX.test(hex)) return null
  let h = hex.slice(1)
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

/** The text colour (white or nova's near-black) that reads best on `background`. */
export function readableTextOn(background: string): string {
  const rgb = hexToRgb(background)
  if (!rgb) return '#ffffff'
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  // Contrast against white vs against #0a0a0a (luminance ≈ 0.003).
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.053 ? '#ffffff' : '#0a0a0a'
}

function fontStack(family: string): string {
  const category = FONT_CHOICES.find((f) => f.family.toLowerCase() === family.toLowerCase())?.category
  return `"${family}", ${category === 'serif' ? SERIF_STACK : SANS_STACK}`
}

/** Heading + body families after precedence (theme setting → Settings → Brand). */
export function resolveFonts(
  settings: ThemeSettings,
  brand?: BrandFallback | null,
): { heading: string | null; body: string | null } {
  const brandFonts = (brand?.fonts ?? []).map(normalizeFontFamily).filter((f): f is string => !!f)
  return {
    heading: normalizeFontFamily(settings.fontHeading) ?? brandFonts[0] ?? null,
    body: normalizeFontFamily(settings.fontBody) ?? brandFonts[1] ?? brandFonts[0] ?? null,
  }
}

/**
 * The CSS custom properties the settings set on the root element. A key is
 * present only when a value was chosen, so an untouched store keeps every
 * tokens.css default — including nova's automatic dark scheme.
 */
export function resolveThemeVars(
  settings: ThemeSettings,
  brand?: BrandFallback | null,
): Record<string, string> {
  const vars: Record<string, string> = {}

  // Brand colour — theme setting, else Settings → Brand primary.
  const themeBrand = normalizeColor(settings.colorBrand)
  const brandPrimary = brand?.colors?.primary?.[0]
  const brandColor = themeBrand ?? normalizeColor(brandPrimary?.background)
  if (brandColor) {
    vars['--color-brand'] = brandColor
    vars['--color-brand-contrast'] =
      (!themeBrand && normalizeColor(brandPrimary?.foreground)) || readableTextOn(brandColor)
  }

  // Accent — primary (solid) buttons and highlights.
  const accent = normalizeColor(settings.accent)
  if (accent && accent !== LEGACY_ACCENT_PLACEHOLDER) {
    vars['--color-accent'] = accent
    vars['--color-button'] = accent
    vars['--color-button-text'] = readableTextOn(accent)
    vars['--color-button-hover'] = `color-mix(in srgb, ${accent} 85%, #000000)`
  }

  // Background + text — always written as a pair, derived into nova's surface
  // palette, so a chosen text colour is never paired with the dark scheme's
  // background (or the reverse). The inverse pair (--color-fg-inverse /
  // --color-bg-inverse) is left alone on purpose: nova uses it for text over
  // imagery (hero, slideshow) and for the footer, where its white-on-near-black
  // reads correctly whatever the page palette is. Deriving it from a dark page
  // background puts dark headings on dark hero images.
  const bgIn = normalizeColor(settings.colorBackground)
  const fgIn = normalizeColor(settings.colorText)
  if (bgIn || fgIn) {
    const bg = bgIn ?? '#ffffff'
    const fg = fgIn ?? '#0a0a0a'
    Object.assign(vars, {
      '--color-bg': bg,
      '--color-bg-alt': `color-mix(in srgb, ${fg} 3%, ${bg})`,
      '--color-bg-muted': `color-mix(in srgb, ${fg} 6%, ${bg})`,
      '--color-bg-elevated': bg,
      '--color-fg': fg,
      '--color-fg-muted': `color-mix(in srgb, ${fg} 68%, ${bg})`,
      '--color-fg-subtle': `color-mix(in srgb, ${fg} 48%, ${bg})`,
      '--color-border': `color-mix(in srgb, ${fg} 10%, transparent)`,
      '--color-border-strong': `color-mix(in srgb, ${fg} 18%, transparent)`,
      '--header-bg': `color-mix(in srgb, ${bg} 86%, transparent)`,
    })
  }

  // Fonts — theme setting, else Settings → Brand fonts.
  const { heading, body } = resolveFonts(settings, brand)
  if (heading) vars['--font-display'] = fontStack(heading)
  if (body) vars['--font-body'] = fontStack(body)

  return vars
}

/**
 * The stylesheet text for {@link resolveThemeVars}, or '' when nothing is set.
 *
 * `:root:root` outranks both tokens.css / ai-tokens.css (`:root`) and nova's
 * dark-scheme media rule (`:root:not([data-scheme])`), so a merchant's choice
 * wins over the theme default it replaces. A section that sets
 * `[data-scheme]` on itself still re-scopes its own subtree.
 */
export function themeSettingsCss(vars: Record<string, string>): string {
  const body = Object.entries(vars)
    // Defence in depth: every value is built from a normalized input, but this
    // text is injected into a <style> element, so nothing structural may pass.
    .filter(([k, v]) => /^--[a-z0-9-]+$/.test(k) && !/[<>{};\\]/.test(v))
    .map(([k, v]) => `${k}:${v};`)
    .join('')
  return body ? `:root:root{${body}}` : ''
}

/** Google Fonts stylesheet for the resolved families, or null when none are set. */
export function fontStylesheetHref(settings: ThemeSettings, brand?: BrandFallback | null): string | null {
  const { heading, body } = resolveFonts(settings, brand)
  const families = Array.from(new Set([heading, body].filter((f): f is string => !!f)))
  if (!families.length) return null
  const query = families
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${query}&display=swap`
}

/**
 * The header logo image: the theme's own logo, else the Settings → Brand logo,
 * else null (the header then shows the shop name as text).
 */
export function resolveLogo(
  settings: ThemeSettings,
  brand?: BrandFallback | null,
): { url: string; altText: string | null } | null {
  const themeLogo = normalizeImageUrl(settings.logo)
  if (themeLogo) return { url: themeLogo, altText: null }
  const brandLogo = normalizeImageUrl(brand?.logo?.url)
  if (brandLogo) return { url: brandLogo, altText: brand?.logo?.altText ?? null }
  return null
}
