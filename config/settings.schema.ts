import { defineSettings, type AttrSpec } from '../lib/tanqory/index'
import { FONT_OPTIONS } from '../lib/theme-settings'

/** A theme setting: a theme-kit control plus the editor group it sits in. */
type ThemeSettingSpec = AttrSpec & { group: string }

/**
 * Theme settings schema — the typed, self-describing surface of everything a
 * merchant can configure theme-wide (as opposed to per-section `attributes`).
 *
 * This is the source of truth for the editor's "Theme settings" panel and for
 * `theme.manifest.json`. `config/settings.json` holds the *values*; this file
 * describes their **type, label, group, and default**, so:
 *   - the editor can render a real settings UI (not a blind JSON blob),
 *   - the AI generator knows what the theme exposes and what each control means,
 *   - a value can be validated against a declared type.
 *
 * Every key the theme actually reads (`settings.*` across layouts/components/
 * sections) is declared here — including the ones that used to live only as an
 * inline `settings.x || 'fallback'` in the code, invisible to the editor. Each
 * `default` matches the effective value the theme already produced, so making
 * them explicit changes nothing a shopper sees.
 *
 * Names follow the approved design package (`design/spec/global.json`). Every
 * Brand / Colour / font key defaults to '' — "not set": the storefront then
 * uses Settings → Brand where the store has a value, else the theme's own
 * token, which carries the design's default (checked by `pnpm check:design`).
 * A non-empty colour default would be written on every store and switch off
 * the automatic dark scheme. All of them are applied by lib/theme-settings.ts
 * and follow the editor's live preview (components/ThemeSettings.tsx).
 */
const schema: Record<string, ThemeSettingSpec> = {
  // ── Typography (design system) ───────────────────────────────────────────
  // The design asks for a font picker ("system + curated Google list"). The
  // platform vocabulary has no such field type, so it is a `select` over the
  // curated list in lib/theme-settings.ts, which also loads the stylesheet.
  headingFont: {
    type: 'select',
    group: 'Typography',
    label: 'Heading font',
    default: '',
    options: FONT_OPTIONS,
    info: 'Display, headings and the product title. Empty = Settings → Brand, else the theme font (Instrument Sans).',
  },
  bodyFont: {
    type: 'select',
    group: 'Typography',
    label: 'Body font',
    default: '',
    options: FONT_OPTIONS,
    info: 'Body, labels, buttons and navigation.',
  },
  typeScale: {
    type: 'select',
    group: 'Typography',
    label: 'Type scale',
    // Design: `compact | default | large`, "multiplies heading roles
    // ×0.9 / 1 / 1.1; body unchanged".
    default: 'default',
    options: [
      { value: 'compact', label: 'Compact' },
      { value: 'default', label: 'Default' },
      { value: 'large', label: 'Large' },
    ],
  },
  headingWeight: {
    type: 'select',
    group: 'Typography',
    label: 'Heading weight',
    default: 'medium',
    options: [
      { value: 'regular', label: 'Regular' },
      { value: 'medium', label: 'Medium' },
      { value: 'semibold', label: 'Semibold' },
    ],
  },
  buttonTextStyle: {
    type: 'select',
    group: 'Typography',
    label: 'Button text',
    // Design: `default | uppercase`; uppercase adds +0.06em tracking.
    default: 'default',
    options: [
      { value: 'default', label: 'Default' },
      { value: 'uppercase', label: 'Uppercase' },
    ],
  },

  // ── Colour (design system) ───────────────────────────────────────────────
  // Only Primary is the merchant's. Neutrals, feedback colours, borders and
  // overlay stay fixed so the page keeps its baseline whatever the brand hue.
  colorPrimary: {
    type: 'color',
    group: 'Colour',
    label: 'Primary (brand)',
    default: '',
    info: 'Buttons, focus ring, selected states and link hover. Empty = the primary colour from Settings → Brand. The label colour on it is chosen for AA contrast automatically.',
  },
  colorBackground: {
    type: 'color',
    group: 'Colour',
    label: 'Page background',
    default: '',
    info: 'Leave both Background and Text empty to keep the theme palette, including its dark mode.',
  },
  colorText: {
    type: 'color',
    group: 'Colour',
    label: 'Text',
    default: '',
    info: 'Secondary and muted text are derived from this.',
  },
  colorSecondarySurface: {
    type: 'color',
    group: 'Colour',
    label: 'Secondary surface',
    default: '',
    info: 'Media wells, skeletons and alternating section backgrounds.',
  },
  colorBorder: {
    type: 'color',
    group: 'Colour',
    label: 'Border',
    default: '',
  },
  colorSale: {
    type: 'color',
    group: 'Colour',
    label: 'Sale',
    default: '',
    info: 'Reserved for sale prices and the sale badge.',
  },

  // ── Layout (design system) ───────────────────────────────────────────────
  pageWidth: {
    type: 'select',
    group: 'Layout',
    label: 'Page width',
    default: 'wide',
    options: [
      { value: 'wide', label: 'Wide (1440)' },
      { value: 'standard', label: 'Standard (1200)' },
      { value: 'full', label: 'Full width' },
    ],
  },
  sectionSpacing: {
    type: 'select',
    group: 'Layout',
    label: 'Section spacing',
    default: 'medium',
    options: [
      { value: 'none', label: 'None' },
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
      { value: 'xlarge', label: 'Extra large' },
    ],
  },

  // ── Components (design system) ───────────────────────────────────────────
  buttonRadius: {
    type: 'select',
    group: 'Components',
    label: 'Button corners',
    default: 'small',
    // Design: 0 / 4 / 8 / 999. `medium` was missing, so the 8px rung the
    // radius ladder defines was unreachable from the editor.
    options: [
      { value: 'none', label: 'Square' },
      { value: 'small', label: 'Slightly rounded' },
      { value: 'medium', label: 'Rounded' },
      { value: 'pill', label: 'Pill' },
    ],
  },
  buttonBorder: {
    type: 'select',
    group: 'Components',
    label: 'Secondary button border',
    // Design: segmented `default | strong`, a border ROLE, not an on/off. A
    // boolean could not express the strong role at all.
    default: 'default',
    options: [
      { value: 'default', label: 'Default' },
      { value: 'strong', label: 'Strong' },
    ],
  },
  inputRadius: {
    type: 'select',
    group: 'Components',
    label: 'Input corners',
    default: 'small',
    options: [
      { value: 'none', label: 'Square' },
      { value: 'small', label: 'Slightly rounded' },
      { value: 'medium', label: 'Rounded' },
    ],
  },
  cardRadius: {
    type: 'select',
    group: 'Components',
    label: 'Card corners',
    default: 'small',
    options: [
      { value: 'none', label: 'Square' },
      { value: 'small', label: 'Slightly rounded' },
      { value: 'medium', label: 'Rounded' },
    ],
  },
  cardBorder: {
    type: 'boolean',
    group: 'Components',
    label: 'Outline cards',
    default: true,
    info: 'The approved system uses borders rather than shadows.',
  },
  cardHoverEffect: {
    type: 'select',
    group: 'Components',
    label: 'Card hover',
    // Design: `none | image-swap | zoom | subtle-lift`, default image-swap,
    // "falls back to zoom when no 2nd image". `border` was invented here and
    // the two image-led effects were missing.
    default: 'image-swap',
    options: [
      { value: 'none', label: 'None' },
      { value: 'image-swap', label: 'Show second image' },
      { value: 'zoom', label: 'Zoom image' },
      { value: 'subtle-lift', label: 'Subtle lift' },
    ],
  },
  badgeStyle: {
    type: 'select',
    group: 'Components',
    label: 'Badge treatment',
    // Design: `filled | outline` — a FILL, not a shape. Badge radius is fixed
    // at Small by the radius ladder and is not a merchant choice.
    default: 'filled',
    options: [
      { value: 'filled', label: 'Filled' },
      { value: 'outline', label: 'Outline' },
    ],
  },
  iconStyle: {
    type: 'select',
    group: 'Components',
    label: 'Icon style',
    // Design: `outline | filled`, "one family across the theme" — a FAMILY,
    // not a stroke weight. Stroke is fixed at 1.5px by the design.
    default: 'outline',
    options: [
      { value: 'outline', label: 'Outline' },
      { value: 'filled', label: 'Filled' },
    ],
  },
  motion: {
    type: 'select',
    group: 'Components',
    label: 'Motion',
    // Design: `standard | reduced`. `none` and `subtle` were extra rungs; the
    // design's `reduced` is what "removes transforms and autoplay".
    default: 'standard',
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'reduced', label: 'Reduced' },
    ],
    info: 'Reduced-motion preferences always win regardless of this setting.',
  },

  // ── Product media (design system) ────────────────────────────────────────
  productImageRatio: {
    type: 'select',
    group: 'Product media',
    label: 'Product image shape',
    default: 'portrait',
    options: [
      { value: 'adapt', label: 'Adapt to image' },
      { value: 'portrait', label: 'Portrait (4:5)' },
      { value: 'square', label: 'Square' },
      // Design: `landscape`. `tall` (3:4) was a fourth portrait rung the
      // design does not define, and left the theme with no wide frame at all.
      { value: 'landscape', label: 'Landscape (3:2)' },
    ],
  },
  productImageFit: {
    type: 'select',
    group: 'Product media',
    label: 'Product image fit',
    default: 'contain',
    options: [
      { value: 'contain', label: 'Fit whole product' },
      { value: 'cover', label: 'Fill and crop' },
    ],
  },
  showVendorGlobally: {
    type: 'boolean',
    group: 'Product media',
    label: 'Show vendor on product cards',
    default: false,
  },

  // ── Brand ────────────────────────────────────────────────────────────────
  logo: {
    type: 'image',
    group: 'Brand',
    label: 'Logo',
    default: '',
    info: 'Shown in the header. Leave empty to use the logo from Settings → Brand.',
  },
  shopName: {
    type: 'text',
    group: 'Brand',
    label: 'Shop name',
    default: '',
    placeholder: 'Store name',
    info: 'Shown in the header when there is no logo, and in the browser tab. Leave empty to use the store name.',
  },
  // Applied by main.tsx / entry-server.tsx through lib/theme-locale.ts: the
  // string map (locales/<code>.json) the theme's fixed interface words use
  // before a visitor picks a language. An AI build sets it to its brief's language.
  locale: {
    type: 'select',
    group: 'Brand',
    label: 'Theme language',
    default: '',
    options: [
      { value: '', label: 'English' },
      { value: 'th', label: 'ไทย (Thai)' },
    ],
    info: 'The language of the theme’s own words — account menu, contact form, cart and policy headings. Your own text is never changed.',
  },
  // Not one of the design's 25 global props: a second brand slot for primary
  // (solid) buttons, kept as a Nova extension — see docs/DESIGN-GAPS.md.
  accent: {
    type: 'color',
    group: 'Colour',
    label: 'Accent color',
    default: '',
    info: 'Primary buttons and highlights. Leave empty for the theme default.',
  },

  // ── Header & navigation ─────────────────────────────────────────────────
  headerMenuHandle: {
    type: 'menu',
    group: 'Header',
    label: 'Header menu',
    default: 'main-menu',
  },
  enableSpaNavigation: {
    type: 'boolean',
    group: 'Header',
    label: 'Instant page transitions (SPA)',
    default: true,
  },
  enableAccountDropdown: {
    type: 'boolean',
    group: 'Header',
    label: 'Show account dropdown',
    default: true,
  },
  enableMobileNavDrawer: {
    type: 'boolean',
    group: 'Header',
    label: 'Mobile navigation drawer',
    default: true,
  },
  mobileNavHeading: {
    type: 'text',
    group: 'Header',
    label: 'Mobile menu heading',
    default: 'Menu',
  },
  mobileNavWidth: {
    type: 'text',
    group: 'Header',
    label: 'Mobile drawer width',
    default: '320px',
  },

  // ── Search ───────────────────────────────────────────────────────────────
  enableSearchModal: {
    type: 'boolean',
    group: 'Search',
    label: 'Enable search modal',
    default: true,
  },
  searchPlaceholder: {
    type: 'text',
    group: 'Search',
    label: 'Search placeholder',
    default: 'Search products…',
  },
  searchCtaLabel: {
    type: 'text',
    group: 'Search',
    label: 'See-all-results label',
    default: 'See all results →',
  },
  searchModalWidth: {
    type: 'text',
    group: 'Search',
    label: 'Search modal width',
    default: '640px',
  },
  searchDebounceMs: {
    type: 'number',
    group: 'Search',
    label: 'Search debounce (ms)',
    default: 250,
  },
  searchMaxResults: {
    type: 'number',
    group: 'Search',
    label: 'Max quick results',
    default: 6,
  },

  // ── Cart ─────────────────────────────────────────────────────────────────
  enableCartDrawer: {
    type: 'boolean',
    group: 'Cart',
    label: 'Enable cart drawer',
    default: true,
  },
  cartDrawerWidth: {
    type: 'text',
    group: 'Cart',
    label: 'Cart drawer width',
    default: '420px',
  },
  cartEmptyHeading: {
    type: 'text',
    group: 'Cart',
    label: 'Empty-cart heading',
    default: 'Your cart is empty',
  },
  cartEmptySubtext: {
    type: 'text',
    group: 'Cart',
    label: 'Empty-cart subtext',
    default: 'Add a few things to get started.',
  },
  cartCheckoutLabel: {
    type: 'text',
    group: 'Cart',
    label: 'Checkout button label',
    default: 'Checkout',
  },
  cartViewLabel: {
    type: 'text',
    group: 'Cart',
    label: 'View-full-cart label',
    default: 'View full cart',
  },

  // ── Account ──────────────────────────────────────────────────────────────
  // All account-menu copy defaults to '' — the AccountMenu component then picks
  // the right logged-in vs logged-out wording itself (overlays/AccountMenu.tsx).
  accountLoggedIn: {
    type: 'boolean',
    group: 'Account',
    label: 'Preview signed-in state',
    default: false,
    info: 'Editor preview only — the live storefront reflects the real session.',
  },
  accountHeading: {
    type: 'text',
    group: 'Account',
    label: 'Account menu heading',
    default: '',
    placeholder: 'My account / Welcome',
  },
  accountSubtext: {
    type: 'text',
    group: 'Account',
    label: 'Account menu subtext',
    default: '',
  },
  accountPrimaryLabel: {
    type: 'text',
    group: 'Account',
    label: 'Primary action label',
    default: '',
    placeholder: 'View orders / Sign in',
  },
  accountPrimaryHref: {
    type: 'url',
    group: 'Account',
    label: 'Primary action link',
    default: '',
  },
  accountSecondaryLabel: {
    type: 'text',
    group: 'Account',
    label: 'Secondary action label',
    default: '',
  },
  accountSecondaryHref: {
    type: 'url',
    group: 'Account',
    label: 'Secondary action link',
    default: '',
  },
  accountExtraLinks: {
    type: 'textarea',
    group: 'Account',
    label: 'Extra account links',
    default: 'Orders|/account/orders\nAddresses|/account/addresses',
    info: 'One per line, "Label|/path".',
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footerShopMenuHandle: {
    type: 'menu',
    group: 'Footer',
    label: 'Footer — Shop menu',
    default: 'footer-shop',
  },
  footerHelpMenuHandle: {
    type: 'menu',
    group: 'Footer',
    label: 'Footer — Help menu',
    default: 'footer-help',
  },
  footerCompanyMenuHandle: {
    type: 'menu',
    group: 'Footer',
    label: 'Footer — Company menu',
    default: 'footer-company',
  },
  footerTagline: {
    type: 'textarea',
    group: 'Footer',
    label: 'Footer tagline',
    default: '',
    info: 'Leave empty to use the store description.',
  },
  showPoweredBy: {
    type: 'boolean',
    group: 'Footer',
    label: 'Show "Made with Tanqory"',
    default: true,
  },
  poweredByLabel: {
    type: 'text',
    group: 'Footer',
    label: '"Powered by" label',
    default: 'Made with Tanqory',
  },
}

export default defineSettings(schema)
