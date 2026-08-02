import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { useMenu } from '../components/use-menu'

/**
 * Footer BLOCK — a navigation column. The merchant picks one of the store's
 * REAL menus (Dashboard → Navigation) via the `menu` picker; the column
 * renders its live items. Heading falls back to the menu's own name.
 */
export function FooterMenu({ attributes }: SectionProps): JSX.Element {
  const handle = (attributes.menu as string) || ''
  const menu = useMenu(handle)
  const heading = (attributes.heading as string) || menu?.title || ''
  const links = (menu?.items ?? []).filter((it) => Boolean(it.url))
  return (
    <div className="site-footer__col">
      {heading && <h6>{heading}</h6>}
      <ul>
        {links.map((it) => (
          <li key={`${it.url}-${it.title}`}>
            <a href={it.url as string}>{it.title}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default defineSection({
  name: 'footer-menu',
  title: 'Menu',
  category: 'block',
  icon: 'chat',
  attributes: {
    // `menu` = pick a real store menu (Dashboard → Navigation); value is the
    // menu handle. The editor renders a dropdown populated from the storefront
    // `menus` query.
    //
    // This was `link_list`, which is NOT one of the 20 AttrSpec types — the
    // editor's server-side gate silently coerced it to `text`, so the merchant
    // got a free-text box and had to type a handle from memory. `menu` is the
    // declared type for exactly this (see AttrSpec in @tanqory/theme-kit), and
    // it is what config/settings.schema.ts already uses for the header/footer
    // menu settings.
    menu: { type: 'menu', label: 'Menu' },
    heading: { type: 'text', label: 'Heading (blank = menu name)' },
  },
  component: FooterMenu,
})
