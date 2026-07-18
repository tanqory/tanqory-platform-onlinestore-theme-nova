/**
 * Storefront analytics — emit customer events to store-api's analytics pipeline
 * so the merchant's dashboards (sessions, device type, reports, live view)
 * populate. The batch is POSTed SAME-ORIGIN to `/api/v1/analytics/events/batch`
 * (the edge worker forwards it to the store's cell — no CORS); the endpoint is
 * public. Payload matches store-api's EventBatchSchema exactly:
 *   { storeId, sessionId, visitorId (all UUIDs), events[1..50], context }
 *
 * The theme creates ONE analytics instance for the real storefront (never in the
 * editor/preview plane) and calls `pageViewed()` on each route + the product/
 * cart/checkout emitters from the matching sections.
 *
 * CUSTOMER EVENTS (Shopify Web Pixels-style): every `track()` also publishes to
 * a client-side bus so the merchant's CONNECTED pixels (Settings → Customer
 * events, injected by the theme's TrackingPixels) can react to live shopper
 * actions. A pixel subscribes with `window.tqAnalytics.subscribe(name, cb)`.
 * Bus delivery is gated on MARKETING consent (pixels are tracking); the internal
 * telemetry POST is gated separately on ANALYTICS consent.
 */
/** store-api SessionEventType values we emit from the storefront. */
export type StorefrontEventType = 'PAGE_VIEWED' | 'COLLECTION_VIEWED' | 'PRODUCT_VIEWED' | 'PRODUCT_ADDED_TO_CART' | 'PRODUCT_REMOVED_FROM_CART' | 'CART_VIEWED' | 'CHECKOUT_STARTED' | 'SEARCH_SUBMITTED';
/** The normalized event delivered to pixel subscribers on the client bus. */
export interface StorefrontEvent {
    /** Unique per emission (UUID). */
    id: string;
    /** Lowercase contract name, e.g. `product_added_to_cart`. */
    name: string;
    /** The store-api SessionEventType. */
    type: StorefrontEventType;
    /** ISO-8601. */
    timestamp: string;
    /** Event-specific payload (product id, query, quantity…). */
    data: Record<string, unknown>;
    /** Session context (userAgent, referrer, utm, screen, locale, timezone). */
    context: Record<string, unknown>;
}
export interface Analytics {
    /** Queue an event; flushes automatically at batchSize / on page hide. */
    track(type: StorefrontEventType, properties?: Record<string, unknown>): void;
    /** Convenience for the current page. */
    pageViewed(properties?: Record<string, unknown>): void;
    /** Force-send the queued events now. */
    flush(): void;
    /** Subscribe to customer events (for pixels/apps). See `subscribe()`. */
    subscribe(eventName: string, cb: (e: StorefrontEvent) => void): () => void;
}
export interface AnalyticsOptions {
    storeId: string;
    endpoint?: string;
    batchSize?: number;
    /** Optional consent gate — return false to drop events (GDPR). Defaults to on. */
    consent?: () => boolean;
}
/**
 * Subscribe a pixel (or app) to storefront customer events. Pass a contract
 * name (`product_added_to_cart`, `checkout_started`, …) or `all_events` for
 * every event. Recently-fired events replay immediately, so a pixel injected
 * mid-session still receives them. Returns an unsubscribe fn.
 */
export declare function subscribe(eventName: string, cb: (e: StorefrontEvent) => void): () => void;
/** The storefront's active analytics instance (or a no-op before creation). */
export declare function getAnalytics(): Analytics;
export declare function createAnalytics(opts: AnalyticsOptions): Analytics;
