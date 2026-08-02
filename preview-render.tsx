// SSR entry for the editor's "Add section" preview. Loaded via vite
// `ssrLoadModule` from the /__editor/preview-section middleware (see the
// vite-preset in @tanqory/theme-kit), and prebuilt to dist-preview/ by the
// runtime entrypoint. Renders ONE section to an HTML string — no Shell, no page
// routing, no client SPA — using synchronous MOCK data so the markup is instant.
// The live storefront still uses main.tsx.
import { createSectionPreview } from '@tanqory/theme-kit/app/ssg'
import mockCollections from './lib/collections.json'
import settings from './config/settings.json'
import locale from './locales/en.json'

/** `renderSection(type, settings?)` — the contract runtime/serve.mjs calls. */
export const renderSection = createSectionPreview({
  sections: import.meta.glob('./sections/*.tsx', { eager: true }),
  settings,
  locale,
  mockData: mockCollections,
})
