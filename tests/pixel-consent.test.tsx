/**
 * Pixels are marketing: nothing is injected and nothing is delivered on the bus until the shopper has
 * EXPLICITLY granted `marketing` — and never under Global Privacy Control — whatever the store's banner
 * setting says. (`hasConsent` alone is fail-open when no banner is configured and ignores GPC; S8 B-1.)
 */
import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TrackingPixels } from '../components/TrackingPixels'
import { renderSection, stubData } from './helpers/render'

const PIXEL_CODE = 'window.__tqPixelRan = true'
const dataWithPixels = () =>
  ({ ...stubData({}), pixels: async () => [{ id: 'px1', code: PIXEL_CODE }] }) as never

const setGpc = (v: boolean | undefined) =>
  Object.defineProperty(navigator, 'globalPrivacyControl', { value: v, configurable: true })

const inject = async () => {
  const { unmount } = await renderSection(<TrackingPixels />, dataWithPixels())
  await act(async () => {
    await new Promise((r) => setTimeout(r, 10))
  })
  const present = !!document.getElementById('tq-pixel-px1')
  unmount()
  return present
}

beforeEach(() => {
  localStorage.clear()
  document.head.querySelectorAll('[id^="tq-pixel-"]').forEach((n) => n.remove())
  setGpc(undefined)
})

describe('pixel INJECTION', () => {
  it('no banner configured and no stored decision → no pixel script is injected', async () => {
    expect(await inject()).toBe(false)
  })

  it('GPC on → no injection, even with a stored marketing grant', async () => {
    localStorage.setItem('tq-cookie-consent', 'accepted')
    setGpc(true)
    expect(await inject()).toBe(false)
  })

  it('a stored decision without marketing → no injection', async () => {
    localStorage.setItem('tq-cookie-consent', JSON.stringify({ analytics: true, marketing: false }))
    expect(await inject()).toBe(false)
  })

  it('an explicit marketing grant (GPC off) → injected once', async () => {
    localStorage.setItem('tq-cookie-consent', 'accepted')
    expect(await inject()).toBe(true)
  })
})

describe('bus DELIVERY of every event (not only the purchase)', () => {
  const fresh = async () => {
    vi.resetModules()
    delete (window as unknown as { tqAnalytics?: unknown }).tqAnalytics
    Object.defineProperty(navigator, 'sendBeacon', { value: vi.fn(() => true), configurable: true })
    const mod = await import('../lib/tanqory/index')
    const analytics = mod.createAnalytics({ storeId: '11111111-1111-4111-8111-111111111111' })
    const seen: string[] = []
    mod.subscribe('all_events', (e) => seen.push(e.name))
    return { analytics, seen, ...mod }
  }

  it('GPC on, no banner → page_viewed is NOT delivered to pixel subscribers', async () => {
    const { analytics, seen, setBannerRequired } = await fresh()
    setBannerRequired(false)
    setGpc(true)
    analytics.pageViewed()
    expect(seen).toEqual([])
  })

  it('no banner, no stored decision → page_viewed is NOT delivered', async () => {
    const { analytics, seen, setBannerRequired } = await fresh()
    setBannerRequired(false)
    analytics.pageViewed()
    expect(seen).toEqual([])
  })

  it('an explicit marketing grant → page_viewed is delivered', async () => {
    localStorage.setItem('tq-cookie-consent', 'accepted')
    const { analytics, seen } = await fresh()
    analytics.pageViewed()
    expect(seen).toEqual(['page_viewed'])
  })
})
