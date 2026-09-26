import { createContext, useContext, type ReactNode } from 'react'
import type { Product, ProductOption, ProductVariant, Money, ImageRef } from '../lib/tanqory/index'
import type { OptionValueState } from './VariantPicker'

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
   * Null when the store has no rich-text body, when the fetch has not resolved
   * yet, or when the theme is running on mock/offline data. Consumers fall back
   * to `product.description` (plaintext) in all three cases.
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
  /**
   * Why the add failed, in the shopper's language, or null. Every PDP block
   * that renders a buy button reads this so the failure is visible wherever the
   * shopper clicked — not only in the default layout.
   */
  addError?: string | null
  /**
   * True only when a concrete, purchasable variant is resolved. False while
   * variants are still loading and false when the on-screen option combination
   * does not exist or is sold out. A buy button must gate on THIS, never on
   * `!soldOut` alone, or an unmatched combination adds a different variant.
   */
  canAdd?: boolean
  /**
   * Whether one option value is available, merely sold out, or not a
   * combination that exists — given everything else currently selected.
   *
   * Exposed here so a PDP block renders exactly the states the default
   * layout does. The block used to draw its own plain buttons with no
   * states at all, and the two product pages disagreed about what a
   * shopper could pick.
   */
  optionValueState?: (optionName: string, value: string) => OptionValueState
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
