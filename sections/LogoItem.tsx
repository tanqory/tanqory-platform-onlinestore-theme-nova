import { defineSection, type SectionProps } from '../lib/tanqory/index'

/**
 * Logo — CHILD BLOCK of Logo list. One brand mark (image URL + alt +
 * optional link). Replaces the old "Logos JSON" textarea with per-logo
 * blocks the merchant adds and reorders from the section tree.
 */
export function LogoItem({ attributes }: SectionProps): JSX.Element {
  const src = attributes.src as string | undefined
  const alt = (attributes.alt as string) ?? ''
  const href = attributes.href as string | undefined
  // An empty slot shows the theme's neutral placeholder, the same one every
  // other missing image uses. It used to print the literal word "Logo", which
  // reads as real content on a live shop rather than as "nothing here yet".
  const inner = src ? (
    <img src={src} alt={alt} loading="lazy" decoding="async" />
  ) : (
    <span className="tq-placeholder logo-list__placeholder" role="img" aria-label={alt || 'Logo placeholder'} />
  )
  return href ? (
    <a href={href} className="logo-list__item">
      {inner}
    </a>
  ) : (
    <div className="logo-list__item">{inner}</div>
  )
}

export default defineSection({
  name: 'logo',
  role: 'block',
  title: 'Logo',
  description: 'One logo in a logo list.',
  category: 'block',
  icon: '◍',
  attributes: {
    src: { type: 'image', label: 'Image' },
    alt: { type: 'text', label: 'Brand name (alt text)' },
    href: { type: 'url', label: 'Link (optional)' },
  },
  component: LogoItem,
})
