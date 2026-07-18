import { type ReactNode } from 'react';
type Settings = Record<string, unknown>;
type Locale = Record<string, string>;
/** Provides global settings values + locale strings to the whole theme. */
export declare function ThemeProvider({ settings, locale, children, }: {
    settings?: Settings;
    locale?: Locale;
    children: ReactNode;
}): JSX.Element;
/** Read global theme settings (values from config/settings.json). */
export declare function useSettings(): Settings;
/** Translate a key against the active locale (falls back to the key). */
export declare function useT(): (key: string) => string;
export {};
