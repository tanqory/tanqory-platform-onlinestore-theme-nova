// Run: node --test --experimental-strip-types lib/tanqory/consent-gpc.test.ts
// Global Privacy Control forces the MARKETING purpose off regardless of the banner (matrix 0.5).
import { test } from 'node:test'
import assert from 'node:assert/strict'

const store = new Map<string, string>()
;(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, String(v)) }
;(globalThis as any).window = new EventTarget()
;(globalThis as any).CustomEvent = class extends Event { detail: unknown; constructor(t: string, i?: { detail?: unknown }) { super(t); this.detail = i?.detail } }
const setGpc = (v: boolean | undefined) => Object.defineProperty(globalThis, 'navigator', { value: { globalPrivacyControl: v }, configurable: true })

const consent = await import('./consent.ts')

test('no GPC, banner not required: everything allowed (unchanged)', () => {
  setGpc(undefined); consent.setBannerRequired(false)
  assert.equal(consent.hasConsent('marketing'), true)
  assert.equal(consent.hasConsent('analytics'), true)
})

test('GPC + banner NOT required: marketing denied, analytics untouched', () => {
  setGpc(true); consent.setBannerRequired(false)
  assert.equal(consent.hasConsent('marketing'), false)
  assert.equal(consent.hasConsent('analytics'), true)
})

test('GPC + banner required + accepted-all: marketing STILL denied', () => {
  setGpc(true); consent.setBannerRequired(true)
  consent.setConsent({ analytics: true, marketing: true })
  assert.equal(consent.hasConsent('marketing'), false)
  assert.equal(consent.hasConsent('analytics'), true)
})

test('GPC off + banner required: stored choice decides, undecided denies (unchanged)', () => {
  setGpc(false); consent.setBannerRequired(true)
  consent.setConsent({ analytics: false, marketing: true })
  assert.equal(consent.hasConsent('marketing'), true)
  assert.equal(consent.hasConsent('analytics'), false)
  store.clear()
  assert.equal(consent.hasConsent('marketing'), false)
})

test('a missing navigator never throws and is not GPC', () => {
  delete (globalThis as any).navigator
  consent.setBannerRequired(false)
  assert.equal(consent.hasConsent('marketing'), true)
})
