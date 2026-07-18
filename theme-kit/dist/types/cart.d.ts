import { type ReactNode } from 'react';
import { type Money } from './data';
export interface CartLine {
    /** Cart line id — the handle used for update/remove. */
    id: string;
    /** The purchasable variant (merchandise) id. */
    variantId: string;
    quantity: number;
    /** Product title shown in the cart. */
    title: string;
    /** Variant title (e.g. "Black / M"); empty for single-variant products. */
    variantTitle?: string;
    image?: {
        url: string;
        altText?: string;
    } | null;
    /** Per-unit price. */
    price: Money;
    /** Line subtotal (price × quantity). */
    lineSubtotal: Money;
    /** Product handle for linking back to the PDP. */
    productHandle?: string;
}
/** A discount code applied to the cart (`applicable=false` when it didn't qualify). */
export interface AppliedDiscountCode {
    code: string;
    applicable: boolean;
}
/** A gift card applied to the cart — masked (only last 4 chars ever leave the API). */
export interface AppliedGiftCard {
    id: string;
    lastCharacters: string;
    amountUsed: Money;
    balance: Money;
}
export interface CartState {
    id: string | null;
    lines: CartLine[];
    subtotal: Money;
    /** Final amount after discounts + gift cards (cost.totalAmount). */
    total: Money;
    /** Estimated tax (cost.totalTaxAmount) — null until known (usually at checkout). */
    tax?: Money | null;
    /** Estimated duties (cost.totalDutyAmount) — null unless cross-border. */
    duty?: Money | null;
    /** Cart-level order note (Shopify `cart.note`). */
    note?: string | null;
    /** Cart-level custom attributes (Shopify `cart.attributes`). */
    attributes?: {
        key: string;
        value: string | null;
    }[];
    totalQuantity: number;
    checkoutUrl: string | null;
    /** Discount codes applied to the cart. */
    discountCodes: AppliedDiscountCode[];
    /** Total savings across all discount allocations — null when nothing's discounted. */
    discountAmount: Money | null;
    /** Gift cards applied to the cart. */
    appliedGiftCards: AppliedGiftCard[];
    /** True while a mutation/bootstrap is in flight. */
    loading: boolean;
    /** True once the client has hydrated cart state post-mount. */
    ready: boolean;
    error: string | null;
}
export interface AddToCartInput {
    variantId: string;
    quantity?: number;
    /** Display data — used only by the in-memory MOCK driver (editor/offline). */
    product?: {
        title: string;
        price: Money;
        image?: {
            url: string;
            altText?: string;
        } | null;
        handle?: string;
        variantTitle?: string;
    };
}
export interface CartApi extends CartState {
    add: (input: AddToCartInput) => Promise<void>;
    updateQuantity: (lineId: string, quantity: number) => Promise<void>;
    remove: (lineId: string) => Promise<void>;
    clear: () => Promise<void>;
    /** Apply discount codes (replaces the current set; [] clears them). LIVE only. */
    applyDiscountCodes: (codes: string[]) => Promise<void>;
    /** Apply gift card codes to the cart. LIVE only. */
    applyGiftCardCodes: (codes: string[]) => Promise<void>;
    /** Remove applied gift cards by id. LIVE only. */
    removeGiftCards: (ids: string[]) => Promise<void>;
    /** Set the cart-level order note (Shopify `cart.note`). LIVE only. */
    updateNote: (note: string) => Promise<void>;
    /** Replace the cart-level custom attributes (Shopify `cart.attributes`). LIVE only. */
    updateAttributes: (attributes: {
        key: string;
        value: string;
    }[]) => Promise<void>;
}
export declare function CartProvider({ children }: {
    children: ReactNode;
}): JSX.Element;
export declare function useCart(): CartApi;
