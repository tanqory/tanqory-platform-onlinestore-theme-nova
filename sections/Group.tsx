import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

/**
 * Group — wraps child sections in one background, width and spacing.
 *
 * Two corrections to the previous version, both from the design:
 *  - `gap` was a raw pixel number; it is now a three-step preset.
 *  - `group` was in its own `allowedBlocks`, but the design states plainly
 *    "Nested group not allowed." A group inside a group produces double
 *    padding and an unresolvable background inheritance question.
 */
export function Group({ attributes, children }: SectionProps): JSX.Element {
  const background = (attributes.background as string) ?? 'surface-secondary'
  const innerGap = (attributes.innerGap as string) ?? 'medium'
  const sectionWidth = (attributes.sectionWidth as string) ?? 'wide'
  return (
    <section {...sharedRootProps(attributes)}
      className="section section-group"
      data-background={background}
      data-gap={innerGap}
      data-width={sectionWidth}
    >
      <div className="container section-group__inner">{children}</div>
    </section>
  )
}

export default defineSection({
  name: 'group',
  role: 'section',
  title: 'Group',
  category: 'layout',
  icon: '▤',
  attributes: withShared({
    background: {
      type: 'select',
      default: 'surface-secondary',
      label: 'Background',
      options: [
        { value: 'surface', label: 'Surface' },
        { value: 'surface-secondary', label: 'Surface secondary' },
        { value: 'primary', label: 'Primary' },
      ],
    },
    innerGap: {
      type: 'select',
      default: 'medium',
      label: 'Gap between children',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
      ],
    },
    sectionWidth: {
      type: 'select',
      default: 'wide',
      label: 'Width',
      options: [
        { value: 'standard', label: 'Standard' },
        { value: 'wide', label: 'Wide' },
        { value: 'full', label: 'Full bleed' },
      ],
    },
  }),
  allowedBlocks: [
    // Generic content blocks (standard) — compose a custom layout.
    'text', 'heading', 'button', 'image', 'icon', 'spacer',
    'video', 'accordion', 'jumbo-text', 'social-links', 'payment-icons',
    // Whole sections can also nest inside a group — except another `group`,
    // which the design forbids.
    'cart-items', 'collection-list', 'contact-form', 'faq',
    'featured-collection', 'featured-product', 'hero',
    'image-with-text', 'logo-list', 'multicolumn', 'newsletter',
    'not-found', 'product-details', 'product-grid', 'rich-text',
    'search-results', 'slideshow',
  ],
  presets: [
    {
      blocks: [
        { type: 'heading', settings: {} },
        { type: 'text', settings: {} },
      ],
    },
  ],
  component: Group,
})
