import { useEffect, useState } from 'react'
import { decodeHandle } from '../lib/handle'
import { defineSection, useData, type SectionProps } from '@tanqory/theme-kit'
import { Container } from '../components/Container'
import { Button } from '../components/Button'
import { Chip } from '../components/Chip'
import { showToast } from '../components/Overlays'
import { withShared, sharedRootProps } from '../lib/shared-section-props'
import { sanitizeSettingHtml } from '../lib/safe-html'

interface ArticleDetail {
  title: string
  contentHtml: string
  publishedAt: string | null
  author: { name: string } | null
  image: { url: string; altText?: string } | null
  blog: { handle: string; title: string } | null
  /** Real field on the storefront Article — now requested by the query below. */
  tags: string[]
}

/**
 * Renders one Article for `/blogs/<blogHandle>/<articleHandle>`. Like
 * PageBody / BlogPosts this fetches its own data so the wire-up ships via
 * a single theme-file PUT — no runtime image rebuild required.
 */
export function ArticleBody({ attributes }: SectionProps): JSX.Element {
  const { fallbackTitle, fallbackBody } = attributes as Record<string, string | undefined>
  // Shared transport, not a hand-built fetch — see PageBody.
  const { graphql } = useData()

  const handles =
    typeof window !== 'undefined'
      ? window.location.pathname.match(/^\/blogs\/([^/]+)\/([^/]+)\/?$/)
      : null
  const blogHandle = decodeHandle(handles?.[1])
  const articleHandle = decodeHandle(handles?.[2])

  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!blogHandle || !articleHandle || !graphql) {
      setLoaded(true)
      return
    }
    let cancelled = false
    // Clear the previous article FIRST. With SPA soft-nav between two articles
    // this component instance is reused, and `loaded` stayed true, so the old
    // title, hero image, tags and `dangerouslySetInnerHTML` body kept rendering
    // under the new URL until the second response arrived — a visibly wrong
    // article rather than a loading state, and permanent if the fetch failed.
    setArticle(null)
    setLoaded(false)
    // Nested form: the top-level `article(handle:)` resolver has a known
    // store-api bug (passes the whole input object where the data layer wants a
    // string handle, throws internal_error). This gives the same shape.
    void graphql<{
      blog?: { handle: string; title: string; articleByHandle?: ArticleDetail | null } | null
    }>(
      `query A($blogHandle: String!, $articleHandle: String!) {
          blog(handle: $blogHandle) {
            handle
            title
            articleByHandle(handle: $articleHandle) {
              title
              contentHtml
              publishedAt
              author { name }
              tags
              image { url altText }
            }
          }
        }`,
      { blogHandle, articleHandle },
    )
      .then((res) => {
        if (cancelled) return
        const a = res?.blog?.articleByHandle
        setArticle(
          a
            ? { ...a, blog: res?.blog ? { handle: res.blog.handle, title: res.blog.title } : null }
            : null,
        )
        setLoaded(true)
      })
      // A failed fetch must still settle, or the page waits forever on an
      // article that is never coming.
      .catch(() => {
        if (!cancelled) {
          setArticle(null)
          setLoaded(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [blogHandle, articleHandle, graphql])

  const showDate = attributes.showDate !== false
  const showAuthor = attributes.showAuthor === true
  const showFeaturedImage = attributes.showFeaturedImage !== false
  const showShare = attributes.showShare !== false
  const showTags = attributes.showTags !== false
  const tags = (article?.tags ?? []).filter(Boolean)

  const title = article?.title ?? (loaded ? fallbackTitle ?? '' : '')
  // The article is the merchant's published content; the fallback is a section
  // setting, so only its formatting tags may render.
  const body = article?.contentHtml ?? (loaded ? sanitizeSettingHtml(fallbackBody) : '')

  return (
    <article className="article-body" {...sharedRootProps(attributes)}>
      <Container className="article-body__inner">
        {article?.blog && (
          <p className="article-body__crumbs">
            <a href={`/blogs/${article.blog.handle}`}>{article.blog.title}</a>
          </p>
        )}
        {title && <h1 className="article-body__title">{title}</h1>}
        {((showDate && article?.publishedAt) || (showAuthor && article?.author)) && (
          <p className="article-body__meta">
            {showDate && article?.publishedAt && (
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            )}
            {showAuthor && article?.author?.name && (
              <>
                {showDate && article.publishedAt && ' · '}
                <span>{article.author.name}</span>
              </>
            )}
          </p>
        )}
        {showFeaturedImage && article?.image && (
          <figure className="article-body__hero">
            <img src={article.image.url} alt={article.image.altText ?? article.title} />
          </figure>
        )}
        {body && (
          <div
            className="article-body__content rich-text"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        )}
        {showTags && tags.length > 0 && (
          <div className="article-body__tags">
            {tags.map((tag) => (
              <Chip key={tag} label={tag} />
            ))}
          </div>
        )}
        {showShare && (
          /* Native share where the browser has it, a copy-link fallback where
             it does not — no third-party share buttons, which would load
             tracking scripts onto every article. */
          <div className="article-body__share">
            <Button
              label="Share this article"
              variant="secondary"
              onClick={() => {
                const url = typeof window !== 'undefined' ? window.location.href : ''
                if (typeof navigator === 'undefined') return
                if (typeof navigator.share === 'function') {
                  void navigator.share({ title, url }).catch(() => {})
                } else {
                  void navigator.clipboard?.writeText(url).then(() => showToast('Link copied'))
                }
              }}
            />
          </div>
        )}
      </Container>
    </article>
  )
}

export default defineSection({
  name: 'article-body',
  role: 'section',
  requiresContext: ['article'],
  title: 'Article content',
  category: 'content',
  icon: '✎',
  attributes: withShared({
    fallbackTitle: { type: 'text', label: 'Fallback title', default: 'Article' },
    fallbackBody: { type: 'textarea', label: 'Fallback body (HTML)', default: '' },
    showDate: { type: 'boolean', default: true, label: 'Show date' },
    showAuthor: { type: 'boolean', default: false, label: 'Show author' },
    showFeaturedImage: { type: 'boolean', default: true, label: 'Show featured image' },
    showShare: { type: 'boolean', default: true, label: 'Show share button' },
    showTags: { type: 'boolean', default: true, label: 'Show tags' },
  }),
  component: ArticleBody,
})
