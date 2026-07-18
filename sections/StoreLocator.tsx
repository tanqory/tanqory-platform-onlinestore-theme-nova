import { useEffect, useState } from 'react'
import { defineSection, useData, type SectionProps } from '@tanqory/theme-kit'
import { Container } from '../components/Container'

interface Loc {
  id: string
  name: string
  code: string | null
  address: {
    country: string | null
    address: string | null
    city: string | null
    province: string | null
    postalCode: string | null
    phone: string | null
  } | null
}

/**
 * Store locator — lists the merchant's physical STORE locations (Settings →
 * Locations) via data.locations(). Add it to any page; a menu item of type
 * "Map" / store-locator links to that page.
 */
export function StoreLocator({ attributes }: SectionProps): JSX.Element {
  const { locations } = useData()
  const [list, setList] = useState<Loc[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    void (locations?.() ?? Promise.resolve([]))
      .then((r) => {
        if (alive) {
          setList(Array.isArray(r) ? (r as Loc[]) : [])
          setLoaded(true)
        }
      })
      .catch(() => {
        if (alive) setLoaded(true)
      })
    return () => {
      alive = false
    }
  }, [locations])

  const heading = (attributes.heading as string) ?? 'Visit us'

  return (
    <section className="section store-locator">
      <Container className="store-locator__inner">
        <h2 className="store-locator__heading">{heading}</h2>
        {!loaded ? (
          <p className="u-text-muted">Loading locations…</p>
        ) : list.length === 0 ? (
          <div className="card card--padded card--bordered u-text-center">
            <p className="u-text-muted">No store locations yet.</p>
          </div>
        ) : (
          <div className="store-locator__grid">
            {list.map((l) => {
              const a = l.address
              const lines = [
                a?.address,
                [a?.city, a?.province].filter(Boolean).join(', '),
                a?.postalCode,
                a?.country,
              ].filter(Boolean) as string[]
              return (
                <div key={l.id} className="store-locator__card card card--padded card--bordered">
                  <h3 className="store-locator__name">{l.name}</h3>
                  <address className="store-locator__address stack stack--sm">
                    {lines.map((ln, i) => (
                      <span key={i}>{ln}</span>
                    ))}
                  </address>
                  {a?.phone && (
                    <a href={`tel:${a.phone}`} className="store-locator__phone">
                      {a.phone}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Container>
    </section>
  )
}

export default defineSection({
  name: 'store-locator',
  title: 'Store locator',
  category: 'commerce',
  icon: 'pin',
  attributes: {
    heading: { type: 'text', label: 'Heading', default: 'Visit us' },
  },
  component: StoreLocator,
})
