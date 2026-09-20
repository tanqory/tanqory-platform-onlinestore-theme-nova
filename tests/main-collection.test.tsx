/**
 * The collection page must list the collection in the URL.
 *
 * Before: `templates/collection.json` placed `featured-collection` with a
 * hardcoded `"collection": "all"`, so /collections/sale, /collections/new-in
 * and every other collection URL listed the `all` collection.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DataApi, Product } from '@tanqory/theme-kit'
import { MainCollection } from '../sections/MainCollection'
import { product, renderSection, setUrl, stubData } from './helpers/render'

const EMPTY_PAGE_INFO = { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null }

/** `collectionProducts` backed by a fixed catalogue. */
function collectionProductsFrom(
  catalogue: Record<string, Product[]>,
  opts: { pageSize?: number } = {},
): DataApi['collectionProducts'] {
  const size = opts.pageSize ?? 50
  return (async (handle: string, o?: { first?: number; after?: string }) => {
    const all = catalogue[handle] ?? []
    const start = o?.after ? Number(o.after) : 0
    const first = Math.min(o?.first ?? size, size)
    const slice = all.slice(start, start + first)
    const end = start + slice.length
    return {
      products: slice,
      filters: [],
      pageInfo: { ...EMPTY_PAGE_INFO, hasNextPage: end < all.length, endCursor: String(end) },
    }
  }) as DataApi['collectionProducts']
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('collection A vs collection B', () => {
  const catalogue = {
    sale: [product('sale-1', { title: 'Sale One' }), product('sale-2', { title: 'Sale Two' })],
    'new-in': [product('new-1', { title: 'New One' })],
    all: [product('any-1', { title: 'Any One' })],
  }

  it('lists the products of the collection in the URL', async () => {
    setUrl('/collections/sale')
    const data = stubData({
      collections: [{ handle: 'sale', title: 'Sale', products: [] }],
      collectionProducts: collectionProductsFrom(catalogue),
    })
    const h = await renderSection(<MainCollection attributes={{ limit: 24 }} />, data)
    await h.settle()
    expect(h.text()).toContain('Sale One')
    expect(h.text()).toContain('Sale Two')
    expect(h.text()).not.toContain('Any One')
    expect(h.text()).not.toContain('New One')
    h.unmount()
  })

  it('shows a different collection for a different URL', async () => {
    setUrl('/collections/new-in')
    const data = stubData({
      collections: [{ handle: 'new-in', title: 'New in', products: [] }],
      collectionProducts: collectionProductsFrom(catalogue),
    })
    const h = await renderSection(<MainCollection attributes={{ limit: 24 }} />, data)
    await h.settle()
    expect(h.text()).toContain('New One')
    expect(h.text()).not.toContain('Sale One')
    h.unmount()
  })

  it("uses the collection's own title as the heading", async () => {
    setUrl('/collections/sale')
    const data = stubData({
      collections: [{ handle: 'sale', title: 'Mid-season sale', products: [] }],
      collectionProducts: collectionProductsFrom(catalogue),
    })
    const h = await renderSection(<MainCollection attributes={{}} />, data)
    await h.settle()
    expect(h.container.querySelector('h1')?.textContent).toBe('Mid-season sale')
    h.unmount()
  })

  it('ignores a section-level collection override on a real collection URL', async () => {
    setUrl('/collections/sale')
    const data = stubData({
      collections: [{ handle: 'sale', title: 'Sale', products: [] }],
      collectionProducts: collectionProductsFrom(catalogue),
    })
    const h = await renderSection(<MainCollection attributes={{ collection: 'all' }} />, data)
    await h.settle()
    expect(h.text()).toContain('Sale One')
    expect(h.text()).not.toContain('Any One')
    h.unmount()
  })
})

describe('pagination', () => {
  it('reaches products beyond the first page instead of truncating', async () => {
    setUrl('/collections/big')
    const many = Array.from({ length: 5 }, (_, i) => product(`p${i}`, { title: `Item ${i}` }))
    const data = stubData({
      collections: [{ handle: 'big', title: 'Big', products: [] }],
      collectionProducts: collectionProductsFrom({ big: many }),
    })
    const h = await renderSection(<MainCollection attributes={{ limit: 2 }} />, data)
    await h.settle()

    expect(h.text()).toContain('Item 0')
    expect(h.text()).toContain('Item 1')
    // Item 4 used to be unreachable: the section rendered `limit` products and
    // the collection page offered no way to see the rest.
    expect(h.text()).not.toContain('Item 4')

    const more = [...h.container.querySelectorAll('button')].find((b) =>
      /load more/i.test(b.textContent ?? ''),
    )
    expect(more).toBeDefined()
    const { click } = await import('./helpers/render')
    click(more)
    await h.settle()
    expect(h.text()).toContain('Item 2')
    expect(h.text()).toContain('Item 3')
    h.unmount()
  })
})

describe('a collection URL that does not exist', () => {
  it('shows not-found, not the raw handle as a page heading', async () => {
    setUrl('/collections/does-not-exist')
    const data = stubData({
      // main.tsx prefetches the route's collection; nothing cached for this
      // handle means the store does not have it.
      collections: [{ handle: 'all', title: 'All', products: [] }],
      collectionProducts: collectionProductsFrom({}),
    })
    const h = await renderSection(<MainCollection attributes={{}} />, data)
    await h.settle()
    expect(h.container.querySelector('h1')?.textContent).not.toBe('does-not-exist')
    expect(h.text()).toMatch(/collection not found/i)
    h.unmount()
  })
})

describe('failure and empty states', () => {
  it('says the products could not be loaded rather than "no products"', async () => {
    setUrl('/collections/sale')
    const data = stubData({
      collections: [{ handle: 'sale', title: 'Sale', products: [] }],
      collectionProducts: (async () => {
        throw new Error('cell unreachable')
      }) as DataApi['collectionProducts'],
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const h = await renderSection(<MainCollection attributes={{}} />, data)
    await h.settle()
    // An empty collection and an unreachable backend are different facts; a
    // merchant debugging "where did my products go" needs them distinguished.
    expect(h.text()).toMatch(/couldn't load|could not load/i)
    h.unmount()
  })

  it('reports an empty collection as empty', async () => {
    setUrl('/collections/sale')
    const data = stubData({
      collections: [{ handle: 'sale', title: 'Sale', products: [] }],
      collectionProducts: collectionProductsFrom({ sale: [] }),
    })
    const h = await renderSection(<MainCollection attributes={{}} />, data)
    await h.settle()
    expect(h.text()).toMatch(/no products/i)
    h.unmount()
  })
})
