import { useEffect, useState } from 'react'
import { decodeHandle } from '../lib/handle'
import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { apiBase } from '../lib/api-base'
import { Container } from '../components/Container'

/**
 * Renders the merchant's published Page content for the current `/pages/<handle>`
 * URL by querying the storefront GraphQL `page(handle:)` resolver at mount.
 *
 * Self-contained on purpose: the theme-runtime image bakes its own copy of
 * `@tanqory/theme-kit` from `node_modules`, so adding `pageByHandle` to
 * theme-kit's bootstrap query wouldn't reach prod until the runtime image is
 * rebuilt. Doing the fetch here keeps the wire-up to a single theme file that
 * code-store can hot-PUT. When the runtime image catches up, this section
 * can be slimmed down to read from `dataApi.pageByHandle(handle)`.
 *
 * Falls back to the section's authored `fallbackTitle` / `fallbackBody` while
 * the request is in flight, when the URL isn't `/pages/...`, or when the
 * merchant hasn't published a page with that handle.
 */
export function PageBody({ attributes }: SectionProps): JSX.Element {
  const { fallbackTitle, fallbackBody } = attributes as Record<string, string | undefined>

  const handle =
    typeof window !== 'undefined'
      ? decodeHandle(window.location.pathname.match(/^\/pages\/([^/]+)\/?$/)?.[1])
      : undefined

  const [page, setPage] = useState<{ title: string; body: string } | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!handle) {
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
    const country =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('country') ||
          (() => {
            try {
              return window.localStorage.getItem('tq-country')
            } catch {
              return null
            }
          })()
        : null
    let cancelled = false
    fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(env.VITE_TANQORY_STOREFRONT_TOKEN
          ? { 'x-publishable-key': env.VITE_TANQORY_STOREFRONT_TOKEN }
          : {}),
        ...(country && /^[A-Za-z]{2}$/.test(country)
          ? { 'x-tanqory-country': country.toUpperCase() }
          : {}),
      },
      body: JSON.stringify({
        query: 'query P($h: String) { page(handle: $h) { title body } }',
        variables: { h: handle },
      }),
    })
      .then((r) => r.json())
      .then((j: { data?: { page?: { title: string; body: string } | null } }) => {
        if (cancelled) return
        const p = j.data?.page
        setPage(p ? { title: p.title, body: p.body } : null)
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [handle])

  const title = page?.title ?? (loaded ? fallbackTitle ?? '' : '')
  const body = page?.body ?? (loaded ? fallbackBody ?? '' : '')

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
  name: 'page-body',
  title: 'Page content',
  category: 'content',
  icon: '¶',
  attributes: {
    fallbackTitle: {
      type: 'text',
      label: 'Fallback title',
      default: 'Page',
    },
    fallbackBody: {
      type: 'textarea',
      label: 'Fallback body (HTML)',
      default: '',
    },
  },
  component: PageBody,
})
