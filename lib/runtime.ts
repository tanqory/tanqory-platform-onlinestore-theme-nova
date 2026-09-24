/**
 * Which plane is this render on?
 *
 * Three states the theme must keep apart — they used to be re-derived inline in
 * `main.tsx`, `layouts/layout.tsx` and `sections/ProductDetails.tsx` with three
 * slightly different expressions, which is how "editor convenience" behaviour
 * (a section-setting product override, mock fixtures) leaked onto the published
 * storefront.
 *
 *   storefront  — a real shopper on a published store. Live data, URL is
 *                 canonical, no fixtures, no placeholders.
 *   editor      — the Studio preview iframe. Overrides and placeholders are
 *                 correct here; SPA routing and analytics are not.
 *   offline     — `pnpm dev` with no backend configured. Mock fixtures, clearly
 *                 marked, never reachable from a configured build.
 *
 * `isEditorPreview()` reads the URL, so call it inside render/effects, not at
 * module scope (the value differs between SSG and the browser).
 */
import { isEditorPreview as isEditorPreviewAt } from './live-settings'

/**
 * True inside the Studio editor's preview iframe: the dedicated `preview-`
 * host, or `?preview` on a dev build (the laptop loop). The same rule
 * `components/ThemeSettings.tsx` applies before accepting live settings, so a
 * published store never enters editor mode because a visitor's URL carries
 * `?preview` — that flag used to switch a live store to fixtures, silence its
 * analytics and disable its navigation.
 */
export function isEditorPreview(): boolean {
  if (typeof window === 'undefined') return false
  return isEditorPreviewAt(window.location, Boolean(import.meta.env.DEV))
}

/**
 * True when this bundle was built against a real backend.
 *
 * The mirror of the check `bootData()` makes: both `VITE_TANQORY_BACKEND` and
 * `VITE_TANQORY_STORE_ID` must be present for live data to even be attempted.
 * Anything else is an offline/mock build.
 */
export function isConfiguredForLiveData(): boolean {
  const env = import.meta.env as ImportMetaEnv & {
    VITE_TANQORY_BACKEND?: string
    VITE_TANQORY_STORE_ID?: string
  }
  return Boolean(env.VITE_TANQORY_BACKEND && env.VITE_TANQORY_STORE_ID)
}

/**
 * True when mock fixtures are an acceptable data source for this render.
 *
 * Deliberately NOT "the live fetch failed" — a configured storefront that
 * cannot reach its backend must surface an error, not quietly serve example
 * products at example prices. Mock data is for the offline dev server and for
 * the editor previewing a theme that has no store attached.
 */
export function isMockDataAllowed(): boolean {
  return !isConfiguredForLiveData() || isEditorPreview()
}
