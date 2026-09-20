import { useEffect, useState } from 'react'
import { defineSection, useData, type SectionProps } from '@tanqory/theme-kit'
import { Container } from '../components/Container'
import { StateBlock } from '../components/StateBlock'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

/**
 * Mirrors `locations()` in the data contract EXACTLY. `hours` and `image` are
 * declared optional and marked here because the platform does not return them
 * yet (DESIGN-GAPS F17) — declaring them once beats casting them in at each
 * use, which reads as though the data were there.
 */
interface Loc {
  id: string
  name: string
  code: string | null
  /** Not supplied by `locations()` today — see docs/DESIGN-GAPS.md (F17). */
  hours?: string
  /** Not supplied by `locations()` today — see docs/DESIGN-GAPS.md (F17). */
  image?: { url: string; altText?: string } | null
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
  const columns = Number(attributes.columns ?? 2) === 3 ? 3 : 2
  const showPhone = attributes.showPhone !== false
  // `locations()` returns no opening hours and no image — the fields do not
  // exist on the resource. Both controls stay declared so the design's contract
  // is visible in the editor, and each row simply omits what the data lacks
  // rather than printing an empty label. See docs/DESIGN-GAPS.md (F17).
  const showHours = attributes.showHours !== false
  const showImage = attributes.showImage === true
  // The design lists "Input (search)" among this section's components and an
  // Empty State for "no match". Neither existed: a shop with a dozen branches
  // gave the shopper a list to scroll and nothing to narrow it with.
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const matches = q
    ? list.filter((l) => {
        const a2 = l.address
        return [l.name, a2?.address, a2?.city, a2?.province, a2?.country, a2?.postalCode]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      })
    : list

  return (
    <section {...sharedRootProps(attributes)} className="section store-locator" data-columns={columns}>
      <Container className="store-locator__inner">
        <h2 className="store-locator__heading">{heading}</h2>
        {loaded && list.length > 1 && (
          <label className="store-locator__search field">
            <span className="u-visually-hidden">Search stores</span>
            <input
              className="field__input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder="Search by city or postcode"
            />
          </label>
        )}
        {!loaded ? (
          <p className="u-text-muted">Loading locations…</p>
        ) : list.length === 0 ? (
          <StateBlock
            title="No store locations yet"
            body="Add a location in the admin and it will appear here."
          />
        ) : matches.length === 0 ? (
          <StateBlock
            title={`No stores match “${query}”`}
            body="Try a city, a postcode, or clear the search to see every location."
            ctaLabel="Show all stores"
            onCta={() => setQuery('')}
          />
        ) : (
          <div className="store-locator__grid">
            {matches.map((l) => {
              const a = l.address
              const lines = [
                a?.address,
                [a?.city, a?.province].filter(Boolean).join(', '),
                a?.postalCode,
                a?.country,
              ].filter(Boolean) as string[]
              return (
                <div key={l.id} className="store-locator__card card card--padded card--bordered">
                  {showImage && l.image?.url && (
                    <img
                      className="store-locator__image"
                      src={l.image.url}
                      alt={l.image.altText ?? ''}
                      loading="lazy"
                    />
                  )}
                  <h3 className="store-locator__name">{l.name}</h3>
                  <address className="store-locator__address stack stack--sm">
                    {lines.map((ln, i) => (
                      <span key={i}>{ln}</span>
                    ))}
                  </address>
                  {showPhone && a?.phone && (
                    <a href={`tel:${a.phone}`} className="store-locator__phone">
                      {a.phone}
                    </a>
                  )}
                  {showHours && l.hours && <p className="store-locator__hours">{l.hours}</p>}
                  {lines.length > 0 && (
                    <a
                      className="store-locator__directions"
                      href={`https://maps.google.com/?q=${encodeURIComponent([l.name, ...lines].join(', '))}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Directions
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
  role: 'section',
  title: 'Store locator',
  category: 'commerce',
  icon: 'pin',
  attributes: withShared({
    heading: { type: 'text', label: 'Heading', default: 'Visit us' },
    // The design's `layout: list | list+map` is not declared here. `list+map`
    // needs coordinates and a map provider, and `locations()` returns neither,
    // so the control would have exactly one option and change nothing. See
    // docs/DESIGN-GAPS.md F17 — it returns when the resource carries coordinates.
    columns: {
      type: 'select',
      default: '2',
      label: 'Columns',
      options: [
        { value: '2', label: '2' },
        { value: '3', label: '3' },
      ],
    },
    showHours: { type: 'boolean', default: true, label: 'Show opening hours' },
    showPhone: { type: 'boolean', default: true, label: 'Show phone number' },
    showImage: { type: 'boolean', default: false, label: 'Show store photo' },
  }),
  component: StoreLocator,
})
