import { type ReactNode } from 'react';
import { type StorefrontExtensions } from './storefront';
export interface Money {
    amount: string;
    currencyCode: string;
}
export interface ProductOption {
    name: string;
    values: string[];
}
export interface ImageRef {
    url: string;
    altText?: string;
}
/** SEO snapshot (Product/Page/Article). */
export interface Seo {
    title?: string | null;
    description?: string | null;
    keywords?: string[] | null;
}
/** Per-variant cart quantity bounds (wholesale / case-of-N). Storefront cart enforces these. */
export interface QuantityRule {
    minimum: number;
    maximum: number | null;
    increment: number;
}
/** Per-unit pricing ("$2.50 / 100ml"). */
export interface UnitPriceMeasurement {
    measuredType: string;
    quantityValue: number;
    quantityUnit: string;
    referenceValue: number;
    referenceUnit: string;
}
/** Pickup / in-store stock for one location. */
export interface StoreAvailability {
    available: boolean;
    quantityAvailable: number;
    pickUpTime?: string | null;
    location: {
        id: string;
        name: string;
    };
}
export interface SellingPlanOption {
    name: string;
    value: string;
}
export interface SellingPlan {
    id: string;
    name: string;
    description?: string | null;
    recurringDeliveries: boolean;
    options: SellingPlanOption[];
}
export interface SellingPlanGroup {
    name: string;
    appName?: string | null;
    options: Array<{
        name: string;
        values: string[];
    }>;
    sellingPlans: SellingPlan[];
}
export interface ProductVariant {
    id: string;
    title: string;
    price: Money;
    /** "Was" price — present when the variant is on sale (compareAtPrice > price). */
    compareAtPrice?: Money | null;
    availableForSale: boolean;
    selectedOptions?: {
        name: string;
        value: string;
    }[];
    image?: ImageRef | null;
    /** Stock-keeping unit. Only after `fetchProduct()`. */
    sku?: string | null;
    /** Barcode (ISBN, UPC, GTIN…). Only after `fetchProduct()`. */
    barcode?: string | null;
    /** On-hand stock for this variant (Shopify `inventory_quantity`). */
    inventoryQuantity?: number | null;
    /** `DENY` (stop selling at 0) or `CONTINUE` (oversell) — Shopify `inventory_policy`. */
    inventoryPolicy?: 'DENY' | 'CONTINUE' | null;
    /** Whether the variant needs shipping (physical vs digital/service). */
    requiresShipping?: boolean | null;
    /** Whether tax applies to the variant. */
    taxable?: boolean | null;
    /** Physical weight (for shipping display). */
    weight?: {
        value: number;
        unit: string;
    } | null;
    /** Cart quantity bounds (min/max/increment). */
    quantityRule?: QuantityRule;
    /** Per-unit price ("$2.50 / 100ml") for measured products. */
    unitPrice?: Money | null;
    unitPriceMeasurement?: UnitPriceMeasurement | null;
    /** Pickup availability per location (only after `fetchProduct()`). */
    storeAvailability?: StoreAvailability[];
}
export interface Product {
    /** Storefront GraphQL node id (present for live data). */
    id?: string;
    /** Shopify-style theme template variant (e.g. "bundle"). */
    templateSuffix?: string | null;
    handle: string;
    title: string;
    price: Money;
    /** Range "was" price (max compareAtPrice across variants) — sale badge on cards. */
    compareAtPrice?: Money | null;
    featuredImage?: ImageRef | null;
    /** Default purchasable variant id (`firstAvailableVariant`) — enough to add
     *  to cart from a grid/card without loading the full variant list. */
    variantId?: string;
    availableForSale?: boolean;
    /** Catalog facets (card badges / filtering). Present from boot. */
    vendor?: string | null;
    productType?: string | null;
    tags?: string[];
    /** Long description — only populated by `fetchProduct()` (PDP). */
    description?: string;
    /** Image gallery — only after `fetchProduct()` (PDP). */
    images?: ImageRef[];
    /** Full media gallery incl. video / 3D (Shopify `product.media`) — after `fetchProduct()`. */
    media?: ProductMedia[];
    /** Option definitions (Size, Color…) — only after `fetchProduct()`. */
    options?: ProductOption[];
    /** Full variant list — only after `fetchProduct()` (PDP). */
    variants?: ProductVariant[];
    /** Subscription / selling-plan groups — only after `fetchProduct()`. */
    sellingPlanGroups?: SellingPlanGroup[];
    /** True for gift-card products (Shopify `product.gift_card`) — after `fetchProduct()`. */
    isGiftCard?: boolean;
    /** Total on-hand stock across variants (Shopify `product.totalInventory`). */
    totalInventory?: number | null;
    /** Requested custom metafields ("namespace.key" → value) — pass identifiers to fetchProduct(). */
    metafields?: Record<string, string | null>;
    /** SEO override — only after `fetchProduct()`. */
    seo?: Seo | null;
}
/** A product media node — image, video, 3D model, or external (YouTube/Vimeo) video. */
export interface ProductMedia {
    id: string;
    type: 'image' | 'video' | 'model_3d' | 'external_video';
    alt?: string | null;
    /** Present for `image`. */
    image?: ImageRef | null;
    /** Poster frame for video / 3D. */
    previewImage?: ImageRef | null;
    /** Playable/loadable sources for `video` / `model_3d`. */
    sources?: {
        url: string;
        mimeType?: string | null;
        format?: string | null;
    }[];
    /** For `external_video` — 'YOUTUBE' | 'VIMEO'. */
    host?: string | null;
    /** For `external_video` — the embed URL. */
    embedUrl?: string | null;
}
export interface Collection {
    /** Backend collection id (Shopify `collection.id`). */
    id?: string;
    /** Shopify-style theme template variant (e.g. "featured"). */
    templateSuffix?: string | null;
    handle: string;
    title: string;
    /** Optional hero image; falls back to first product's featuredImage. */
    image?: {
        url?: string;
        altText?: string;
    } | null;
    products: Product[];
    /** Total number of products in the collection (Shopify `products_count`). */
    productsCount?: number;
    /** Custom metafields ("namespace.key" → value) for dynamic sources. */
    metafields?: Record<string, string | null>;
    /** SEO title/description (merchant-edited) for the document head. */
    seo?: Seo | null;
}
export interface Page {
    handle: string;
    title: string;
    /** HTML body — rendered via dangerouslySetInnerHTML by the PageBody section. */
    body: string;
    bodySummary?: string;
    author?: string | null;
    publishedAt?: string;
    updatedAt?: string;
    /** Shopify-style template suffix (e.g. "contact"); the theme renders
     *  templates/page.<suffix>.json when set, else the default page template. */
    templateSuffix?: string | null;
    /** SEO title/description (merchant-edited) for the document head. */
    seo?: Seo | null;
}
/**
 * The data interface every block consumes. Themes provide an implementation.
 *
 * Core read methods (collections/products/pages/localization) are always
 * present. The Shopify-compatible extensions (shop, menus, search, blog,
 * recommendations, metaobjects, customer account) come from `StorefrontExtensions`
 * and are LIVE-ONLY — undefined under mock data, so themes feature-detect them
 * (`data.search?.(...)`, `data.customer?.login(...)`).
 */
export interface DataApi extends StorefrontExtensions {
    collectionByHandle: (handle: string) => Collection | null;
    /** All known collections (used by CollectionList). */
    allCollections: () => Collection[];
    /**
     * List every navigation menu the store has (Dashboard → Navigation), for the
     * editor's `link_list` picker. Identity only (handle/title/count) — fetch a
     * menu's items with `fetchMenu(handle)`. Optional: older payloads may omit it.
     */
    listMenus?: () => Promise<Array<{
        handle: string;
        title: string;
        itemsCount: number;
    }>>;
    /** Connected tracking pixels (Settings → Customer events) to inject on the
     *  storefront. Optional — older payloads / mock mode return []. */
    pixels?: () => Promise<Array<{
        id: string;
        name: string;
        provider: string | null;
        providerPixelId: string | null;
        code: string | null;
    }>>;
    /** Physical store locations (Settings → Locations) for a store-locator. */
    locations?: () => Promise<Array<{
        id: string;
        name: string;
        code: string | null;
        address: {
            country: string | null;
            address: string | null;
            city: string | null;
            province: string | null;
            postalCode: string | null;
            phone: string | null;
        } | null;
    }>>;
    /**
     * Look up a single product by its handle. Returns null when the handle
     * isn't found. Required by FeaturedProduct / ProductDetails sections
     * (ported from the canonical examples/react theme in PR #2).
     */
    productByHandle: (handle: string) => Product | null;
    /**
     * Look up a Page by handle (the storefront's `/pages/<handle>` content).
     * Returns null if the handle wasn't prefetched at boot or the merchant
     * hasn't published a page with that handle. Live data prefetches only the
     * page matching the current URL, so other handles return null even when
     * they exist in the backend — themes should only call this for the page
     * the user is on.
     */
    pageByHandle: (handle: string) => Page | null;
    /** Localization snapshot — what markets/countries the store has live.
     *  null = mock data; the country switcher should hide itself. */
    localization: Localization | null;
    /**
     * Raw GraphQL escape hatch against the same storefront endpoint the live
     * data source was booted with. Present ONLY for live data — undefined for
     * mock data. Powers post-boot interactions (the cart's mutations live here).
     */
    graphql?: <T = unknown>(query: string, variables?: Record<string, unknown>) => Promise<T>;
    /**
     * Fetch a single product WITH its full options + variants on demand (for the
     * product page's variant picker). Live data hits the backend; mock data
     * resolves synchronously from the prefetched cache. Returns null if missing.
     */
    fetchProduct?: (handle: string, opts?: {
        metafields?: Array<{
            namespace: string;
            key: string;
        }>;
    }) => Promise<Product | null>;
    /**
     * Fetch the shop's custom metafields by identifier (for dynamic sources).
     * Live data queries `shop { metafields(identifiers) }`; mock data returns {}
     * (no metafields offline). Result keys are "namespace.key".
     */
    fetchShopMetafields?: (identifiers: Array<{
        namespace: string;
        key: string;
    }>) => Promise<Record<string, string | null>>;
    /**
     * Fetch a collection's custom metafields by identifier (for dynamic sources).
     * Result keys are "namespace.key".
     */
    fetchCollectionMetafields?: (handle: string, identifiers: Array<{
        namespace: string;
        key: string;
    }>) => Promise<Record<string, string | null>>;
    /**
     * The raw serializable bootstrap payload this live DataApi was built from
     * (null for mock data). The SSG step embeds it into the page as
     * `window.__TQ_STATE__` so the client can rebuild the identical DataApi
     * synchronously at hydration via createLiveDataFromSnapshot — SSR markup and
     * the client's first render match by construction.
     */
    getSnapshot?: () => unknown;
}
/** Country/market shape mirrored from storefront GraphQL `Localization`. */
export interface LocalizedCurrency {
    isoCode: string;
    name?: string;
    symbol?: string;
}
export interface LocalizedMarket {
    id: string;
    handle: string;
    name: string;
}
export interface LocalizedCountry {
    isoCode: string;
    name: string;
    currency: LocalizedCurrency;
    market: LocalizedMarket | null;
}
/** A language the store has published (dashboard → Markets / Languages). */
export interface LocalizedLanguage {
    isoCode: string;
    name: string;
}
export interface Localization {
    /** Currently-active country (resolved from the request's X-Tanqory-Country). */
    country: LocalizedCountry;
    /** Every country the store has an active Market for — what the picker shows. */
    availableCountries: LocalizedCountry[];
    /**
     * Currently-active language + every language the store has PUBLISHED. These
     * are STORE/dashboard data (the merchant's published locales), not a theme
     * config list — the theme only ships the translations. Optional so older live
     * payloads (countries only) still satisfy the type; the picker falls back to a
     * single default when absent.
     */
    language?: LocalizedLanguage;
    availableLanguages?: LocalizedLanguage[];
}
/** Wraps the app with a theme-provided data source (mock or live). */
export declare function DataProvider({ value, children }: {
    value: DataApi;
    children: ReactNode;
}): JSX.Element;
export declare function useData(): DataApi;
/** Build an offline data source from fixture collections (theme passes its JSON). */
export declare function createMockData(collections: Collection[]): DataApi;
/**
 * Live data source backed by the Tanqory Storefront GraphQL API.
 *
 *   const data = await createLiveData({
 *     endpoint: 'https://api-do-sgp1.tanqory.com',
 *     storeId:  '<store-uuid>',
 *     token:    '<publishable-storefront-token>',
 *     prefetch: { collectionLimit: 20, productLimitPerCollection: 24 },
 *   })
 *
 * Returns the same `DataApi` shape as `createMockData` (sync read methods)
 * by pre-fetching collections + their products at boot and serving every
 * subsequent lookup from an in-memory cache. The trade-off: a single GraphQL
 * round-trip at boot, then zero network on render — exactly what the SSG
 * step + first hydration need.
 *
 * Per-handle pages (e.g. /products/<handle>) that miss the prefetch can
 * still be fetched lazily via `dataApi.refresh()` (TODO) — for now, raise
 * `prefetch.productLimitPerCollection` to cover the catalogue size.
 */
export interface LiveDataOptions {
    /** Base URL of the store-api (e.g. https://api-do-sgp1.tanqory.com). */
    endpoint: string;
    /** Store UUID (the `:storeId` path param). */
    storeId: string;
    /** Publishable storefront token — passed as `x-publishable-key`. */
    token?: string;
    /**
     * ISO 3166 alpha-2 (e.g. "TH", "SG", "US"). When set, the backend resolves
     * the matching Market for this country, applies its currency + exchange
     * rate, and returns Money fields in that currency. Falls back to store
     * base currency if no Market matches the country.
     */
    country?: string;
    /**
     * Content language (BCP-47-ish, e.g. "th", "zh-TW"). When set, the backend
     * overlays the merchant's translations for this locale onto product/
     * collection/page content (X-Tanqory-Lang). Falls back to default-language
     * content when a resource has no translation. Independent of `country`.
     */
    locale?: string;
    /** Optional fetch override (testing / SSR). */
    fetcher?: typeof fetch;
    /**
     * Page handle (from `/pages/<handle>`) to fetch alongside the homepage
     * bootstrap. The theme entry resolves the current URL once at boot and
     * passes the matching handle here so the PageBody section can read
     * `dataApi.pageByHandle(handle)` synchronously during hydration.
     */
    pageHandle?: string;
    /** Handle of the product/collection detail route being loaded, so its
     *  template variant (templateSuffix) is prefetched into the bootstrap. */
    productHandle?: string;
    collectionHandle?: string;
    /** Tune how much to load at boot. */
    prefetch?: {
        /** Max collections to fetch (default 20). */
        collectionLimit?: number;
        /** Max products to inline under each collection (default 24). */
        productLimitPerCollection?: number;
        /** Max products to fetch at the top level (default 24) — these power the
         *  synthesized `featured` / `all` virtual collections when the store has
         *  no real collections yet. */
        topProductLimit?: number;
    };
}
/**
 * Loud, observable reporting for a storefront data error that we deliberately
 * swallow to keep the page alive. The whole point of store-api#505 (a single
 * non-null violation blanked every PDP for days) was that the swallow was
 * *silent* — `console.warn` that nobody reads, no telemetry. This makes such an
 * error:
 *   1. a `console.error` (the level people actually watch), clearly labelled as
 *      a QUERY ERROR (a bug) — not the routine "product not found" null; and
 *   2. a `tq:theme-error` CustomEvent on `window`, the same subscribe-bus
 *      philosophy as `window.tqAnalytics`, so monitoring/pixels/Sentry glue can
 *      pick it up without theme-kit taking a backend or enum dependency.
 * SSR-safe: the `window` dispatch is guarded, `console.error` works everywhere.
 */
export declare function reportThemeError(source: string, detail: string, err?: unknown): void;
export declare function createLiveData(opts: LiveDataOptions): Promise<DataApi>;
/**
 * Build a live DataApi SYNCHRONOUSLY from a previously-fetched bootstrap
 * payload (`data.getSnapshot()`, serialized into the SSG HTML as
 * `window.__TQ_STATE__` by the prerender step). This is what makes hydration
 * deterministic: the client's first render uses the EXACT data the server
 * rendered with — no network round-trip, no drift, no mock fallback — and
 * mount()'s `revalidate` swaps in fresh data after hydration (SWR).
 */
export declare function createLiveDataFromSnapshot(snapshot: unknown, opts: LiveDataOptions): DataApi;
/** Shopify `money` — symbol + amount (e.g. "฿120.00"). */
export declare function formatMoney(money: Money): string;
/** Shopify `money_with_currency` — symbol + amount + ISO code (e.g. "฿120.00 THB"). */
export declare function formatMoneyWithCurrency(money: Money): string;
/** Shopify `money_without_currency` — bare grouped amount (e.g. "120.00"). */
export declare function formatMoneyWithoutCurrency(money: Money): string;
/** Shopify `money_without_trailing_zeros` — symbol + amount, dropping a `.00`
 *  fraction (e.g. "฿120", but "฿120.50" stays). */
export declare function formatMoneyWithoutTrailingZeros(money: Money): string;
/** Shopify `date` / `time_tag` — format an ISO date deterministically (identical
 *  output on server + client to keep SSR hydration stable). Defaults to a medium
 *  date; pass Intl options to customize. */
export declare function formatDate(input: string | number | Date | null | undefined, opts?: Intl.DateTimeFormatOptions, locale?: string): string;
/** Shopify `weight_with_unit` — format a variant weight (e.g. "1.5 kg"). */
export declare function formatWeight(weight: {
    value: number;
    unit: string;
} | null | undefined): string;
/** Shopify `image_url` — append CDN transform params (width/height/crop) to an
 *  image URL. No-op when the src is empty or no transform is requested. React
 *  themes render the `<img>` themselves, so there is no separate `image_tag`. */
export declare function imageUrl(src: string | null | undefined, opts?: {
    width?: number;
    height?: number;
    crop?: string;
}): string;
