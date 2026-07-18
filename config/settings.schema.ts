import { defineSettings } from '@tanqory/theme-kit'

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
 */
export default defineSettings({
  // ── Brand ────────────────────────────────────────────────────────────────
  shopName: {
    type: 'text',
    group: 'Brand',
    label: 'Shop name',
    default: '',
    info: 'Shown in the header when no logo is set. Leave empty to use the store brand logo/name from Settings → Brand.',
  },
  accent: {
    type: 'color',
    group: 'Brand',
    label: 'Accent color',
    default: '#0a0a0a',
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
})
