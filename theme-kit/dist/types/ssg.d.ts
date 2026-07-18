import type { MountOptions } from './mount';
/** Render a theme page to an HTML string (same tree mount() renders client-side). */
export declare function renderStorefrontHTML(opts: MountOptions): string;
/**
 * Render ONE section to an HTML string for the editor's "Add section" preview —
 * no Shell/layout, no page routing, no client SPA boot. This is the fast path
 * (Shopify-style): the runtime server-renders just the requested section with
 * the theme's providers + data and returns instant HTML. Block-composed sections
 * are seeded with their preset blocks so they aren't empty.
 */
export declare function renderSectionPreviewHTML(opts: Pick<MountOptions, 'sections' | 'data' | 'settings' | 'locale'>, type: string, settingsOverride?: Record<string, unknown>): string;
