import { defineSection, type SectionProps } from '@tanqory/theme-kit'

/**
 * Marquee — a continuously scrolling text strip. The text repeats to fill the
 * track; speed + colours are settings.
 */
export function Marquee({ attributes }: SectionProps): JSX.Element {
  const text = (attributes.text as string) || ''
  const speed = (attributes.speed as number) ?? 24
  if (!text) return <></>
  // Two identical halves give a seamless loop (translateX -50%).
  const half = Array.from({ length: 6 }, (_, i) => (
    <span className="marquee__item" key={i}>
      {text}
    </span>
  ))
  return (
    <div className="marquee" style={{ background: attributes.bg as string, color: attributes.fg as string }}>
      <div className="marquee__track" style={{ animationDuration: `${speed}s` }}>
        <div className="marquee__half">{half}</div>
        <div className="marquee__half" aria-hidden>
          {half}
        </div>
      </div>
    </div>
  )
}

export default defineSection({
  name: 'marquee',
  title: 'Marquee',
  category: 'content',
  icon: '↔',
  attributes: {
    text: { type: 'text', default: 'New season just dropped', label: 'Text' },
    speed: { type: 'range', default: 24, min: 8, max: 60, step: 2, label: 'Scroll duration (s)' },
    bg: { type: 'color', default: '#0a0a0a', label: 'Background' },
    fg: { type: 'color', default: '#ffffff', label: 'Text color' },
  },
  component: Marquee,
})
