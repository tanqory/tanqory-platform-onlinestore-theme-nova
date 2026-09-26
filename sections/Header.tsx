import { defineSection, type SectionProps } from '../lib/tanqory/index'
import { SiteHeader } from '../layouts/layout'

/**
 * Header SECTION — wraps the shared SiteHeader. Appears in the editor's Header
 * group with its own editable settings (which menu, logo override, icon
 * toggles, colours). Content still comes from data (menu items, shop name);
 * these settings choose WHICH data + how it looks — a standard commerce header.
 */
export function Header({ attributes }: SectionProps): JSX.Element {
  return <SiteHeader attributes={attributes} />
}

export default defineSection({
  name: 'header',
  role: 'layout',
  area: 'header',
  title: 'Header',
  description: 'Logo, navigation, search and cart at the top of every page.',
  category: 'layout',
  icon: '▭',
  attributes: {
    // The design's two header layout controls. Semantic values, never raw
    // positions — the CSS decides what `logo-center` means.
    layout: {
      type: 'select',
      // The design's default is a centred logo with the navigation on the
      // left — not Nova's old logo-left arrangement.
      default: 'logo-center',
      label: 'Layout',
      options: [
        { value: 'logo-left', label: 'Logo left' },
        { value: 'logo-center', label: 'Logo center' },
      ],
    },
    sticky: {
      type: 'select',
      default: 'always',
      label: 'Sticky header',
      options: [
        { value: 'always', label: 'Always' },
        { value: 'on-scroll-up', label: 'On scroll up' },
        { value: 'none', label: 'Never' },
      ],
    },
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
    logo: { type: 'text', label: 'Logo text — shown when there is no logo image (blank = shop name)' },
    transparentOnHero: {
      type: 'boolean',
      default: false,
      label: 'Transparent over hero',
      info: 'Requires the first section to be an image hero with overlay medium or stronger.',
    },
    logoHeight: {
      type: 'select',
      default: 'medium',
      label: 'Logo height',
      options: [
        { value: 'small', label: 'Small (24)' },
        { value: 'medium', label: 'Medium (32)' },
        { value: 'large', label: 'Large (40)' },
      ],
    },
    showSearch: { type: 'boolean', default: true, label: 'Show search' },
    searchStyle: {
      type: 'select',
      default: 'icon',
      label: 'Search style',
      visible_if: '{{ section.settings.showSearch == true }}',
      options: [
        { value: 'icon', label: 'Icon' },
        { value: 'inline-field', label: 'Inline field' },
      ],
    },
    cartAction: {
      type: 'select',
      default: 'drawer',
      label: 'Cart opens',
      options: [
        { value: 'drawer', label: 'Drawer' },
        { value: 'page', label: 'Cart page' },
      ],
    },
    showCart: { type: 'boolean', default: true, label: 'Show cart' },
    showAccount: { type: 'boolean', default: true, label: 'Show account' },
    // The design's header carries search, account and cart only; the language
    // and region selector lives in the footer. Off by default, still available.
    showLocale: { type: 'boolean', default: false, label: 'Show language / region' },
    bg: { type: 'color', label: 'Background' },
    fg: { type: 'color', label: 'Text color' },
  },
  component: Header,
})
