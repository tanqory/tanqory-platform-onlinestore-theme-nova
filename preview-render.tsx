// SSR entry for the editor's "Add section" preview. Loaded via vite
// `ssrLoadModule` from the /__editor/preview-section middleware (see
// vite.config.ts). Renders ONE section to an HTML string — no Shell, no page
// routing, no client SPA — using synchronous MOCK data so the markup is instant
// (the standard fast preview). The live storefront still uses main.tsx.

import { renderSectionPreviewHTML, createMockData } from './lib/tanqory/index'
import mockCollections from './lib/collections.json'
import settings from './config/settings.json'
import locale from './locales/en.json'
import { fontStylesheetHref, resolveThemeVars, themeSettingsCss } from './lib/theme-settings'

const sections = import.meta.glob('./sections/*.tsx', { eager: true })
const data = createMockData(mockCollections)

// No layout renders here, so the layout's ThemeSettingsProvider never runs:
// prepend the same theme-settings stylesheet it would, so a previewed section
// shows the theme's colours and fonts rather than the tokens.css defaults.
// Mock data carries no Settings → Brand, so only theme settings apply.
const themeCss = themeSettingsCss(resolveThemeVars(settings))
const fontHref = fontStylesheetHref(settings)
const themeHead =
  (themeCss ? `<style id="tq-theme-settings">${themeCss}</style>` : '') +
  (fontHref ? `<link id="tq-theme-fonts" rel="stylesheet" href="${fontHref.replace(/&/g, '&amp;')}">` : '')

export function renderSection(
  type: string,
  settingsOverride?: Record<string, unknown>,
): string {
  return themeHead + renderSectionPreviewHTML({ sections, data, settings, locale }, type, settingsOverride)
}
