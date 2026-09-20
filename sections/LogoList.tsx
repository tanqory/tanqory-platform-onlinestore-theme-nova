import { Children } from 'react'
import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { SectionHead } from '../components/SectionHead'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

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
  const grayscale = attributes.grayscale !== false
  const columns = [4, 5, 6].includes(Number(attributes.columns)) ? Number(attributes.columns) : 6
  const logoHeight = (attributes.logoHeight as string) ?? 'medium'

  return (
    <section {...sharedRootProps(attributes)}
      className="section section--tight"
      data-grayscale={grayscale ? 'true' : 'false'}
      data-logo-height={logoHeight}
    >
      <div className="container">
        {heading && (
          <SectionHead
            eyebrow={heading}
            description={attributes.description as string | undefined}
            align="center"
          />
        )}
        {hasBlocks ? (
          <div className="logo-list__grid" data-columns={columns}>{children}</div>
        ) : logos.length === 0 ? (
          <div className="card card--padded card--bordered u-text-center">
            <p className="u-text-muted">Add brand logos in the editor.</p>
          </div>
        ) : (
          <div className="logo-list__grid" data-columns={columns}>
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
  role: 'section',
  title: 'Logo list',
  category: 'social-proof',
  icon: '◍',
  attributes: withShared({
    description: { type: 'textarea', group: 'Content', label: 'Description' },
    heading: { type: 'text', default: 'As seen in', label: 'Heading' },
    grayscale: { type: 'boolean', default: true, label: 'Grayscale logos' },
    columns: {
      type: 'select',
      default: '6',
      label: 'Columns',
      options: [
        { value: '4', label: '4' },
        { value: '5', label: '5' },
        { value: '6', label: '6' },
      ],
    },
    logoHeight: {
      type: 'select',
      default: 'medium',
      label: 'Logo height',
      options: [
        { value: 'small', label: 'Small (24)' },
        { value: 'medium', label: 'Medium (32)' },
        { value: 'large', label: 'Large (40)' },
      ],
    },
  }),
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
