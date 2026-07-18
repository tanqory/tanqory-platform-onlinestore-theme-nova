import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { SiteHeader } from '../layouts/layout'

/**
 * Header SECTION — wraps the shared SiteHeader. Appears in the editor's Header
 * group with its own editable settings (which menu, logo override, icon
 * toggles, colours). Content still comes from data (menu items, shop name);
 * these settings choose WHICH data + how it looks — like Shopify's header.
 */
export function Header({ attributes }: SectionProps): JSX.Element {
  return <SiteHeader attributes={attributes} />
}

export default defineSection({
  name: 'header',
  title: 'Header',
  category: 'layout',
  icon: '▭',
  attributes: {
    menu: {
      type: 'select',
      default: 'main-menu',
      label: 'Navigation menu',
      options: [
        { value: 'main-menu', label: 'Main menu' },
        { value: 'footer', label: 'Footer' },
        { value: 'footer-shop', label: 'Footer · Shop' },
        { value: 'footer-help', label: 'Footer · Help' },
        { value: 'footer-company', label: 'Footer · Company' },
      ],
    },
    logo: { type: 'text', label: 'Logo text (blank = shop name)' },
    showSearch: { type: 'boolean', default: true, label: 'Show search' },
    showCart: { type: 'boolean', default: true, label: 'Show cart' },
    showAccount: { type: 'boolean', default: true, label: 'Show account' },
    showLocale: { type: 'boolean', default: true, label: 'Show language / region' },
    bg: { type: 'color', label: 'Background' },
    fg: { type: 'color', label: 'Text color' },
  },
  component: Header,
})
