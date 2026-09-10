import { createContext, useContext, type ReactNode } from 'react'
import type { Product, ProductOption, ProductVariant, Money, ImageRef } from '@tanqory/theme-kit'

/**
 * Shared product + selected-variant state for PDP BLOCKS. The ProductDetails
 * section resolves the product, owns the option/quantity state, and exposes it
 * here so each block (title, price, variant-picker, add-to-cart…) reads/writes
 * the SAME state — how the theme composes a product page from
 * blocks instead of one monolithic section.
 */
export interface ProductContextValue {
  product: Product
  /**
   * The merchant's rich-text product body as HTML.
   *
   * `product.description` is PLAINTEXT — store-api strips the markup out of it
   * — so it is the only safe thing to render as a text node, and it is also the
   * reason a formatted description used to arrive as one unbroken paragraph.
   * `descriptionHtml` is the same body with its formatting intact, sanitised by
   * store-api before it leaves the API. The theme renders it as-is and MUST NOT
   * sanitise, re-encode or rewrite it.
   *
   * Undefined until the fetch resolves, and null when the store has no body or
   * the theme is running on mock/offline data.
   */
  descriptionHtml?: string | null
  options: ProductOption[]
  variants: ProductVariant[]
  selected: Record<string, string>
  setOption: (name: string, value: string) => void
  selectedVariant?: ProductVariant
  displayPrice: Money
  variantImage?: ImageRef | null
  soldOut: boolean
  quantity: number
  setQuantity: (n: number) => void
  adding: boolean
  add: () => Promise<void>
}

const ProductContext = createContext<ProductContextValue | null>(null)

export function ProductProvider({
  value,
  children,
}: {
  value: ProductContextValue
  children: ReactNode
}): JSX.Element {
  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}

/** PDP blocks call this to read the shared product state. Returns null outside a PDP. */
export function useProductContext(): ProductContextValue | null {
  return useContext(ProductContext)
}
