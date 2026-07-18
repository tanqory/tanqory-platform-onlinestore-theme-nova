export interface Consent {
    analytics: boolean;
    marketing: boolean;
}
export declare function setBannerRequired(v: boolean): void;
export declare function isBannerRequired(): boolean;
/** The stored decision, or null when the shopper hasn't chosen yet. */
export declare function getConsent(): Consent | null;
export declare function hasDecided(): boolean;
export declare function setConsent(c: Consent): void;
/** True when `purpose` may run right now (see gate semantics above). */
export declare function hasConsent(purpose: keyof Consent): boolean;
/** Subscribe to consent changes; returns an unsubscribe fn. */
export declare function onConsentChange(cb: (c: Consent) => void): () => void;
