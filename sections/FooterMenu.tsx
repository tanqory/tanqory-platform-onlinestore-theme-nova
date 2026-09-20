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

  // Nothing to label and nothing to reveal — render nothing. While a menu is
  // still resolving, or when the handle points at a menu the shop does not
  // have, this shipped a <details> with an empty <summary>: a disclosure with
  // no name, which an audit reported on eight pages. Same rule as the FAQ item
  // with no answer.
  if (!heading && links.length === 0) return <></>

  // `<details open>` rather than a plain div: at 390 the design collapses the
  // footer menus into accordions. Open by default and forced open above 768 in
  // CSS, so desktop is unchanged and the mobile affordance costs no JS —
  // keyboard and no-JS both keep working.
  return (
    <details className="site-footer__col" open>
      <summary className="site-footer__col-toggle">
        {/* A plain span, with neither a heading element nor a heading role. The
            accessible name of a <summary> is computed from its contents, and
            this engine skips a child that carries a structural role — both the
            <h3> and the role="heading" version left these three disclosures
            unnamed. They are labels for a disclosure widget, not headings. */}
        {heading && <span className="site-footer__col-title">{heading}</span>}
      </summary>
      <ul>
        {links.map((it) => (
          <li key={`${it.url}-${it.title}`}>
            <a href={it.url as string}>{it.title}</a>
          </li>
        ))}
      </ul>
    </details>
  )
}

export default defineSection({
  name: 'footer-menu',
  role: 'block',
  title: 'Menu',
  category: 'block',
  icon: 'chat',
  attributes: {
    // `menu` = pick a real store menu (Dashboard → Navigation). The editor
    // renders a dropdown populated from the storefront `menus` query. (It also
    // accepts the `link_list` alias; `menu` is the kit's declared spelling.)
    menu: { type: 'menu', label: 'Menu' },
    heading: { type: 'text', label: 'Heading (blank = menu name)' },
  },
  component: FooterMenu,
})
