import { useEffect, useMemo, useState } from 'react'
import { routeHandle } from '../lib/routes'
import { defineSection, useData, useT, type SectionProps } from '../lib/tanqory/index'
import { Container } from '../components/Container'
import { withShared, sharedRootProps } from '../lib/shared-section-props'
import { policyTitle } from '../lib/theme-locale'

/** One on-demand call — only on /policies/* — so policy BODIES never weigh down
 *  every page's bootstrap (which prefetches just handle/title/url for footer). */
const POLICY_BODIES = /* GraphQL */ `query PolicyBodies {
  shop {
    privacyPolicy { handle title body }
    refundPolicy { handle title body }
    termsOfService { handle title body }
    shippingPolicy { handle title body }
    contactInformation { handle title body }
    legalNotice { handle title body }
    subscriptionPolicy { handle title body }
  }
}`

interface Policy {
  handle?: string
  title?: string
  body?: string
}

/**
 * Policy page — renders a shop policy (privacy / refund / terms / shipping /
 * subscription) by handle from the `/policies/<handle>` URL. A menu item of
 * type "Policy" links here. Policies are authored in Dashboard → Settings.
 */
export function PolicyPage({ attributes }: SectionProps): JSX.Element {
  const data = useData()
  const t = useT()
  const handleFromUrl = typeof window !== 'undefined' ? routeHandle(window.location.pathname, 'policy') : undefined
  const handle = (attributes.policy as string | undefined) || handleFromUrl || ''

  // Title/handle are present instantly from the boot shop.policies (mock also
  // carries the body); the body is fetched on-demand for live data.
  const boot = ((data.shop as { policies?: Record<string, Policy | null> })?.policies) ?? {}
  const bootMatch = Object.values(boot).find((p) => p && p.handle === handle) ?? null

  const [policy, setPolicy] = useState<Policy | null>(bootMatch)

  useEffect(() => {
    if (bootMatch?.body) return // mock data already has the body
    let alive = true
    void (async () => {
      const res = await data
        .graphql?.<{ shop: Record<string, Policy | null> }>(POLICY_BODIES)
        .catch(() => null)
      const found = res?.shop
        ? Object.values(res.shop).find((p) => p && p.handle === handle)
        : null
      if (alive && found) setPolicy(found)
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle])

  const showLastUpdated = attributes.showLastUpdated !== false
  const tocMode = (attributes.showTableOfContents as string) ?? 'auto'

  // Headings are parsed out of the policy HTML — the storefront API returns no
  // heading list, and a policy has no structured outline. `auto` follows the
  // design's rule of showing the TOC from six headings up.
  const headings = useMemo(() => {
    if (!policy?.body || typeof document === 'undefined') return []
    const doc = new DOMParser().parseFromString(policy.body, 'text/html')
    return [...doc.querySelectorAll('h2, h3')].map((h, i) => ({
      id: h.id || `policy-h-${i}`,
      text: h.textContent?.trim() ?? '',
      level: h.tagName === 'H3' ? 3 : 2,
    }))
  }, [policy?.body])

  const showToc = tocMode === 'always' || (tocMode === 'auto' && headings.length >= 6)

  // Ids have to exist on the REAL nodes for the links to land, so they are
  // stamped into the html we render, not only onto the parsed copy.
  const bodyHtml = useMemo(() => {
    if (!policy?.body || !showToc || typeof document === 'undefined') return policy?.body ?? ''
    const doc = new DOMParser().parseFromString(policy.body, 'text/html')
    doc.querySelectorAll('h2, h3').forEach((h, i) => {
      if (!h.id) h.id = `policy-h-${i}`
    })
    return doc.body.innerHTML
  }, [policy?.body, showToc])

  // `updatedAt` is not on ShopPolicy — the storefront API does not expose one.
  // The control stays so the design's contract is visible, and the line simply
  // does not render until the field exists. See docs/DESIGN-GAPS.md (F19).
  const updatedAt = (policy as { updatedAt?: string } | null)?.updatedAt

  return (
    <section {...sharedRootProps(attributes)} className="section policy-page" data-toc={showToc ? 'true' : 'false'}>
      <Container className="policy-page__inner">
        {policy ? (
          <>
            {/* store-api gives every policy an English stock title; the heading
             *  follows the theme's language instead (lib/theme-locale.ts). */}
            <h1 className="policy-page__title">{policyTitle(policy.handle ?? handle, policy.title, t)}</h1>
            {showLastUpdated && updatedAt && (
              <p className="policy-page__updated">
                Last updated{' '}
                <time dateTime={updatedAt}>{new Date(updatedAt).toLocaleDateString()}</time>
              </p>
            )}
            {showToc && headings.length > 0 && (
              <nav className="policy-page__toc" aria-label={t('policy.onThisPage')}>
                <p className="policy-page__toc-title">{t('policy.onThisPage')}</p>
                <ol>
                  {headings.map((h) => (
                    <li key={h.id} data-level={h.level}>
                      <a href={`#${h.id}`}>{h.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            {policy.body ? (
              <div
                className="policy-page__body rte"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            ) : (
              <p className="u-text-muted">{t('policy.loading')}</p>
            )}
          </>
        ) : (
          <div className="card card--padded card--bordered u-text-center">
            <p className="u-text-muted">{t('policy.unavailable')}</p>
          </div>
        )}
      </Container>
    </section>
  )
}

export default defineSection({
  name: 'policy-page',
  role: 'section',
  requiresContext: ['policy'],
  title: 'Policy',
  description: 'The full text of a store policy.',
  category: 'commerce',
  icon: 'doc',
  attributes: withShared({
    policy: { type: 'text', label: 'Policy handle (blank = from URL)' },
    showLastUpdated: { type: 'boolean', default: true, label: 'Show last-updated date' },
    showTableOfContents: {
      type: 'select',
      default: 'auto',
      label: 'Table of contents',
      info: 'Auto shows it once the policy has six or more headings.',
      options: [
        { value: 'auto', label: 'Automatic' },
        { value: 'always', label: 'Always' },
        { value: 'never', label: 'Never' },
      ],
    },
  }),
  component: PolicyPage,
})
