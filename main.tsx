// Theme entry.
//
// All storefront plumbing — routing, template variants, SEO head, brand fonts,
// locale/country, live-vs-mock data, deterministic hydration and the route
// customer events — lives in `@tanqory/theme-kit/app` and is shared by every
// Tanqory theme. This file only supplies what MUST come from the theme itself:
//
//   • the `import.meta.glob` calls (they resolve relative to THIS directory)
//   • `import.meta.env` (Vite inlines VITE_* at the THEME's build, not the kit's)
//   • the theme's settings, offline fixtures and stylesheet
//
// Live-vs-mock is chosen from the Vite build-time env vars:
//
//   VITE_TANQORY_BACKEND          → https://api-do-sgp1.tanqory.com (prod)
//                                   https://dev-api-do-sgp1.tanqory.com (dev)
//   VITE_TANQORY_STORE_ID         → the store's UUID
//   VITE_TANQORY_STOREFRONT_TOKEN → publishable storefront key (safe to ship)
//
// Either ALL three are set (→ live data) or none are (→ mock data with the
// bundled lib/collections.json fixtures).

import { createStorefrontEntry } from '@tanqory/theme-kit/app'
import './assets/styles.css'
import mockCollections from './lib/collections.json'
import settings from './config/settings.json'

createStorefrontEntry({
  env: import.meta.env,
  sections: import.meta.glob('./sections/*.tsx', { eager: true }),
  templates: import.meta.glob('./templates/*.json', { eager: true }),
  layouts: import.meta.glob('./layouts/*.tsx', { eager: true }),
  locales: import.meta.glob('./locales/*.json', { eager: true }),
  settings,
  mockData: mockCollections,
  name: 'nova',
})
