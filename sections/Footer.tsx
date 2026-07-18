import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { SiteFooter } from '../layouts/layout'

/**
 * Footer SECTION — block-composed (Shopify Horizon-style). The columns are
 * BLOCKS (Brand information / Menu / Text / Social / Newsletter) the merchant
 * adds, reorders and configures. The SECTION keeps only frame-level settings
 * (colours, language switcher, credit). With no blocks, SiteFooter renders the
 * data-driven default (brand + the three standard menu columns).
 */
export function Footer({ attributes, children }: SectionProps): JSX.Element {
  return <SiteFooter attributes={attributes}>{children}</SiteFooter>
}

export default defineSection({
  name: 'footer',
  title: 'Footer',
  category: 'layout',
  icon: '▬',
  attributes: {
    showLocale: { type: 'boolean', default: true, label: 'Show language / region' },
    showPoweredBy: { type: 'boolean', default: true, label: 'Show footer credit' },
    poweredByLabel: { type: 'text', default: 'Made with Tanqory', label: 'Footer credit text' },
    bg: { type: 'color', label: 'Background' },
    fg: { type: 'color', label: 'Text color' },
  },
  allowedBlocks: ['footer-brand', 'footer-menu', 'footer-text', 'social-links', 'newsletter', 'payment-icons'],
  presets: [
    {
      blocks: [
        { type: 'footer-brand', settings: { title: 'Your store', tagline: 'A short line about your brand.' } },
        { type: 'footer-menu', settings: { heading: 'Shop' } },
        { type: 'footer-menu', settings: { heading: 'Help' } },
        { type: 'footer-menu', settings: { heading: 'Company' } },
      ],
    },
  ],
  component: Footer,
})
