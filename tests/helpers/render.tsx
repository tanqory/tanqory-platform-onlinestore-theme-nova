/**
 * Minimal render + data harness for section tests.
 *
 * Sections read their data through theme-kit's `DataProvider` / `CartProvider`
 * / `ThemeProvider`, so tests wrap them in the real providers and hand in a
 * stub `DataApi`. That keeps the test honest about the contract the section
 * actually consumes rather than mocking the section's internals.
 */
import { act, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  CartProvider,
  DataProvider,
  ThemeProvider,
  type DataApi,
  type Product,
} from '@tanqory/theme-kit'
import type { ReactNode } from 'react'
import en from '../../locales/en.json'

// React 18's act() needs this flag, or every update logs a warning.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** Put the test's window on a given URL — sections read the route from here. */
export function setUrl(pathname: string, search = ''): void {
  window.history.replaceState({}, '', pathname + search)
}

export interface StubOptions {
  products?: Product[]
  collections?: Array<{ handle: string; title: string; products: Product[] }>
  /** Detail records returned by `fetchProduct`, keyed by handle. */
  details?: Record<string, Product>
  /** When set, `fetchProduct` resolves to null for every handle (kit's failure mode). */
  fetchProductReturnsNull?: boolean
  /** Omit `fetchProduct`/`graphql` entirely — how mock/offline data behaves. */
  offline?: boolean
  collectionProducts?: DataApi['collectionProducts']
  graphql?: DataApi['graphql']
}

/** A DataApi stub carrying only what the sections under test read. */
export function stubData(opts: StubOptions = {}): DataApi {
  const collections = opts.collections ?? []
  const products = opts.products ?? collections.flatMap((c) => c.products)

  const api: Partial<DataApi> = {
    shop: { name: 'Test Shop', policies: {} } as DataApi['shop'],
    allCollections: () => collections as never,
    collectionByHandle: ((handle: string) =>
      (collections.find((c) => c.handle === handle) as never) ?? null) as DataApi['collectionByHandle'],
    productByHandle: ((handle: string) => products.find((p) => p.handle === handle) ?? null) as DataApi['productByHandle'],
    pageByHandle: (() => null) as DataApi['pageByHandle'],
    localization: null,
  }

  if (!opts.offline) {
    api.fetchProduct = async (handle: string) => {
      if (opts.fetchProductReturnsNull) return null
      return opts.details?.[handle] ?? null
    }
    api.graphql = opts.graphql ?? (async () => ({}) as never)
  }
  if (opts.collectionProducts) api.collectionProducts = opts.collectionProducts

  return api as DataApi
}

export interface Harness {
  container: HTMLElement
  unmount: () => void
  /** Flush pending promises + effects. */
  settle: () => Promise<void>
  text: () => string
}

/** Mount `ui` inside the kit's providers and return a handle to inspect it. */
export async function renderSection(ui: ReactNode, data: DataApi): Promise<Harness> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  let root: Root
  await act(async () => {
    root = createRoot(container)
    root.render(
      <StrictMode>
        <ThemeProvider settings={{}} locale={en as Record<string, string>}>
          <DataProvider value={data}>
            <CartProvider>{ui}</CartProvider>
          </DataProvider>
        </ThemeProvider>
      </StrictMode>,
    )
  })
  const settle = async (): Promise<void> => {
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
  }
  await settle()
  return {
    container,
    settle,
    text: () => container.textContent ?? '',
    unmount: () => {
      act(() => root.unmount())
      container.remove()
    },
  }
}

/** Click an element inside act(), so the resulting state update is flushed. */
export function click(el: Element | null | undefined): void {
  if (!el) throw new Error('click(): element not found')
  act(() => {
    ;(el as HTMLElement).click()
  })
}

/** Build a minimal kit Product. */
export function product(handle: string, over: Partial<Product> = {}): Product {
  return {
    id: `gid://product/${handle}`,
    handle,
    title: handle,
    price: { amount: '10.00', currencyCode: 'USD' },
    availableForSale: true,
    ...over,
  } as Product
}
