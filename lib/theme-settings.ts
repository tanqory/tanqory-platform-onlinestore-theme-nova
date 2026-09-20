/**
 * Apply the merchant's global theme settings to the token layer.
 *
 * The approved configuration API is SEMANTIC — a merchant picks
 * `buttonRadius: 'pill'`, never `border-radius: 19px`. This module is the one
 * place that turns those semantic choices into the design system's own tokens,
 * so a setting can never introduce a value the system does not have.
 *
 * Written to the root element at boot, after hydration, exactly like
 * `applyBrandFonts` — so there is no server/client markup mismatch, and a store
 * that has configured nothing gets the approved defaults from `tokens.css`
 * untouched.
 */

type Settings = Record<string, unknown>

const str = (s: Settings, k: string): string | undefined => {
  const v = s[k]
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
}

/** Semantic preset → the token it resolves to. Unknown values are ignored. */
const MAPS: Record<string, { prop: string; values: Record<string, string> }> = {
  pageWidth: {
    prop: '--container-wide',
    values: {
      wide: '1440px',
      standard: '1200px',
      full: '100vw',
    },
  },
  sectionSpacing: {
    prop: '--section-pad-y',
    values: {
      none: 'var(--section-none)',
      small: 'var(--section-sm)',
      medium: 'var(--section-md)',
      large: 'var(--section-lg)',
      xlarge: 'var(--section-xl)',
    },
  },
  buttonRadius: {
    prop: '--btn-radius',
    values: {
      none: 'var(--radius-none)',
      small: 'var(--radius-sm)',
      medium: 'var(--radius-md)',
      pill: 'var(--radius-pill)',
    },
  },
  inputRadius: {
    prop: '--input-radius',
    values: {
      none: 'var(--radius-none)',
      small: 'var(--radius-sm)',
      medium: 'var(--radius-md)',
    },
  },
  cardRadius: {
    prop: '--card-radius',
    values: {
      none: 'var(--radius-none)',
      small: 'var(--radius-sm)',
      medium: 'var(--radius-md)',
    },
  },
  headingWeight: {
    prop: '--weight-heading',
    values: { regular: '400', medium: '500', semibold: '600' },
  },
  productImageRatio: {
    prop: '--ratio-product',
    values: {
      portrait: '4 / 5',
      square: '1 / 1',
      landscape: '3 / 2',
      // `adapt` deliberately has no token — the card omits aspect-ratio instead.
    },
  },
}

/** Colour settings write straight to their role. */
const COLORS: Record<string, string> = {
  colorPrimary: '--color-brand',
  colorBackground: '--color-bg',
  colorText: '--color-fg',
  colorSecondarySurface: '--color-bg-muted',
  colorBorder: '--color-border',
  colorSale: '--color-sale',
}

/** Motion presets scale the three durations together. */
const MOTION: Record<string, [string, string, string]> = {
  // Design: `standard | reduced`. Reduced removes transforms and autoplay; the
  // OS preference always wins on top of this (see tokens.css).
  standard: ['120ms', '200ms', '320ms'],
  reduced: ['0ms', '0ms', '0ms'],
}

export function applyThemeSettings(settings: Settings): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const set = (prop: string, value: string): void => root.style.setProperty(prop, value)

  // Fonts. `bodyFont` falls back to the heading font, matching the design's
  // one-family default.
  const heading = str(settings, 'headingFont')
  const body = str(settings, 'bodyFont') ?? heading
  if (heading) set('--font-display', heading)
  if (body) set('--font-body', body)

  for (const [key, prop] of Object.entries(COLORS)) {
    const v = str(settings, key)
    if (v) set(prop, v)
  }

  for (const [key, { prop, values }] of Object.entries(MAPS)) {
    const v = str(settings, key)
    if (v && values[v]) set(prop, values[v])
  }

  const motion = str(settings, 'motion')
  if (motion && MOTION[motion]) {
    const [fast, base, slow] = MOTION[motion]!
    set('--duration-fast', fast)
    set('--duration-base', base)
    set('--duration-slow', slow)
  }

  // Booleans and enums that switch behaviour rather than a value are exposed as
  // data attributes so CSS can branch without a second source of truth.
  const flag = (key: string, attr: string): void => {
    const v = settings[key]
    if (typeof v === 'boolean') root.dataset[attr] = String(v)
    else if (typeof v === 'string' && v) root.dataset[attr] = v
  }
  flag('cardBorder', 'cardBorder')
  flag('buttonBorder', 'buttonBorder')
  flag('cardHoverEffect', 'cardHover')
  flag('badgeStyle', 'badgeStyle')
  flag('buttonTextStyle', 'buttonText')
  flag('typeScale', 'typeScale')
  flag('productImageFit', 'productFit')
  flag('iconStyle', 'iconStyle')
}
