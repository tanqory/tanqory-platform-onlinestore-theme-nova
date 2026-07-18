// SSR entry for the editor's "Add section" preview. Loaded via vite
// `ssrLoadModule` from the /__editor/preview-section middleware (see
// vite.config.ts). Renders ONE section to an HTML string — no Shell, no page
// routing, no client SPA — using synchronous MOCK data so the markup is instant
// (the Shopify-style fast preview). The live storefront still uses main.tsx.

import { renderSectionPreviewHTML, createMockData } from '@tanqory/theme-kit'
import mockCollections from './lib/collections.json'
import settings from './config/settings.json'
import locale from './locales/en.json'

const sections = import.meta.glob('./sections/*.tsx', { eager: true })
const data = createMockData(mockCollections)

export function renderSection(
  type: string,
  settingsOverride?: Record<string, unknown>,
): string {
  return renderSectionPreviewHTML({ sections, data, settings, locale }, type, settingsOverride)
}
