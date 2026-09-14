// Run: npm test  (node --test --experimental-strip-types)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  LEGACY_ACCENT_PLACEHOLDER,
  fontStylesheetHref,
  normalizeColor,
  normalizeImageUrl,
  readableTextOn,
  resolveLogo,
  resolveThemeVars,
  themeSettingsCss,
  type BrandFallback,
} from './theme-settings.ts'

const scaffold = JSON.parse(readFileSync(new URL('../config/settings.json', import.meta.url), 'utf8'))

const brand: BrandFallback = {
  logo: { url: 'https://cdn.example.com/brand-logo.png', altText: 'Acme' },
  colors: { primary: [{ background: '#123456', foreground: '#fefefe' }] },
  fonts: ['Lora', 'Inter'],
}

test('the shipped settings.json changes nothing: no variables, no stylesheet, no font request', () => {
  assert.deepEqual(resolveThemeVars(scaffold), {})
  assert.equal(themeSettingsCss(resolveThemeVars(scaffold)), '')
  assert.equal(fontStylesheetHref(scaffold), null)
  assert.equal(resolveLogo(scaffold), null)
})

test('an installed theme still carrying the legacy accent placeholder keeps the theme buttons', () => {
  const vars = resolveThemeVars({ ...scaffold, accent: LEGACY_ACCENT_PLACEHOLDER })
  assert.equal(vars['--color-button'], undefined)
  assert.equal(vars['--color-accent'], undefined)
  // Upper-case spelling of the same placeholder is the same placeholder.
  assert.equal(resolveThemeVars({ accent: '#0A0A0A' })['--color-button'], undefined)
})

test('accent (what ai-api writes) drives the accent token and primary buttons with readable text', () => {
  const vars = resolveThemeVars({ ...scaffold, accent: '#C2410C' })
  assert.equal(vars['--color-accent'], '#c2410c')
  assert.equal(vars['--color-button'], '#c2410c')
  assert.equal(vars['--color-button-text'], '#ffffff')
  assert.match(vars['--color-button-hover'], /^color-mix\(in srgb, #c2410c 85%, #000000\)$/)
  assert.equal(resolveThemeVars({ accent: '#fde047' })['--color-button-text'], '#0a0a0a')
})

test('brand colour: theme setting wins, Settings → Brand is the fallback', () => {
  const fromBrand = resolveThemeVars({ colorBrand: '' }, brand)
  assert.equal(fromBrand['--color-brand'], '#123456')
  assert.equal(fromBrand['--color-brand-contrast'], '#fefefe')

  const fromTheme = resolveThemeVars({ colorBrand: '#ffffff' }, brand)
  assert.equal(fromTheme['--color-brand'], '#ffffff')
  assert.equal(fromTheme['--color-brand-contrast'], '#0a0a0a')
})

test('background and text are written as a pair and derive the surface palette', () => {
  const onlyText = resolveThemeVars({ colorText: '#222222' })
  assert.equal(onlyText['--color-fg'], '#222222')
  assert.equal(onlyText['--color-bg'], '#ffffff', 'a text colour alone must not meet the dark-scheme background')
  // Text over imagery and the footer keep nova's white-on-near-black pair.
  assert.equal(onlyText['--color-fg-inverse'], undefined)
  assert.equal(onlyText['--color-bg-inverse'], undefined)

  const dark = resolveThemeVars({ colorBackground: '#101820', colorText: '#f2f2f2' })
  assert.equal(dark['--color-bg'], '#101820')
  assert.equal(dark['--header-bg'], 'color-mix(in srgb, #101820 86%, transparent)')
  assert.equal(dark['--color-fg-muted'], 'color-mix(in srgb, #f2f2f2 68%, #101820)')
})

test('fonts: theme setting per role, else Settings → Brand fonts, with a fitting fallback stack', () => {
  const fromBrand = resolveThemeVars({}, brand)
  assert.match(fromBrand['--font-display'], /^"Lora", Georgia/)
  assert.match(fromBrand['--font-body'], /^"Inter", system-ui/)

  const mixed = resolveThemeVars({ fontHeading: 'Playfair Display', fontBody: '' }, brand)
  assert.match(mixed['--font-display'], /^"Playfair Display", Georgia/)
  assert.match(mixed['--font-body'], /^"Inter",/)

  assert.equal(
    fontStylesheetHref({ fontHeading: 'Playfair Display', fontBody: 'Inter' }),
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap',
  )
  // One family used for both roles is requested once.
  assert.equal(
    fontStylesheetHref({ fontHeading: 'Kanit', fontBody: 'Kanit' }),
    'https://fonts.googleapis.com/css2?family=Kanit:wght@400;500;600;700&display=swap',
  )
})

test('logo precedence: theme logo > Settings → Brand logo > none (shop name text)', () => {
  assert.deepEqual(resolveLogo({ logo: 'https://cdn.example.com/theme.png' }, brand), {
    url: 'https://cdn.example.com/theme.png',
    altText: null,
  })
  // shopName no longer hides the brand logo.
  assert.deepEqual(resolveLogo({ logo: '', shopName: 'Typed name' }, brand), {
    url: 'https://cdn.example.com/brand-logo.png',
    altText: 'Acme',
  })
  assert.equal(resolveLogo({ logo: '', shopName: 'Typed name' }, { logo: null }), null)
})

test('values that could break out of the <style> element are refused, not escaped', () => {
  for (const bad of ['red;}</style><script>alert(1)</script>', 'url(javascript:x)', '#12', 'expression(1)']) {
    assert.equal(normalizeColor(bad), null, bad)
  }
  const css = themeSettingsCss(
    resolveThemeVars({
      accent: '#fff;}body{display:none',
      fontHeading: 'Inter"}</style><script>',
      colorBrand: 'rgb(1, 2, 3)',
    }),
  )
  assert.equal(css, ':root:root{--color-brand:rgb(1, 2, 3);--color-brand-contrast:#ffffff;}')
  assert.equal(normalizeImageUrl('javascript:alert(1)'), null)
  assert.equal(normalizeImageUrl('"><img src=x onerror=1>'), null)
  assert.equal(normalizeImageUrl('/media/logo.png'), '/media/logo.png')
  assert.equal(normalizeImageUrl({ url: 'https://cdn.example.com/a.png' }), 'https://cdn.example.com/a.png')
})

test('the stylesheet outranks the theme defaults it replaces', () => {
  assert.equal(themeSettingsCss({ '--color-accent': '#c2410c' }), ':root:root{--color-accent:#c2410c;}')
  assert.equal(readableTextOn('#000000'), '#ffffff')
  assert.equal(readableTextOn('#ffffff'), '#0a0a0a')
})
