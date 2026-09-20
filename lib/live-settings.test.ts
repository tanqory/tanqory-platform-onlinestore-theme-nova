// Run: npm test  (node --test --experimental-strip-types)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_STUDIO_ORIGINS,
  LIVE_SETTINGS_KEYS,
  isEditorPreview,
  isExactOrigin,
  readLiveSettingsMessage,
  studioOrigins,
  sanitizeLiveSettings,
} from './live-settings.ts'

const parent = { name: 'studio window' }
const studio = 'https://studio.tanqory.com'
const ctx = { isPreview: true, parent, allowedOrigins: studioOrigins(undefined, false) }
const msg = (settings: unknown, over: Partial<{ origin: string; source: unknown; type: string }> = {}) => ({
  origin: over.origin ?? studio,
  source: over.source ?? parent,
  data: { type: over.type ?? 'tq:theme-settings', settings },
})

test('the studio parent on a preview page can restyle the preview', () => {
  assert.deepEqual(readLiveSettingsMessage(msg({ accent: '#2563eb', fontHeading: 'Inter' }), ctx), {
    settings: { accent: '#2563eb', fontHeading: 'Inter' },
  })
  assert.deepEqual(readLiveSettingsMessage(msg(null), ctx), { clear: true })
})

test('a store public page ignores the message, even from an allowed studio origin', () => {
  assert.equal(readLiveSettingsMessage(msg({ accent: '#2563eb' }), { ...ctx, isPreview: false }), null)
})

test('only an editor preview counts as preview: preview-* host, or ?preview on a dev build only', () => {
  assert.equal(isEditorPreview({ hostname: 'preview-theme-abc.mytanqory.com', search: '' }, false), true)
  assert.equal(isEditorPreview({ hostname: 'shop.mytanqory.com', search: '?preview=1' }, false), false)
  assert.equal(isEditorPreview({ hostname: 'shop.mytanqory.com', search: '' }, false), false)
  assert.equal(isEditorPreview({ hostname: 'localhost', search: '?preview=1' }, true), true)
})

test('a page that frames the store cannot drive it: foreign origins and non-parent sources are ignored', () => {
  for (const origin of ['https://evil.example', 'null', 'https://studio.tanqory.com.evil.example', 'http://studio.tanqory.com']) {
    assert.equal(readLiveSettingsMessage(msg({ accent: '#ff0000' }, { origin }), ctx), null, origin)
  }
  assert.equal(readLiveSettingsMessage(msg({ accent: '#ff0000' }, { source: { other: true } }), ctx), null)
  assert.equal(readLiveSettingsMessage(msg({ accent: '#ff0000' }), { ...ctx, parent: null }), null)
  assert.equal(readLiveSettingsMessage(msg({ accent: '#ff0000' }, { type: 'tq:set-content' }), ctx), null)
})

test('only STYLE keys pass, each type-checked; links, copy and non-strings are dropped', () => {
  // The whole list, pinned: a key added here is a key an editor frame can set
  // on a live preview. Brand + the design's global style props — never a link,
  // a menu handle, copy or a feature toggle.
  assert.deepEqual([...LIVE_SETTINGS_KEYS].sort(), [
    'accent', 'badgeStyle', 'bodyFont', 'buttonBorder', 'buttonRadius', 'buttonTextStyle', 'cardBorder', 'cardHoverEffect',
    'cardRadius', 'colorBackground', 'colorBorder', 'colorBrand', 'colorPrimary', 'colorSale', 'colorSecondarySurface',
    'colorText', 'fontBody', 'fontHeading', 'headingFont', 'headingWeight', 'iconStyle', 'inputRadius', 'logo', 'motion',
    'pageWidth', 'productImageFit', 'productImageRatio', 'sectionSpacing', 'shopName', 'typeScale',
  ])
  for (const key of LIVE_SETTINGS_KEYS) {
    assert.doesNotMatch(key, /href|link|menu|handle|label|subtext|placeholder|^enable|^account|^cart[A-Z]|^search|^footer|^mobileNav|powered/i, key)
  }
  const result = readLiveSettingsMessage(
    msg({
      accountPrimaryHref: 'javascript:alert(document.cookie)',
      accountExtraLinks: 'Pwn|javascript:alert(1)',
      headerMenuHandle: 'attacker-menu',
      shopName: 1,
      logo: 'javascript:alert(1)',
      accent: 'red;}</style><script>',
      colorText: { toString: () => '#000' },
      fontBody: 'Inter"}',
      colorBackground: '',
      fontHeading: 'Playfair Display',
      __proto__: { accent: '#000000' },
    }),
    ctx,
  )
  assert.deepEqual(result, { settings: { colorBackground: '', fontHeading: 'Playfair Display' } })
  assert.equal(readLiveSettingsMessage(msg(['accent']), ctx), null)
  assert.equal(readLiveSettingsMessage(msg('accent'), ctx), null)
})

test('studio origins are exact, configurable, never wildcards', () => {
  assert.deepEqual(studioOrigins(undefined, false), [...DEFAULT_STUDIO_ORIGINS])
  assert.ok(studioOrigins(undefined, true).includes('http://localhost:5173'))
  assert.ok(!studioOrigins(undefined, false).includes('http://localhost:5173'))
  assert.deepEqual(
    studioOrigins(' https://studio.example.com , https://*.tanqory.com, http://studio.example.com, https://a.example/path ', false),
    ['https://studio.example.com'],
  )
  // A configuration with no valid origin keeps the defaults rather than opening up.
  assert.deepEqual(studioOrigins('*', false), [...DEFAULT_STUDIO_ORIGINS])
  assert.equal(isExactOrigin('http://studio.localhost:4799'), true)
  assert.equal(isExactOrigin('https://studio.tanqory.com/'), false)
})


test('the live preview accepts every global prop the resolver handles, and nothing else', () => {
  const ok = sanitizeLiveSettings({
    colorPrimary: '#0055ff', headingFont: 'Inter', bodyFont: 'Lora', colorSale: '#aa0000', colorBorder: '#cccccc',
    buttonRadius: 'pill', pageWidth: 'standard', sectionSpacing: 'large', productImageRatio: 'adapt', motion: 'reduced',
    cardHoverEffect: 'image-swap', badgeStyle: 'outline', cardBorder: true, typeScale: 'large',
  })
  assert.deepEqual(Object.keys(ok).sort(), [
    'badgeStyle', 'bodyFont', 'buttonRadius', 'cardBorder', 'cardHoverEffect', 'colorBorder', 'colorPrimary', 'colorSale',
    'headingFont', 'motion', 'pageWidth', 'productImageRatio', 'sectionSpacing', 'typeScale',
  ])
  // A rung the resolver has no token for, a pixel value, markup in a flag, an unknown key: all dropped.
  assert.deepEqual(
    sanitizeLiveSettings({ buttonRadius: '19px', pageWidth: 'huge', cardHoverEffect: '"><script>', colorSale: 'red;}', somethingElse: 'x' }),
    {},
  )
})
