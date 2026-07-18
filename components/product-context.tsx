import { createContext, useContext, type ReactNode } from 'react'
import type { Product, ProductOption, ProductVariant, Money, ImageRef } from '@tanqory/theme-kit'

/**
 * Shared product + selected-variant state for PDP BLOCKS. The ProductDetails
 * section resolves the product, owns the option/quantity state, and exposes it
 * here so each block (title, price, variant-picker, add-to-cart…) reads/writes
 * the SAME state — exactly how Shopify Horizon composes a product page from
 * blocks instead of one monolithic section.
 */
export interface ProductContextValue {
  product: Product
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
