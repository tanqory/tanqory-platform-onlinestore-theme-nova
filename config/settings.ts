import { defineSettings } from '@tanqory/theme-kit'

/**
 * Global theme settings SCHEMA (dev-authored, typed). Declares the controls the
 * editor shows under "Theme settings". The chosen VALUES live in settings.json.
 */
export default defineSettings({
  // NOTE: store NAME, languages, and countries are STORE data (Dashboard →
  // Settings → General / Markets), read via data.shop / data.localization — NOT
  // theme config. Only theme DESIGN choices live here.
  accent: { type: 'color', default: '#0a0a0a', label: 'Accent color' },
  footerTagline: { type: 'text', label: 'Footer tagline (blank = store description)' },
  showPoweredBy: { type: 'boolean', default: true, label: 'Show footer credit' },
  poweredByLabel: { type: 'text', default: 'Made with Tanqory', label: 'Footer credit text' },

  // Menu wiring — each slot points at a Menu handle the merchant has created
  // in admin (Online store → Navigation). The storefront looks the handle up
  // via the `menu(handle:)` GraphQL query; if a handle is left blank OR no
  // such menu exists, the layout falls back to a hardcoded sensible list
  // (so a brand-new store still renders something).
  headerMenuHandle: {
    type: 'text',
    default: 'main-menu',
    label: 'Header menu handle',
  },
  footerShopMenuHandle: {
    type: 'text',
    default: 'footer-shop',
    label: 'Footer · Shop menu handle',
  },
  footerHelpMenuHandle: {
    type: 'text',
    default: 'footer-help',
    label: 'Footer · Help menu handle',
  },
  footerCompanyMenuHandle: {
    type: 'text',
    default: 'footer-company',
    label: 'Footer · Company menu handle',
  },

  // SPA navigation — intercept internal `<a>` clicks and update the body
  // template in place instead of a full page reload. Cuts perceived nav time
  // from cold-start seconds to a few ms. Turn off if a section relies on
  // browser load events the client-side router skips.
  enableSpaNavigation: { type: 'boolean', default: true, label: 'Enable SPA navigation' },

  // Overlay behaviour — flip these off to fall back to the legacy "navigate
  // to /search, /cart, /account" UX. Default on for the pro-grade flow.
  enableSearchModal: { type: 'boolean', default: true, label: 'Open Search as overlay' },
  enableCartDrawer: { type: 'boolean', default: true, label: 'Open Cart as slide-over' },
  enableAccountDropdown: {
    type: 'boolean',
    default: true,
    label: 'Open Account as dropdown',
  },
  enableMobileNavDrawer: {
    type: 'boolean',
    default: true,
    label: 'Show hamburger + mobile nav drawer',
  },

  // Search modal tuning
  searchPlaceholder: { type: 'text', default: 'Search products…', label: 'Search placeholder' },
  searchCtaLabel: {
    type: 'text',
    default: 'See all results →',
    label: 'Search "all results" link label',
  },
  searchModalWidth: { type: 'text', default: '640px', label: 'Search modal max width' },
  searchDebounceMs: { type: 'number', default: 250, label: 'Search debounce (ms)' },
  searchMaxResults: { type: 'number', default: 6, label: 'Search max suggestions' },

  // Cart drawer tuning
  cartDrawerWidth: { type: 'text', default: '420px', label: 'Cart drawer max width' },
  cartEmptyHeading: {
    type: 'text',
    default: 'Your cart is empty',
    label: 'Cart empty heading',
  },
  cartEmptySubtext: {
    type: 'textarea',
    default: 'Add a few things to get started.',
    label: 'Cart empty subtext',
  },
  cartCheckoutLabel: { type: 'text', default: 'Checkout', label: 'Cart checkout label' },
  cartViewLabel: { type: 'text', default: 'View full cart', label: 'Cart "view full" label' },

  // Account dropdown tuning
  accountLoggedIn: {
    type: 'boolean',
    default: false,
    label: 'Render account as logged-in (preview)',
  },
  accountHeading: { type: 'text', label: 'Account heading override' },
  accountSubtext: { type: 'textarea', label: 'Account subtext override' },
  accountPrimaryLabel: { type: 'text', label: 'Account primary action label' },
  accountPrimaryHref: { type: 'url', label: 'Account primary action link' },
  accountSecondaryLabel: { type: 'text', label: 'Account secondary action label' },
  accountSecondaryHref: { type: 'url', label: 'Account secondary action link' },
  accountExtraLinks: {
    type: 'textarea',
    default: 'Orders|/account/orders\nAddresses|/account/addresses',
    label: 'Account extra links (Label|/path per line)',
  },

  // Mobile nav drawer tuning
  mobileNavWidth: { type: 'text', default: '320px', label: 'Mobile nav width' },
  mobileNavHeading: { type: 'text', default: 'Menu', label: 'Mobile nav heading' },
})
