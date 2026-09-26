import { defineSection, type SectionProps } from '../lib/tanqory/index'

/**
 * Marquee — a continuously scrolling text strip. The text repeats to fill the
 * track; speed + colours are settings.
 */
export function Marquee({ attributes }: SectionProps): JSX.Element {
  const text = (attributes.text as string) || ''
  // Speed is a three-step preset, not a raw duration in seconds. The numeric
  // value merchants already saved still resolves (see migrate-content.mjs).
  const speedPreset = (attributes.speed as string) ?? 'standard'
  const seconds = { slow: 40, standard: 24, fast: 14 }[speedPreset] ?? (Number(speedPreset) || 24)
  const direction = (attributes.direction as string) ?? 'left'
  const pauseOnHover = attributes.pauseOnHover !== false
  const background = (attributes.background as string) ?? 'surface'
  if (!text) return <></>
  // Two identical halves give a seamless loop (translateX -50%).
  const half = Array.from({ length: 6 }, (_, i) => (
    <span className="marquee__item" key={i}>
      {text}
    </span>
  ))
  return (
    <div
      className="marquee"
      data-background={background}
      data-direction={direction}
      data-pause={pauseOnHover ? 'true' : 'false'}
    >
      <div className="marquee__track" style={{ animationDuration: `${seconds}s` }}>
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
  role: 'section',
  title: 'Marquee',
  description: 'A line of text that scrolls across the page.',
  category: 'content',
  icon: '↔',
  attributes: {
    text: { type: 'text', default: 'New season just dropped', label: 'Text' },
    speed: {
      type: 'select',
      default: 'standard',
      label: 'Speed',
      options: [
        { value: 'slow', label: 'Slow' },
        { value: 'standard', label: 'Standard' },
        { value: 'fast', label: 'Fast' },
      ],
    },
    direction: {
      type: 'select',
      default: 'left',
      label: 'Direction',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ],
    },
    pauseOnHover: { type: 'boolean', default: true, label: 'Pause on hover' },
    background: {
      type: 'select',
      default: 'surface',
      label: 'Background',
      options: [
        { value: 'surface', label: 'Surface' },
        { value: 'surface-secondary', label: 'Surface secondary' },
        { value: 'primary', label: 'Primary' },
      ],
    },
  },
  component: Marquee,
})
