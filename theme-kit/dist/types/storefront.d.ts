/**
 * Storefront API extensions for the live data layer.
 *
 * `data.tsx` boots a small homepage prefetch (collections + products + page +
 * localization) and exposes a raw `graphql()` escape hatch. This module layers
 * the REST of the Shopify-Storefront-compatible surface on top of that same
 * requester so a theme can build EVERY page Shopify themes build:
 *
 *   - Navigation menus (header/footer, recursive)
 *   - Blog + articles
 *   - Search + predictive search (autocomplete)
 *   - Product recommendations
 *   - Metaobjects (custom content)
 *   - Shop info + legal policies
 *   - Full customer account flow (login / register / orders / addresses)
 *
 * Every field hit here ALREADY EXISTS on tanqory-platform-store-api's Storefront
 * GraphQL schema (`POST /api/v1/stores/{id}/graphql`). These methods attach to
 * the LIVE DataApi only — mock data leaves them undefined, so themes feature-
 * detect (`data.search?.(...)`, `data.customer?.login(...)`).
 *
 * Token storage: the customer flow returns/accepts a `customerAccessToken`
 * (Shopify-compatible). The theme persists it (localStorage) and passes it
 * back — exactly like the cart's `cartId`. `customerTokenStore` is a tiny
 * localStorage helper for the common case.
 */
import type { Money, Product } from './data';
type GraphqlFn = <T = unknown>(query: string, variables?: Record<string, unknown>) => Promise<T>;
/** Normalizers injected from data.tsx (avoids a runtime import cycle). */
export interface StorefrontHelpers {
    normalizeProduct: (node: any) => Product;
}
export interface Image {
    url: string;
    altText?: string;
}
export interface Seo {
    title?: string | null;
    description?: string | null;
}
export type MenuItemType = 'FRONTPAGE' | 'COLLECTION' | 'COLLECTIONS' | 'PRODUCT' | 'CATALOG' | 'PAGE' | 'BLOG' | 'ARTICLE' | 'SEARCH' | 'SHOP_POLICY' | 'HTTP';
export interface MenuItem {
    id: string;
    title: string;
    url: string | null;
    type: MenuItemType;
    resourceId?: string | null;
    items: MenuItem[];
}
export interface Menu {
    id: string;
    handle: string;
    title: string;
    items: MenuItem[];
}
export interface Article {
    id: string;
    handle: string;
    title: string;
    excerpt?: string | null;
    contentHtml: string;
    image?: Image | null;
    author?: string | null;
    publishedAt?: string;
    tags: string[];
    blogHandle?: string;
    seo?: {
        title?: string | null;
        description?: string | null;
        keywords?: string[] | null;
    } | null;
    templateSuffix?: string | null;
}
export interface Blog {
    id: string;
    handle: string;
    title: string;
    articles: Article[];
    seo?: {
        title?: string | null;
        description?: string | null;
        keywords?: string[] | null;
    } | null;
    templateSuffix?: string | null;
}
/** Relay-style page info — drives "load more" / infinite scroll. */
export interface PageInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
}
/** A faceted filter (price / vendor / type / option) available in a result set. */
export interface Filter {
    id: string;
    label: string;
    type: string;
    values: Array<{
        id: string;
        label: string;
        count: number;
        input: string;
    }>;
}
export interface SearchResults {
    totalCount: number;
    products: Product[];
    pages: Array<{
        handle: string;
        title: string;
    }>;
    articles: Article[];
    /** Faceted filters available for this result set (product results). */
    filters: Filter[];
    pageInfo: PageInfo;
}
/** A page of products from a collection (collection page + faceted filtering). */
export interface CollectionProductsPage {
    products: Product[];
    filters: Filter[];
    pageInfo: PageInfo;
}
export interface PredictiveSearchResults {
    queries: string[];
    products: Product[];
    collections: Array<{
        handle: string;
        title: string;
        image?: Image | null;
    }>;
    pages: Array<{
        handle: string;
        title: string;
    }>;
    articles: Article[];
}
export interface MetaobjectField {
    key: string;
    value: string | null;
    type: string;
}
export interface Metaobject {
    id: string;
    handle: string;
    type: string;
    fields: MetaobjectField[];
    /** Convenience map: field key → value. */
    values: Record<string, string | null>;
}
export interface ShopPolicy {
    handle: string;
    title: string;
    url: string;
    body?: string;
}
export interface Shop {
    name: string;
    description?: string | null;
    email?: string | null;
    phone?: string | null;
    brand?: {
        logo?: Image | null;
        squareLogo?: Image | null;
        coverImage?: Image | null;
        slogan?: string | null;
        shortDescription?: string | null;
        /** Settings → Brand. `primary[0]` is the brand colour; themes should treat
         *  the rest as an ordered palette. Every field is nullable — an
         *  unconfigured store yields nulls, never an error. */
        colors?: {
            primary: {
                background?: string | null;
                foreground?: string | null;
            }[];
            secondary: {
                background?: string | null;
                foreground?: string | null;
            }[];
        } | null;
        /** Brand fonts (family names, priority order) from Settings → Brand. */
        fonts?: string[] | null;
    } | null;
    /** Custom shop metafields ("namespace.key" → value) for dynamic sources. */
    metafields?: Record<string, string | null>;
    policies: {
        privacy?: ShopPolicy | null;
        refund?: ShopPolicy | null;
        termsOfService?: ShopPolicy | null;
        shipping?: ShopPolicy | null;
        contactInformation?: ShopPolicy | null;
        legalNotice?: ShopPolicy | null;
        subscription?: ShopPolicy | null;
    };
    /** Cookie-consent banner config (Settings → Customer privacy). */
    cookieBanner?: {
        enabled: boolean;
        dataSharingTitle?: string | null;
        dataSharingVisible?: boolean;
        title?: string | null;
        body?: string | null;
        acceptLabel?: string | null;
        declineLabel?: string | null;
        manageLabel?: string | null;
        position?: string | null;
        colorTheme?: string | null;
    } | null;
    /** Primary storefront domain (for canonical URLs / SEO). */
    primaryDomain?: {
        host: string;
        url: string;
        sslEnabled: boolean;
    } | null;
    /** Accepted payment methods (for footer/checkout payment icons). */
    paymentSettings?: {
        acceptedCardBrands: string[];
        supportedDigitalWallets: string[];
        currencyCode?: string | null;
    } | null;
}
export interface CustomerAddress {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    province?: string | null;
    country?: string | null;
    zip?: string | null;
    phone?: string | null;
    formatted: string[];
}
export interface Customer {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    displayName: string;
    phone?: string | null;
    acceptsMarketing: boolean;
    numberOfOrders: number;
    defaultAddress?: CustomerAddress | null;
    addresses: CustomerAddress[];
}
export interface OrderLineItem {
    title: string;
    variantTitle?: string | null;
    quantity: number;
    image?: Image | null;
    totalPrice: Money;
}
export interface Order {
    id: string;
    name: string;
    orderNumber: number;
    processedAt: string;
    financialStatus?: string | null;
    fulfillmentStatus: string;
    totalPrice: Money;
    statusUrl: string;
    lineItems: OrderLineItem[];
}
export interface CustomerAddressInput {
    firstName?: string;
    lastName?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
    phone?: string;
}
/** Login/register/renew result. `token` present on success; `errors` on failure. */
export interface AuthResult {
    token: string | null;
    expiresAt: string | null;
    errors: string[];
}
export interface MutationResult<T = void> {
    ok: boolean;
    errors: string[];
    data?: T;
}
/** Customer account flow — Shopify-compatible token model. Live-only. */
export interface CustomerApi {
    /** Email + password → access token. Persist `token` (e.g. via customerTokenStore). */
    login(email: string, password: string): Promise<AuthResult>;
    /** Invalidate the access token server-side. */
    logout(token: string): Promise<void>;
    /** Extend a token nearing expiry. */
    renew(token: string): Promise<AuthResult>;
    /** Create an account. Returns the new customer + (no token — call login next). */
    register(input: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        acceptsMarketing?: boolean;
    }): Promise<MutationResult<Customer>>;
    /** Current customer (account page). null when the token is invalid/expired. */
    get(token: string): Promise<Customer | null>;
    /** Order history. */
    orders(token: string, opts?: {
        first?: number;
    }): Promise<Order[]>;
    /** Guest order lookup — orderNumber + email (no account needed). */
    orderByLookup(orderNumber: string, email: string): Promise<Order | null>;
    createAddress(token: string, address: CustomerAddressInput): Promise<MutationResult<{
        id: string;
    }>>;
    updateAddress(token: string, id: string, address: CustomerAddressInput): Promise<MutationResult>;
    deleteAddress(token: string, id: string): Promise<MutationResult>;
    setDefaultAddress(token: string, addressId: string): Promise<MutationResult>;
}
/** The full set of live-only methods this module attaches to a DataApi. */
export interface StorefrontExtensions {
    /** Shop info + legal policies (prefetched at boot). null = mock data. */
    shop?: Shop | null;
    /** A navigation menu by handle. `main-menu` + `footer` are prefetched at boot
     *  (sync); other handles return null until `fetchMenu()` caches them. */
    menu?: (handle: string) => Menu | null;
    /** Fetch (and cache) an arbitrary menu by handle. */
    fetchMenu?: (handle: string) => Promise<Menu | null>;
    /** Full-text search across products, pages and articles (paginated + faceted). */
    search?: (query: string, opts?: {
        first?: number;
        after?: string;
        types?: Array<'PRODUCT' | 'PAGE' | 'ARTICLE'>;
    }) => Promise<SearchResults>;
    /** Autocomplete suggestions (header search dropdown). */
    predictiveSearch?: (query: string, opts?: {
        limit?: number;
    }) => Promise<PredictiveSearchResults>;
    /** Products in a collection — paginated, sortable, faceted (collection page). */
    collectionProducts?: (handle: string, opts?: {
        first?: number;
        after?: string;
        sortKey?: 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED' | 'MANUAL' | 'COLLECTION_DEFAULT';
        reverse?: boolean;
        filters?: Array<Record<string, unknown>>;
    }) => Promise<CollectionProductsPage>;
    /** "You may also like" — related products for a product node id. */
    productRecommendations?: (productId: string) => Promise<Product[]>;
    /** A blog with its articles. */
    blogByHandle?: (handle: string, opts?: {
        articles?: number;
    }) => Promise<Blog | null>;
    /** A single article within a blog. */
    articleByHandle?: (blogHandle: string, articleHandle: string) => Promise<Article | null>;
    /** A metaobject (custom content) by type + handle. */
    metaobject?: (type: string, handle: string) => Promise<Metaobject | null>;
    /** All ACTIVE metaobjects of a type. */
    metaobjects?: (type: string, opts?: {
        first?: number;
    }) => Promise<Metaobject[]>;
    /** Customer account flow (login/register/orders/addresses). */
    customer?: CustomerApi;
}
/** GraphQL selection for shop + the two standard menus, spliced into the
 *  homepage bootstrap so the layout (nav + footer + policies) renders sync. */
export declare const BOOTSTRAP_SHOP_MENU = "\n  shop {\n    name\n    description\n    email\n    phone\n    # Ask for the whole brand, not a third of it. Settings \u2192 Brand persists a\n    # logo, a square logo and brand colours; the SDL has carried them all along\n    # and this selection took only logo/slogan/shortDescription, so a merchant\n    # could upload a logo and set colours and their storefront never changed.\n    # Nullable throughout (BrandColorGroup.background/foreground are String),\n    # so an unconfigured store returns nulls rather than failing the query.\n    brand {\n      logo { url altText }\n      squareLogo { url altText }\n      coverImage { url altText }\n      slogan\n      shortDescription\n      colors {\n        primary { background foreground }\n        secondary { background foreground }\n      }\n      fonts\n    }\n    privacyPolicy { handle title url }\n    refundPolicy { handle title url }\n    termsOfService { handle title url }\n    shippingPolicy { handle title url }\n    contactInformation { handle title url }\n    legalNotice { handle title url }\n    subscriptionPolicy { handle title url }\n    cookieBanner { enabled dataSharingTitle dataSharingVisible title body acceptLabel declineLabel manageLabel position colorTheme }\n    primaryDomain { host url sslEnabled }\n    paymentSettings { acceptedCardBrands supportedDigitalWallets currencyCode }\n  }\n  mainMenu: menu(handle: \"main-menu\") { ...MenuFields }\n  footerMenu: menu(handle: \"footer\") { ...MenuFields }\n";
/** Fragment defs the bootstrap query must include when it uses BOOTSTRAP_SHOP_MENU. */
export declare const BOOTSTRAP_SHOP_MENU_FRAGMENTS = "\n  fragment MenuFields on Menu {\n    id\n    handle\n    title\n    items {\n      ...MenuItemFields\n      items { ...MenuItemFields items { ...MenuItemFields } }\n    }\n  }\n  fragment MenuItemFields on MenuItem { id title url type resourceId }\n";
/** Pull shop + the prefetched menus out of a bootstrap response. */
export declare function readBootstrapShopMenu(boot: any): {
    shop: Shop | null;
    menus: Map<string, Menu>;
};
/**
 * Build the live storefront extension methods on top of a `graphql()` requester.
 * `menuCache` is shared with the boot-prefetched menus so `fetchMenu()` warms
 * the same map that the sync `menu()` reads.
 */
export declare function createStorefrontMethods(graphql: GraphqlFn, helpers: StorefrontHelpers, menuCache: Map<string, Menu>): Required<Omit<StorefrontExtensions, 'shop' | 'menu'>>;
/** Tiny localStorage helper for the customer access token (SSR-safe no-ops). */
export declare const customerTokenStore: {
    get(): string | null;
    set(token: string): void;
    clear(): void;
};
export {};
