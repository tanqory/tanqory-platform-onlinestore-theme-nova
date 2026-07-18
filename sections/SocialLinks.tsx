import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { Icon } from '../components/Icon'

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'x', label: 'X' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
] as const

/** Generic SOCIAL LINKS block — a row of social icons for the handles you set. */
export function SocialLinks({ attributes }: SectionProps): JSX.Element {
  const links = PLATFORMS.map((p) => ({ ...p, url: attributes[p.key] as string | undefined })).filter(
    (p) => p.url,
  )
  if (links.length === 0) return <></>
  return (
    <div className="social-links">
      {links.map((p) => (
        <a
          key={p.key}
          href={p.url}
          aria-label={p.label}
          className="social-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name={p.key} size={20} />
        </a>
      ))}
    </div>
  )
}

export default defineSection({
  name: 'social-links',
  title: 'Social links',
  category: 'block',
  icon: '@',
  attributes: {
    instagram: { type: 'url', label: 'Instagram URL' },
    facebook: { type: 'url', label: 'Facebook URL' },
    x: { type: 'url', label: 'X (Twitter) URL' },
    tiktok: { type: 'url', label: 'TikTok URL' },
    youtube: { type: 'url', label: 'YouTube URL' },
  },
  component: SocialLinks,
})
