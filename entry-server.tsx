// SSG server entry — renders the storefront to an HTML string at build time.
//
// The render itself (live GraphQL first, mock fixtures as the graceful
// fallback, plus the `state` snapshot the client hydrates from) lives in
// `@tanqory/theme-kit/app/ssg`. This file only supplies the theme's own globs,
// env and fixtures — the globs MUST resolve from this directory, and Vite
// inlines VITE_* into `import.meta.env` at the THEME's build, not the kit's.
import { createServerEntry } from '@tanqory/theme-kit/app/ssg'
import collections from './lib/collections.json'
import settings from './config/settings.json'
import locale from './locales/en.json'

/** `render(page)` → `{ html, state, head }` — the contract runtime/prerender.mjs calls. */
export const render = createServerEntry({
  env: import.meta.env,
  sections: import.meta.glob('./sections/*.tsx', { eager: true }),
  templates: import.meta.glob('./templates/*.json', { eager: true }),
  layouts: import.meta.glob('./layouts/*.tsx', { eager: true }),
  settings,
  locale,
  mockData: collections,
})
