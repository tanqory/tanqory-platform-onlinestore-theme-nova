import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { SiteFooter } from '../layouts/layout'

/**
 * Footer SECTION — block-composed (commerce-standard standard). The columns are
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
  role: 'layout',
  area: 'footer',
  title: 'Footer',
  category: 'layout',
  icon: '▬',
  attributes: {
    // Semantic role, not a raw colour pair: `primary` inverts the text
    // automatically, which two free-form pickers could never guarantee.
    background: {
      type: 'select',
      // The design's footer is Surface Secondary by default; the dark
      // "Primary" treatment is the opt-in, not the starting point.
      default: 'surface-secondary',
      label: 'Background',
      options: [
        { value: 'surface', label: 'Surface' },
        { value: 'surface-secondary', label: 'Surface secondary' },
        { value: 'primary', label: 'Primary' },
      ],
    },
    showSocial: { type: 'boolean', default: true, label: 'Show social links' },
    showPayment: { type: 'boolean', default: true, label: 'Show payment marks' },
    showLocale: { type: 'boolean', default: true, label: 'Show language / region' },
    legalMenu: { type: 'menu', label: 'Legal menu' },
    mobileMenus: {
      type: 'select',
      default: 'accordion',
      label: 'Menus on mobile',
      options: [
        { value: 'accordion', label: 'Accordion' },
        { value: 'stacked', label: 'Stacked' },
      ],
    },
    showPoweredBy: { type: 'boolean', default: true, label: 'Show footer credit' },
    poweredByLabel: { type: 'text', default: 'Made with Tanqory', label: 'Footer credit text' },
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
