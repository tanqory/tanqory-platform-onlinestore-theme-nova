import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { useMenu } from '../components/use-menu'

/**
 * Footer BLOCK — a navigation column. The merchant picks one of the store's
 * REAL menus (Dashboard → Navigation) via the `link_list` picker; the column
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
    // `link_list` = pick a real store menu (Dashboard → Navigation). The editor
    // renders a dropdown populated from the storefront `menus` query.
    menu: { type: 'link_list', label: 'Menu' },
    heading: { type: 'text', label: 'Heading (blank = menu name)' },
  },
  component: FooterMenu,
})
