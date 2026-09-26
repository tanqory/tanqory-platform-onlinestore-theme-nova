import { useEffect, useState } from 'react'
import { defineSection, type SectionProps, useT } from '../lib/tanqory/index'
import { IconButton } from '../components/IconButton'

/**
 * Announcement bar — a thin store-wide notice, optionally rotating up to three
 * messages.
 *
 * The colour is a semantic ROLE, not a raw hex pair. The design's principle is
 * "semantic, never raw": a merchant picks `primary` or `surface-secondary` and
 * the text colour follows automatically, so the bar can never end up with
 * unreadable contrast the way two free-form colour pickers allowed.
 */
function parseMessages(attributes: Record<string, unknown>): { text: string; link?: string }[] {
  // Up to three messages, each its own pair of settings: an editor cannot
  // author a repeating list, so the design's `messages[]` is three explicit
  // slots rather than a JSON blob in a textarea.
  const out: { text: string; link?: string }[] = []
  for (const n of ['', '2', '3']) {
    const text = attributes[`text${n}`] as string | undefined
    if (text) {
      const link = attributes[`link${n}`] as string | undefined
      out.push(link ? { text, link } : { text })
    }
  }
  return out
}

export function AnnouncementBar({ attributes }: SectionProps): JSX.Element {
  const t = useT()
  const messages = parseMessages(attributes)
  const background = (attributes.background as string) ?? 'primary'
  const rotation = attributes.rotation === true && messages.length > 1
  const showArrows = attributes.showArrows !== false && rotation
  const dismissible = attributes.dismissible === true

  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Dismissal persists for the SESSION, per the design — not forever. A
  // merchant who changes the message expects the next visit to show it.
  useEffect(() => {
    if (!dismissible || typeof window === 'undefined') return
    try {
      if (window.sessionStorage.getItem('tq-announcement-dismissed') === '1') setDismissed(true)
    } catch {
      /* private mode — the bar simply stays visible */
    }
  }, [dismissible])

  useEffect(() => {
    if (!rotation || paused) return
    const id = window.setInterval(() => setIdx((i) => (i + 1) % messages.length), 6000)
    return () => window.clearInterval(id)
  }, [rotation, paused, messages.length])

  if (messages.length === 0 || dismissed) return <></>
  const current = messages[Math.min(idx, messages.length - 1)]!

  return (
    <div
      className="announcement-bar"
      data-background={background}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container announcement-bar__inner">
        {showArrows && (
          <IconButton
            label={t('announcement.previous')}
            className="announcement-bar__arrow"
            onClick={() => setIdx((i) => (i - 1 + messages.length) % messages.length)}
          >
            <span aria-hidden>‹</span>
          </IconButton>
        )}
        {/* `aria-live` so a rotating bar is announced once per change rather
            than read as a whole new region each time. */}
        <p className="announcement-bar__text" aria-live={rotation ? 'polite' : undefined}>
          {current.link ? (
            <a href={current.link} style={{ color: 'inherit' }}>
              {current.text}
            </a>
          ) : (
            current.text
          )}
        </p>
        {showArrows && (
          <IconButton
            label={t('announcement.next')}
            className="announcement-bar__arrow"
            onClick={() => setIdx((i) => (i + 1) % messages.length)}
          >
            <span aria-hidden>›</span>
          </IconButton>
        )}
        {dismissible && (
          <IconButton
            label={t('announcement.dismiss')}
            className="announcement-bar__dismiss"
            onClick={() => {
              setDismissed(true)
              try {
                window.sessionStorage.setItem('tq-announcement-dismissed', '1')
              } catch {
                /* nothing to persist to; the bar still hides for this view */
              }
            }}
          >
            <span aria-hidden>×</span>
          </IconButton>
        )}
      </div>
    </div>
  )
}

export default defineSection({
  name: 'announcement-bar',
  role: 'layout',
  area: 'header',
  title: 'Announcement bar',
  description: 'A one-line message across the top of every page.',
  category: 'layout',
  icon: '▔',
  attributes: {
    // No default. The bar renders nothing until the merchant writes their own
    // announcement — a theme cannot promise free shipping on a store's behalf,
    // and a default like that ships live the moment the section is placed.
    text: { type: 'text', label: 'Message 1', placeholder: 'e.g. New collection now in' },
    link: { type: 'url', label: 'Message 1 link' },
    text2: { type: 'text', label: 'Message 2' },
    link2: { type: 'url', label: 'Message 2 link' },
    text3: { type: 'text', label: 'Message 3' },
    link3: { type: 'url', label: 'Message 3 link' },
    background: {
      type: 'select',
      default: 'primary',
      label: 'Background',
      options: [
        { value: 'primary', label: 'Primary' },
        { value: 'surface-secondary', label: 'Surface secondary' },
      ],
    },
    rotation: {
      type: 'boolean',
      default: false,
      label: 'Auto-rotate messages',
      visible_if: "{{ section.settings.text2 != '' }}",
    },
    showArrows: {
      type: 'boolean',
      default: true,
      label: 'Show arrows on desktop',
      visible_if: '{{ section.settings.rotation == true }}',
    },
    dismissible: { type: 'boolean', default: false, label: 'Allow shoppers to dismiss' },
  },
  component: AnnouncementBar,
})
