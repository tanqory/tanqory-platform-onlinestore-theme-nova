/**
 * Dynamic sources — bind a section/block setting to a live metafield, resource
 * property, or metaobject field (Shopify "Insert dynamic source", the ⛁ icon).
 *
 * A setting value is normally a primitive. When the merchant connects a dynamic
 * source the editor stores a `{ '@source': '<path>' }` object instead, and the
 * theme resolves it at render against the CURRENT page resource:
 *
 *   product.metafields.custom.subtitle     → the page product's metafield
 *   collection.metafields.custom.tagline   → the page collection's metafield
 *   shop.metafields.custom.announcement    → the store's metafield (any page)
 *   product.title / shop.name              → a plain resource property
 *   metaobject:size:medium.label           → a metaobject field (type:handle.key)
 *
 * The path grammar mirrors Shopify so themes/docs are portable. Resolution is
 * synchronous against already-loaded resources — the provider is responsible
 * for loading the bound metafields (see `collectBoundIdentifiers`).
 */
import { type ReactNode } from 'react';
import type { Product, Collection } from './data';
import type { Shop, Metaobject } from './storefront';
/** A setting bound to a dynamic source instead of a literal value. */
export interface BoundSource {
    '@source': string;
}
export type Bound<T> = T | BoundSource;
export declare function isBoundSource(v: unknown): v is BoundSource;
/** Resources a dynamic source can read from on the current page. */
export interface ResourceContextValue {
    shop?: (Shop & {
        metafields?: Record<string, string | null>;
    }) | null;
    product?: (Product & {
        metafields?: Record<string, string | null>;
    }) | null;
    collection?: (Collection & {
        metafields?: Record<string, string | null>;
    }) | null;
    /** Synchronous metaobject lookup (type, handle) → entry, from a warmed cache. */
    metaobject?: (type: string, handle: string) => Metaobject | null;
}
/**
 * Provide the current page's resources to dynamic sources. Wrap the page once
 * (the layout does this). `shop` falls back to the data source so shop-level
 * bindings work on every page without extra wiring.
 */
export declare function DynamicSourceProvider({ value, children, }: {
    value: ResourceContextValue;
    children: ReactNode;
}): JSX.Element;
export declare function useResourceContext(): ResourceContextValue;
/** Resolve a `@source` path against a resource context. Returns null if unbound. */
export declare function resolveBoundSource(source: string, ctx: ResourceContextValue): string | null;
/**
 * Resolve a possibly-bound setting value for the current page.
 *   const heading = useBound(attributes.heading)   // string | the literal | null
 * A plain value passes through unchanged; a `{ '@source' }` object resolves to
 * the live value (or null when the source has no value on this resource).
 */
export declare function useBound(value: unknown): unknown;
/** Convenience: resolve to a string (empty when null/unbound-empty). */
export declare function useBoundText(value: unknown, fallback?: string): string;
/**
 * Walk a content tree's section/block settings and collect every bound metafield
 * identifier, grouped by resource. The provider uses this to request exactly the
 * metafields the page binds (the live product/collection query takes identifiers).
 */
export declare function collectBoundIdentifiers(nodes: Array<{
    settings?: Record<string, unknown>;
    blocks?: unknown[];
}> | undefined): {
    product: Array<{
        namespace: string;
        key: string;
    }>;
    collection: Array<{
        namespace: string;
        key: string;
    }>;
    shop: Array<{
        namespace: string;
        key: string;
    }>;
};
