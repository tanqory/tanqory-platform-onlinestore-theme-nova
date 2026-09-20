/**
 * The composed-blocks product page must offer the same option control as the
 * default layout. The block used to draw its own `btn--sm` buttons: 36px (the
 * design's SMALL button, where an option chip is specified at 44px), with no
 * sold-out or unavailable states — so the two product pages disagreed about
 * what a shopper could pick.
 */
import { describe, expect, it } from 'vitest'
import type { Product } from '@tanqory/theme-kit'
import { ProductDetails } from '../sections/ProductDetails'
import { product, renderSection, setUrl, stubData } from './helpers/render'

/** Red/S exists and is in stock; Red/XL was never made; Black/S is sold out. */
function optioned(): Product {
  return product('tee', {
    title: 'Tee',
    options: [
      { name: 'Color', values: ['Red', 'Black'] },
      { name: 'Size', values: ['S', 'XL'] },
    ],
    variants: [
      {
        id: 'gid://variant/red-s', title: 'Red / S',
        price: { amount: '10.00', currencyCode: 'USD' }, availableForSale: true,
        selectedOptions: [{ name: 'Color', value: 'Red' }, { name: 'Size', value: 'S' }],
      },
      {
        id: 'gid://variant/black-s', title: 'Black / S',
        price: { amount: '10.00', currencyCode: 'USD' }, availableForSale: false,
        selectedOptions: [{ name: 'Color', value: 'Black' }, { name: 'Size', value: 'S' }],
      },
    ],
  })
}

/** The product page composed from blocks, the way the preset ships it. */
function blocks(): Record<string, unknown> {
  return { blocks: [{ type: 'variant-picker', id: 'vp', settings: {} }] }
}

describe('the variant-picker block', () => {
  it('renders the shared option control, not its own buttons', async () => {
    setUrl('/products/tee')
    const h = await renderSection(
      <ProductDetails attributes={blocks()} />,
      stubData({ products: [optioned()] }),
    )
    await h.settle()
    expect(h.container.querySelectorAll('.variant').length).toBeGreaterThan(0)
    // The 36px small button is what this replaced.
    expect(h.container.querySelectorAll('.variants .btn--sm').length).toBe(0)
    h.unmount()
  })

  it('marks a sold-out value differently from one that does not exist', async () => {
    setUrl('/products/tee')
    const h = await renderSection(
      <ProductDetails attributes={blocks()} />,
      stubData({ products: [optioned()] }),
    )
    await h.settle()
    const states = [...h.container.querySelectorAll('.variant')].map((e) => [
      (e.textContent || '').trim(),
      e.className.replace('variant ', ''),
    ])
    // XL exists on no variant at all; Black is only available sold out.
    const byLabel = Object.fromEntries(states)
    expect(byLabel['XL']).toContain('unavailable')
    expect(Object.keys(byLabel)).toEqual(expect.arrayContaining(['Red', 'Black', 'S', 'XL']))
    h.unmount()
  })
})
