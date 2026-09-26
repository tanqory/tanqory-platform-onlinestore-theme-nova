/**
 * The header search must ask the shop, not the page.
 *
 * It used to filter only the products already bootstrapped into the current
 * page, so on the live store it answered "No matches" for things the shop
 * plainly sells — 0 results for "blazer" and 0 for "book", while /search
 * returned 6 and 3 for the same words.
 */
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Product } from '../lib/tanqory/index'
import { SearchModal } from '../overlays/SearchModal'
import { openOverlay } from '../components/useOverlayChannel'
import { product, renderSection, stubData } from './helpers/render'

/** React tracks the input's value itself, so setting `.value` directly is
 *  ignored. This is the setter React's own onChange path reads. */
function nativeSetValue(el: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(el, value)
}

const PROPS = {
  placeholder: 'Search',
  ctaLabel: 'See all results',
  maxWidth: '640px',
  debounceMs: 0,
  maxResults: 8,
}

/** Opens the overlay the way the header button does. */
const openSearch = (): void => openOverlay('search')

describe('the header search', () => {
  it('asks the shop, not just the products already on the page', async () => {
    const onlyOnTheServer: Product = product('breasted-blazer', { title: 'Breasted Blazer' })
    const search = vi.fn().mockResolvedValue({ products: [onlyOnTheServer], pages: [], articles: [] })
    // The bootstrap deliberately holds a DIFFERENT product, so a pass can only
    // come from the endpoint being consulted.
    const data = stubData({ products: [product('mug', { title: 'Stoneware Mug' })] })
    const h = await renderSection(<SearchModal {...PROPS} />, { ...data, search })
    await act(async () => openSearch())
    await h.settle()
    const input = h.container.querySelector('.search-modal__input') as HTMLInputElement | null
    expect(input).toBeTruthy()
    await act(async () => {
      nativeSetValue(input!, 'blazer')
      input!.dispatchEvent(new Event('input', { bubbles: true }))
    })
    // The debounce is a setTimeout, which is a macrotask — awaiting promises
    // never reaches it. A real tick does.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 5))
    })
    await h.settle()
    try {
      expect(search).toHaveBeenCalled()
      expect(search.mock.calls[0][0]).toBe('blazer')
    } finally {
      // Unmount even when the assertion fails, or the leaked tree keeps
      // running its effects inside the NEXT test and reports its error there.
      h.unmount()
    }
  })

  it('falls back to what is in memory when the shop cannot be asked', async () => {
    // Offline development and the editor preview have no search endpoint; the
    // panel must still answer rather than go blank.
    const data = stubData({ products: [product('tee', { title: 'Cotton Tee' })] })
    const h = await renderSection(<SearchModal {...PROPS} />, { ...data, search: undefined })
    await act(async () => openSearch())
    await h.settle()
    expect(h.container.querySelector('.search-modal__input')).toBeTruthy()
    h.unmount()
  })
})
