import { type DataApi } from './data';
type GlobMap = Record<string, unknown>;
export interface MountOptions {
    /** import.meta.glob('./sections/*.tsx', { eager: true }) — run in the THEME. */
    sections: GlobMap;
    /** import.meta.glob('./templates/*.json', { eager: true }). */
    pages: GlobMap;
    /** import.meta.glob('./layouts/*.tsx', { eager: true }) — optional. */
    shell?: GlobMap;
    /** Data source the theme provides (createMockData(...) or a live client). */
    data: DataApi;
    /** Global settings values (config/settings.json). */
    settings?: Record<string, unknown>;
    /** Locale strings (locales/<lang>.json). */
    locale?: Record<string, string>;
    /** Which page to render (default 'index'). */
    page?: string;
    /** Mount target id (default 'root'). */
    rootId?: string;
    /**
     * SWR refresh: the initial render uses `data` (the SSG snapshot — so
     * hydration matches the server markup by construction), then this runs once
     * after mount and the fresh result is swapped in. Return null/reject to keep
     * the snapshot data (e.g. the network is down).
     */
    revalidate?: () => Promise<DataApi | null>;
    /**
     * Force client rendering even when SSG markup exists in the root (wipe +
     * createRoot instead of hydrateRoot). Pass when the prerendered markup is
     * known NOT to match what the client will render — a different page than the
     * one that was prerendered, or no data snapshot to hydrate with — because
     * hydrating against mismatched markup throws React #418/#425.
     */
    forceClientRender?: boolean;
}
/**
 * Boot a theme. The theme's entry passes its globbed sections/templates/layouts
 * (so Vite resolves them relative to the theme) plus a data source. Everything
 * else — registry, tree rendering, providers — is the framework.
 */
export declare function mount(opts: MountOptions): void;
export {};
