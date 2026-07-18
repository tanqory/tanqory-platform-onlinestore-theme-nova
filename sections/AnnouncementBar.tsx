import { defineSection, type SectionProps } from '@tanqory/theme-kit'

/**
 * Announcement bar — a thin promo strip, usually pinned above the header. All
 * content (text, link, colours) is a setting; nothing hardcoded.
 */
export function AnnouncementBar({ attributes }: SectionProps): JSX.Element {
  const text = attributes.text as string | undefined
  const link = attributes.link as string | undefined
  if (!text) return <></>
  return (
    <div
      className="announcement-bar"
      style={{ background: attributes.bg as string, color: attributes.fg as string }}
    >
      <div className="container">
        {link ? (
          <a className="announcement-bar__text" href={link} style={{ color: 'inherit' }}>
            {text}
          </a>
        ) : (
          <p className="announcement-bar__text">{text}</p>
        )}
      </div>
    </div>
  )
}

export default defineSection({
  name: 'announcement-bar',
  title: 'Announcement bar',
  category: 'layout',
  icon: '▔',
  attributes: {
    text: { type: 'text', default: 'Free shipping on orders over $50', label: 'Text' },
    link: { type: 'url', label: 'Link (optional)' },
    bg: { type: 'color', default: '#0a0a0a', label: 'Background' },
    fg: { type: 'color', default: '#ffffff', label: 'Text color' },
  },
  component: AnnouncementBar,
})
