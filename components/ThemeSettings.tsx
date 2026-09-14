import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useData, useSettings } from '@tanqory/theme-kit'
import {
  LIVE_SETTINGS_MESSAGE,
  fontStylesheetHref,
  resolveThemeVars,
  themeSettingsCss,
  type BrandFallback,
  type ThemeSettings,
} from '../lib/theme-settings'

const EffectiveSettingsContext = createContext<ThemeSettings | null>(null)

/**
 * Theme settings as the storefront should render them right now: the built
 * `config/settings.json`, plus — inside the editor preview — the values the
 * merchant is editing in the Theme panel but has not saved yet.
 *
 * Outside a {@link ThemeSettingsProvider} (the "Add section" preview renders a
 * section with no layout) it is plain `useSettings()`.
 */
export function useThemeSettings(): ThemeSettings {
  const built = useSettings()
  return useContext(EffectiveSettingsContext) ?? built
}

/**
 * Applies theme settings to the whole storefront. Renders one `<style>` that
 * sets nova's design tokens on the root element (see lib/theme-settings.ts) and
 * the Google Fonts stylesheet for any chosen font. Both are part of the React
 * tree, so the SSG prerender bakes them into the HTML — the first paint already
 * has the merchant's colours and fonts — and hydration renders the same markup
 * from the same settings + data snapshot.
 */
export function ThemeSettingsProvider({ children }: { children: ReactNode }): JSX.Element {
  const built = useSettings()
  const data = useData()
  const [live, setLive] = useState<ThemeSettings | null>(null)

  useEffect(() => {
    // Only a page framed by the editor listens, and only to its parent frame.
    if (typeof window === 'undefined' || window.parent === window) return
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window.parent) return
      const msg = e.data as { type?: unknown; settings?: unknown } | null
      if (!msg || msg.type !== LIVE_SETTINGS_MESSAGE) return
      const next = msg.settings
      setLive(next && typeof next === 'object' && !Array.isArray(next) ? (next as ThemeSettings) : null)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const settings = useMemo(() => (live ? { ...built, ...live } : built), [built, live])
  const brand = (data.shop as { brand?: BrandFallback | null } | null | undefined)?.brand ?? null
  const css = themeSettingsCss(resolveThemeVars(settings, brand))
  const fontHref = fontStylesheetHref(settings, brand)

  return (
    <EffectiveSettingsContext.Provider value={settings}>
      {css ? <style id="tq-theme-settings" dangerouslySetInnerHTML={{ __html: css }} /> : null}
      {fontHref ? <link id="tq-theme-fonts" rel="stylesheet" href={fontHref} /> : null}
      {children}
    </EffectiveSettingsContext.Provider>
  )
}
