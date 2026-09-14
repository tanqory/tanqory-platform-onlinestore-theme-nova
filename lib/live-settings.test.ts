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

test('only the 8 style keys pass, each type-checked; links, copy and non-strings are dropped', () => {
  assert.deepEqual([...LIVE_SETTINGS_KEYS].sort(), [
    'accent', 'colorBackground', 'colorBrand', 'colorText', 'fontBody', 'fontHeading', 'logo', 'shopName',
  ])
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
