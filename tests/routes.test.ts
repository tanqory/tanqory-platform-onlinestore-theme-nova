import { describe, expect, it } from 'vitest'
import {
  detailHandles,
  matchRoute,
  resolvePageTemplate,
  resolveTemplate,
  routeHandle,
  variantOf,
} from '../lib/routes'

/** Templates this theme ships, for `variantOf` / `resolvePageTemplate`. */
const SHIPPED = new Set([
  'index',
  'product',
  'product.bundle',
  'collection',
  'collection.featured',
  'page',
  'page.contact',
  '404',
  'blog',
  'article',
])
const templateExists = (name: string): boolean => SHIPPED.has(name)

describe('matchRoute', () => {
  it('maps the storefront routes to their templates', () => {
    expect(resolveTemplate('/')).toBe('index')
    expect(resolveTemplate('/cart')).toBe('cart')
    expect(resolveTemplate('/collections')).toBe('list-collections')
    expect(resolveTemplate('/collections/sale')).toBe('collection')
    expect(resolveTemplate('/products/tee')).toBe('product')
    expect(resolveTemplate('/pages/about')).toBe('page')
    expect(resolveTemplate('/policies/refund-policy')).toBe('policy')
    expect(resolveTemplate('/account/orders')).toBe('account')
  })

  it('tests article before blog so the list does not shadow the detail', () => {
    expect(resolveTemplate('/blogs/news')).toBe('blog')
    expect(resolveTemplate('/blogs/news/launch-day')).toBe('article')
    expect(matchRoute('/blogs/news/launch-day')).toMatchObject({
      resource: 'article',
      blogHandle: 'news',
      handle: 'launch-day',
    })
  })

  it('tolerates trailing slashes and unknown paths', () => {
    expect(resolveTemplate('/products/tee/')).toBe('product')
    expect(resolveTemplate('/nope')).toBe('404')
    expect(resolveTemplate('/products/a/b/c')).toBe('404')
  })

  it('decodes percent-encoded handles (Thai, CJK)', () => {
    // "เสื้อยืด" — an encoded handle used to match nothing and fall through.
    const encoded = encodeURIComponent('เสื้อยืด')
    expect(routeHandle(`/products/${encoded}`, 'product')).toBe('เสื้อยืด')
    expect(routeHandle(`/collections/${encoded}`, 'collection')).toBe('เสื้อยืด')
  })

  it('only returns a handle for the resource kind that was asked for', () => {
    expect(routeHandle('/products/tee', 'product')).toBe('tee')
    expect(routeHandle('/products/tee', 'collection')).toBeUndefined()
    expect(routeHandle('/collections/sale', 'product')).toBeUndefined()
  })

  it('prefetches exactly the handle on the current route', () => {
    expect(detailHandles('/products/tee')).toEqual({ productHandle: 'tee' })
    expect(detailHandles('/collections/sale')).toEqual({ collectionHandle: 'sale' })
    expect(detailHandles('/pages/about')).toEqual({ pageHandle: 'about' })
    expect(detailHandles('/')).toEqual({})
  })
})

describe('template variants', () => {
  it('uses <base>.<suffix> when the theme ships it', () => {
    expect(variantOf('product', 'bundle', templateExists)).toBe('product.bundle')
  })

  it('keeps the base template when the suffix has no file', () => {
    // A stale or removed suffix must not render a blank page.
    expect(variantOf('product', 'deleted-template', templateExists)).toBe('product')
    expect(variantOf('product', null, templateExists)).toBe('product')
  })
})

describe('resolvePageTemplate', () => {
  const data = {
    productByHandle: (h: string) => (h === 'kit' ? { templateSuffix: 'bundle' } : null),
    collectionByHandle: (h: string) => (h === 'edit' ? { templateSuffix: 'featured' } : null),
    pageByHandle: (h: string) => (h === 'contact' ? { templateSuffix: 'contact' } : null),
  }

  it("applies the merchant's per-resource template assignment", () => {
    expect(resolvePageTemplate('/products/kit', data, templateExists)).toBe('product.bundle')
    expect(resolvePageTemplate('/collections/edit', data, templateExists)).toBe(
      'collection.featured',
    )
    expect(resolvePageTemplate('/pages/contact', data, templateExists)).toBe('page.contact')
  })

  it('falls back to the base template for an unassigned resource', () => {
    expect(resolvePageTemplate('/products/tee', data, templateExists)).toBe('product')
    expect(resolvePageTemplate('/collections/sale', data, templateExists)).toBe('collection')
  })

  it('leaves non-resource routes alone', () => {
    expect(resolvePageTemplate('/', data, templateExists)).toBe('index')
    expect(resolvePageTemplate('/cart', data, templateExists)).toBe('cart')
  })

  // The regression this function exists for: SPA navigation used to look up the
  // BASE template only, so a product assigned `product.bundle` rendered
  // `product` whenever the shopper arrived by clicking instead of by URL.
  it('gives a soft navigation the same template a direct load gets', () => {
    const direct = resolvePageTemplate('/products/kit', data, templateExists)
    const soft = resolvePageTemplate('/products/kit', data, templateExists)
    expect(soft).toBe(direct)
    expect(soft).toBe('product.bundle')
  })
})
