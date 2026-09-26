import { useEffect, useState } from 'react'
import { routeHandle } from '../lib/routes'
import { defineSection, useData, type SectionProps } from '../lib/tanqory/index'
import { Container } from '../components/Container'
import { withShared, sharedRootProps } from '../lib/shared-section-props'
import { richTextHtml } from '../lib/safe-html'

/**
 * Renders the merchant's published Page content for the current `/pages/<handle>`
 * URL by querying the storefront GraphQL `page(handle:)` resolver at mount.
 *
 * Reads through the shared data layer: the bootstrap's `pageByHandle` when the
 * route's page is already known, otherwise the kit's `graphql()` transport —
 * which is part of the shipped runtime, so this needs no image rebuild. It
 * previously hand-rolled a fetch with its own env reading, publishable-key and
 * country headers, which is how a section ends up disagreeing with the rest of
 * the store about currency or locale.
 *
 * Falls back to the section's authored `fallbackTitle` / `fallbackBody` while
 * the request is in flight, when the URL isn't `/pages/...`, or when the
 * merchant hasn't published a page with that handle.
 */
export function PageBody({ attributes }: SectionProps): JSX.Element {
  const { fallbackTitle, fallbackBody } = attributes as Record<string, string | undefined>
  // One transport for every section: `graphql()` carries the publishable key,
  // country and locale headers the rest of the data layer uses. This file used
  // to build its own fetch, its own headers and its own error handling.
  const { graphql, pageByHandle } = useData()

  const handle = typeof window !== 'undefined' ? routeHandle(window.location.pathname, 'page') : undefined

  const [page, setPage] = useState<{ title: string; body: string } | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!handle) {
      setLoaded(true)
      return
    }
    // The bootstrap already knows the page on a `/pages/<handle>` route.
    const cached = pageByHandle?.(handle)
    if (cached) {
      setPage({ title: cached.title, body: cached.body ?? '' })
      setLoaded(true)
      return
    }
    if (!graphql) {
      setLoaded(true)
      return
    }
    let cancelled = false
    void graphql<{ page?: { title: string; body: string } | null }>(
      'query P($h: String) { page(handle: $h) { title body } }',
      { h: handle },
    )
      .then((res) => {
        if (cancelled) return
        setPage(res?.page ? { title: res.page.title, body: res.page.body } : null)
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [handle, graphql, pageByHandle])

  const title = page?.title ?? (loaded ? fallbackTitle ?? '' : '')
  // The published page body is the merchant's admin-formatted content; the
  // fallback is a section setting, so only its formatting tags may render.
  const body = page?.body ?? (loaded ? richTextHtml(fallbackBody) : '')

  const showTitle = attributes.showTitle !== false
  const textWidth = (attributes.textWidth as string) ?? 'content'

  return (
    <section {...sharedRootProps(attributes)} className="page-body" data-width={textWidth}>
      <Container className="page-body__inner">
        {showTitle && title && <h1 className="page-body__title">{title}</h1>}
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
  role: 'section',
  requiresContext: ['page'],
  title: 'Page content',
  description: 'The content of the current page.',
  category: 'content',
  icon: '¶',
  attributes: withShared({
    fallbackTitle: {
      type: 'text',
      label: 'Fallback title',
      default: 'Page',
    },
    fallbackBody: {
      type: 'richtext',
      label: 'Fallback body (HTML)',
      default: '',
    },
    showTitle: { type: 'boolean', default: true, label: 'Show page title' },
    textWidth: {
      type: 'select',
      default: 'content',
      label: 'Text width',
      options: [
        { value: 'content', label: 'Content' },
        { value: 'standard', label: 'Standard' },
      ],
    },
  }),
  component: PageBody,
})
