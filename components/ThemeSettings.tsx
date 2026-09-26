import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useData, useSettings } from '../lib/tanqory/index'
import {
  fontStylesheetHref,
  resolveRootFlags,
  resolveThemeVars,
  themeSettingsCss,
  type BrandFallback,
  type ThemeSettings,
} from '../lib/theme-settings'
import { isEditorPreview, readLiveSettingsMessage, studioOrigins } from '../lib/live-settings'

const EffectiveSettingsContext = createContext<ThemeSettings | null>(null)

/** Every root `data-*` this theme owns — so an unset flag can be cleared. */
const ROOT_FLAG_ATTRS = ['cardBorder', 'buttonBorder', 'cardHover', 'badgeStyle', 'buttonText', 'typeScale', 'productFit', 'iconStyle'] as const

/**
 * Theme settings as the storefront should render them right now: the built
 * `config/settings.json`, plus — inside the editor preview only — the style
 * values the merchant is editing in the Theme panel but has not saved yet.
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
    if (typeof window === 'undefined') return
    const env = import.meta.env as ImportMetaEnv & { VITE_TQ_STUDIO_ORIGINS?: string }
    const ctx = {
      isPreview: isEditorPreview(window.location, Boolean(env.DEV)),
      parent: window.parent !== window ? window.parent : null,
      allowedOrigins: studioOrigins(env.VITE_TQ_STUDIO_ORIGINS, Boolean(env.DEV)),
    }
    // A store's public pages never listen — see lib/live-settings.ts.
    if (!ctx.isPreview || !ctx.parent) return
    const onMessage = (e: MessageEvent) => {
      const result = readLiveSettingsMessage(e, ctx)
      if (!result) return
      setLive('clear' in result ? null : result.settings)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const settings = useMemo(() => (live ? { ...built, ...live } : built), [built, live])

  // Behaviour switches (card hover, badge style, type scale, …) are `data-*` on
  // the root element so CSS branches on them. Applied from the EFFECTIVE
  // settings, so they follow the editor's live preview exactly like the
  // colours do; a flag that is no longer set is removed, not left stale.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const flags = resolveRootFlags(settings)
    for (const attr of ROOT_FLAG_ATTRS) {
      if (attr in flags) root.dataset[attr] = flags[attr]
      else delete root.dataset[attr]
    }
  }, [settings])
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
