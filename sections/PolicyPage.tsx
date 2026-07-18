import { useEffect, useState } from 'react'
import { decodeHandle } from '../lib/handle'
import { defineSection, useData, type SectionProps } from '@tanqory/theme-kit'
import { Container } from '../components/Container'

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
  const handleFromUrl =
    typeof window !== 'undefined'
      ? decodeHandle(window.location.pathname.match(/\/policies\/([^/]+)/)?.[1])
      : undefined
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

  return (
    <section className="section policy-page">
      <Container className="policy-page__inner">
        {policy ? (
          <>
            <h1 className="policy-page__title">{policy.title}</h1>
            {policy.body ? (
              <div
                className="policy-page__body rte"
                dangerouslySetInnerHTML={{ __html: policy.body }}
              />
            ) : (
              <p className="u-text-muted">Loading…</p>
            )}
          </>
        ) : (
          <div className="card card--padded card--bordered u-text-center">
            <p className="u-text-muted">This policy isn’t available.</p>
          </div>
        )}
      </Container>
    </section>
  )
}

export default defineSection({
  name: 'policy-page',
  title: 'Policy',
  category: 'commerce',
  icon: 'doc',
  attributes: {
    policy: { type: 'text', label: 'Policy handle (blank = from URL)' },
  },
  component: PolicyPage,
})
