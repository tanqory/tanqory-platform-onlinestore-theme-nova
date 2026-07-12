import { useEffect, useState } from 'react'
import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { apiBase } from '../lib/api-base'
import { Container } from '../components/Container'

/**
 * Renders a store legal policy (Settings → Policies) for the current
 * `/policies/<handle>` URL by querying the storefront GraphQL `shop { <kind>Policy }`
 * resolver at mount.
 *
 * Self-contained on purpose (same reasoning as PageBody): the theme-runtime
 * image bakes its own copy of `@tanqory/theme-kit`, so the fetch lives in this
 * one theme file that code-store can hot-PUT rather than depending on a bootstrap
 * query change reaching prod.
 *
 * Falls back to `fallbackTitle`/`fallbackBody` while loading, when the URL isn't
 * a `/policies/...` route, or when the merchant hasn't published that policy.
 */

/** `/policies/<handle>` → the storefront GraphQL `shop` field that serves it. */
const POLICY_FIELD: Record<string, string> = {
  'privacy-policy': 'privacyPolicy',
  'refund-policy': 'refundPolicy',
  'terms-of-service': 'termsOfService',
  'shipping-policy': 'shippingPolicy',
  'subscription-policy': 'subscriptionPolicy',
}

export function PolicyBody({ attributes }: SectionProps): JSX.Element {
  const { fallbackTitle, fallbackBody } = attributes as Record<string, string | undefined>

  const handle =
    typeof window !== 'undefined'
      ? window.location.pathname.match(/^\/policies\/([^/]+)\/?$/)?.[1]
      : undefined
  const field = handle ? POLICY_FIELD[handle] : undefined

  const [policy, setPolicy] = useState<{ title: string; body: string } | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!field) {
      setLoaded(true)
      return
    }
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
        query: `query Pol { shop { p: ${field} { title body } } }`,
      }),
    })
      .then((r) => r.json())
      .then((j: { data?: { shop?: { p?: { title: string; body: string } | null } } }) => {
        if (cancelled) return
        const p = j.data?.shop?.p
        setPolicy(p ? { title: p.title, body: p.body } : null)
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [field])

  const title = policy?.title ?? (loaded ? fallbackTitle ?? '' : '')
  const body = policy?.body ?? (loaded ? fallbackBody ?? '' : '')

  return (
    <section className="page-body">
      <Container className="page-body__inner">
        {title && <h1 className="page-body__title">{title}</h1>}
        {body && (
          <div
            className="page-body__content rich-text"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        )}
      </Container>
    </section>
  )
}

export default defineSection({
  name: 'policy-body',
  title: 'Policy content',
  category: 'content',
  icon: '§',
  attributes: {
    fallbackTitle: {
      type: 'text',
      label: 'Fallback title',
      default: 'Policy',
    },
    fallbackBody: {
      type: 'textarea',
      label: 'Fallback body (HTML)',
      default:
        "<p>This policy hasn't been published yet. Add it from the admin <strong>Settings → Policies</strong>.</p>",
    },
  },
  component: PolicyBody,
})
