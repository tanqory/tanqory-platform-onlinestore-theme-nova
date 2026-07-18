import type { ReactNode } from 'react'

/**
 * Inline SVG icon set — replaces emoji so icons inherit `currentColor`, scale
 * crisply, and render identically across platforms (emoji do not). Add a name
 * here and it's available to any section's icon picker.
 */
const PATHS: Record<string, ReactNode> = {
  truck: (
    <>
      <path d="M3 7h11v8H3z" />
      <path d="M14 10h3.5L21 13v2h-7z" />
      <circle cx="7" cy="17" r="1.6" />
      <circle cx="17.5" cy="17" r="1.6" />
    </>
  ),
  return: (
    <>
      <path d="M9 7 4 12l5 5" />
      <path d="M4 12h10a6 6 0 0 1 6 6" />
    </>
  ),
  chat: <path d="M21 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.3A7.5 7.5 0 1 1 21 11.5z" />,
  shield: <path d="M12 3 5 6v6c0 4.2 3 7.4 7 9 4-1.6 7-4.8 7-9V6z" />,
  star: <path d="M12 3.5 14.6 9l6 .6-4.5 4 1.4 5.9L12 16.4 6.5 19.5 7.9 13.6 3.4 9.6l6-.6z" />,
  gift: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1" />
      <path d="M4 13h16M12 9v11M8.5 9a2.2 2.2 0 1 1 3.5-1.8M15.5 9a2.2 2.2 0 1 0-3.5-1.8" />
    </>
  ),
  leaf: <path d="M5 19c0-8 6-13 14-13 0 9-5 14-13 14a8 8 0 0 1 5-7" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  // Social (simplified marks)
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: <path d="M14.5 8.5H16V5.6h-1.9c-1.9 0-3.1 1.2-3.1 3.1v1.8H9v2.9h2v6.1h3v-6.1h2.1l.5-2.9H14v-1.4c0-.4.2-.6.5-.6z" />,
  x: (
    <>
      <path d="M5 5l14 14" />
      <path d="M19 5 5 19" />
    </>
  ),
  youtube: (
    <>
      <rect x="3" y="6.5" width="18" height="11" rx="3.2" />
      <path d="M11 9.8l4 2.2-4 2.2z" fill="currentColor" stroke="none" />
    </>
  ),
  tiktok: (
    <>
      <path d="M13.5 5v9.2a3.3 3.3 0 1 1-2.4-3.18" />
      <path d="M13.5 5c.4 1.9 1.9 3.2 3.9 3.4" />
    </>
  ),
}

export const ICON_NAMES = Object.keys(PATHS)

export function Icon({ name, size = 28 }: { name?: string; size?: number }): JSX.Element | null {
  const path = name ? PATHS[name] : null
  // Unknown / legacy values (e.g. an old emoji) render nothing — never an emoji.
  if (!path) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  )
}
