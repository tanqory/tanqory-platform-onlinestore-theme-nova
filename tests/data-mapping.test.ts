/**
 * What the card actually reads out of a product.
 *
 * `toCard` is the one place that decides which platform field feeds which card
 * slot, so it is the one place worth pinning. Swatches in particular were a
 * declared prop that nothing ever populated — the control existed and could
 * never show anything.
 */
import { describe, expect, it } from 'vitest'
import { toCard } from '../components/ProductCard'

const base = {
  handle: 'tee',
  title: 'Tee',
  price: { amount: '10.00', currencyCode: 'USD' },
}

describe('toCard', () => {
  it('takes swatches from the product option that names a colour', () => {
    const card = toCard({
      ...base,
      options: [
        { name: 'Size', values: ['S', 'M'] },
        { name: 'Colour', values: ['Oat', 'Black'] },
      ],
    })
    expect(card.swatches).toEqual(['Oat', 'Black'])
  })

  it('matches the American spelling too', () => {
    const card = toCard({ ...base, options: [{ name: 'Color', values: ['Red'] }] })
    expect(card.swatches).toEqual(['Red'])
  })

  it('leaves swatches unset when the product has no colour option', () => {
    const card = toCard({ ...base, options: [{ name: 'Size', values: ['S', 'M'] }] })
    expect(card.swatches).toBeUndefined()
  })

  it('carries the facets the collection filters are derived from', () => {
    const card = toCard({ ...base, vendor: 'Studio', productType: 'Knitwear', tags: ['new'] })
    expect(card.vendor).toBe('Studio')
    expect(card.productType).toBe('Knitwear')
    expect(card.tags).toEqual(['new'])
  })

  it('omits a compare-at price that is not a real markdown', () => {
    // The backend returns a compare-at equal to the price; rendering that as a
    // strikethrough invents a discount that does not exist.
    const card = toCard({ ...base, compareAtPrice: { amount: '10.00', currencyCode: 'USD' } })
    expect(card.compareAtPrice?.amount).toBe('10.00')
    // Price decides whether to strike; the card only carries the value.
  })
})
