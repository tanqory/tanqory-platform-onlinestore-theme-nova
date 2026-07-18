import { Children } from 'react'
import { defineSection, type SectionProps } from '@tanqory/theme-kit'

type Logo = { src?: string; alt?: string; href?: string }

function parseLogos(raw: unknown): Logo[] {
  if (Array.isArray(raw)) return raw as Logo[]
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return JSON.parse(raw) as Logo[]
    } catch {
      /* swallow */
    }
  }
  return []
}

export function LogoList({ attributes, children }: SectionProps): JSX.Element {
  const logos = parseLogos(attributes.logos)
  const heading = attributes.heading as string | undefined
  // BLOCK MODE: child `logo` blocks added in the editor render as-is, in
  // their tree order. LEGACY MODE: fall back to the logos-JSON setting so
  // templates written before the block standard keep rendering.
  const hasBlocks = Children.count(children) > 0

  return (
    <section className="section section--tight">
      <div className="container">
        {heading && (
          <div className="logo-list__head">
            <span className="eyebrow">{heading}</span>
          </div>
        )}
        {hasBlocks ? (
          <div className="logo-list__grid">{children}</div>
        ) : logos.length === 0 ? (
          <div className="card card--padded card--bordered u-text-center">
            <p className="u-text-muted">Add brand logos in the editor.</p>
          </div>
        ) : (
          <div className="logo-list__grid">
            {logos.map((logo, i) => {
              const inner = logo.src ? (
                <img src={logo.src} alt={logo.alt ?? ''} loading="lazy" decoding="async" />
              ) : (
                <span>{logo.alt}</span>
              )
              return logo.href ? (
                <a key={i} href={logo.href} className="logo-list__item">
                  {inner}
                </a>
              ) : (
                <div key={i} className="logo-list__item">
                  {inner}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default defineSection({
  name: 'logo-list',
  title: 'Logo list',
  category: 'social-proof',
  icon: '◍',
  attributes: {
    heading: { type: 'text', default: 'As seen in', label: 'Heading' },
    logos: {
      type: 'textarea',
      label: 'Logos JSON (legacy — prefer Add block)',
      default: '[]',
    },
  },
  allowedBlocks: ['logo'],
  presets: [
    {
      blocks: [
        { type: 'logo', settings: { alt: 'Brand 1' } },
        { type: 'logo', settings: { alt: 'Brand 2' } },
        { type: 'logo', settings: { alt: 'Brand 3' } },
        { type: 'logo', settings: { alt: 'Brand 4' } },
      ],
    },
  ],
  component: LogoList,
})
