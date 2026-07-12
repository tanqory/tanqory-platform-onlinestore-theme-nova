import { useEffect, useState } from 'react'
import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { apiBase } from '../lib/api-base'
import { Container } from '../components/Container'
import { SectionHead } from '../components/SectionHead'

/**
 * Store locator — renders the merchant's physical locations (Settings → Locations),
 * served by the storefront GraphQL `locations` resolver. Self-contained fetch
 * (same pattern as PageBody/PolicyBody) so it works against the baked theme-kit.
 */
interface Loc {
  id: string
  name: string
  address?: {
    country?: string | null
    address?: string | null
    city?: string | null
    province?: string | null
    postalCode?: string | null
    phone?: string | null
  } | null
}

export function StoreLocations({ attributes }: SectionProps): JSX.Element | null {
  const heading = (attributes.heading as string) || 'Our stores'
  const subheading = attributes.subheading as string | undefined
  const [locations, setLocations] = useState<Loc[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const env = import.meta.env as ImportMetaEnv & {
      VITE_TANQORY_BACKEND?: string
      VITE_TANQORY_STORE_ID?: string
      VITE_TANQORY_STOREFRONT_TOKEN?: string
    }
    if (!env.VITE_TANQORY_BACKEND || !env.VITE_TANQORY_STORE_ID) {
      setLoaded(true)
      return
    }
    const url = `${apiBase(env.VITE_TANQORY_BACKEND)}/api/v1/stores/${encodeURIComponent(
      env.VITE_TANQORY_STORE_ID,
    )}/graphql`
    let cancelled = false
    fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(env.VITE_TANQORY_STOREFRONT_TOKEN
          ? { 'x-publishable-key': env.VITE_TANQORY_STOREFRONT_TOKEN }
          : {}),
      },
      body: JSON.stringify({
        query: `query Locs {
          locations {
            id name
            address { address city province postalCode country phone }
          }
        }`,
      }),
    })
      .then((r) => r.json())
      .then((j: { data?: { locations?: Loc[] } }) => {
        if (cancelled) return
        setLocations(j.data?.locations ?? [])
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loaded && locations.length === 0) return null

  const line = (l: Loc): string =>
    [l.address?.address, l.address?.city, l.address?.province, l.address?.postalCode, l.address?.country]
      .filter(Boolean)
      .join(', ')

  return (
    <section className="section">
      <Container>
        <SectionHead heading={heading} subheading={subheading} align="center" />
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {locations.map((l) => (
            <div key={l.id} className="stack stack--sm">
              <h4 style={{ margin: 0 }}>{l.name}</h4>
              {line(l) && <p className="u-text-muted" style={{ margin: 0 }}>{line(l)}</p>}
              {l.address?.phone && (
                <a href={`tel:${l.address.phone}`} className="u-text-muted">
                  {l.address.phone}
                </a>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

export default defineSection({
  name: 'store-locations',
  title: 'Store locations',
  category: 'content',
  icon: '📍',
  attributes: {
    heading: { type: 'text', label: 'Heading', default: 'Our stores' },
    subheading: { type: 'text', label: 'Subheading', default: '' },
  },
  component: StoreLocations,
})
