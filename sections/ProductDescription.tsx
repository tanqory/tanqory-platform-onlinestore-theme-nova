import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { useProductContext } from '../components/product-context'

/**
 * PDP BLOCK — the product description, from the shared product context.
 *
 * Two sources, in order:
 *   1. `descriptionHtml` — the merchant's rich text WITH its formatting, already
 *      sanitised by store-api. Rendered as HTML. The theme never sanitises it:
 *      a second, weaker client-side sanitiser is how markup ends up double
 *      escaped (or, worse, how a theme starts being trusted to be the gate).
 *   2. `product.description` — PLAINTEXT (store-api strips the markup). Rendered
 *      as a text node, so nothing from this path can ever reach the DOM as
 *      markup, whatever the API returns.
 *
 * This block and the default (no-blocks) layout of `product-details` render the
 * same element, so a merchant sees the same description either way.
 */
export function ProductDescription(_props: SectionProps): JSX.Element {
  const ctx = useProductContext()
  const html = ctx?.descriptionHtml?.trim()
  if (html) return <div className="product-details__desc" dangerouslySetInnerHTML={{ __html: html }} />
  const text = ctx?.product.description?.trim()
  if (!text) return <></>
  return <div className="product-details__desc">{text}</div>
}

export default defineSection({
  name: 'product-description',
  role: 'block',
  requiresContext: ['product'],
  title: 'Product description',
  category: 'block',
  icon: '¶',
  attributes: {},
  component: ProductDescription,
})
