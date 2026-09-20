import { useEffect, useState } from 'react'
import { decodeHandle } from '../lib/handle'
import { defineSection, useData, type SectionProps } from '@tanqory/theme-kit'
import { Container } from '../components/Container'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

interface ArticleCard {
  handle: string
  title: string
  excerpt: string | null
  publishedAt: string | null
  image: { url: string; altText?: string } | null
}

/**
 * Lists every Article in the Blog whose `handle` matches `/blogs/<handle>`.
 * Reads through the kit's shared `graphql()` transport, which already ships in
 * the runtime — the same headers and error handling as every other section.
 */
export function BlogPosts({ attributes }: SectionProps): JSX.Element {
  const { fallbackTitle, fallbackEmpty } = attributes as Record<string, string | undefined>
  // Shared transport, not a hand-built fetch — see PageBody.
  const { graphql } = useData()
  const columns = [2, 3, 4].includes(Number(attributes.columns)) ? Number(attributes.columns) : 3
  const postsToShow = Math.max(1, Math.min(9, Number(attributes.postsToShow ?? 3) || 3))
  const showExcerpt = attributes.showExcerpt === true
  const showDate = attributes.showDate !== false
  const imageRatio = (attributes.imageRatio as string) ?? 'landscape'
  // `blog` overrides the route for a blog row placed on another page; the URL
  // still wins on a real /blogs/<handle> page.
  const blogOverride = (attributes.blog as string | undefined)?.trim() || undefined

  const blogHandle =
    (typeof window !== 'undefined'
      ? decodeHandle(window.location.pathname.match(/^\/blogs\/([^/]+)\/?$/)?.[1])
      : undefined) ?? blogOverride

  const [blog, setBlog] = useState<{ title: string; articles: ArticleCard[] } | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!blogHandle || !graphql) {
      setLoaded(true)
      return
    }
    let cancelled = false
    // Same reset as ArticleBody: a soft-nav between two blogs reuses this
    // instance, and without clearing, the previous blog's title and post list
    // render under the new URL until the new response lands.
    setBlog(null)
    setLoaded(false)
    void graphql<{
      blog?: {
        title: string
        articles: { edges: { node: ArticleCard }[] }
      } | null
    }>(
      `query B($h: String) {
          blog(handle: $h) {
            title
            articles(first: 30) {
              edges {
                node {
                  handle
                  title
                  excerpt
                  publishedAt
                  image { url altText }
                }
              }
            }
          }
        }`,
      { h: blogHandle },
    )
      .then((res) => {
        if (cancelled) return
        const b = res?.blog
        setBlog(b ? { title: b.title, articles: b.articles.edges.map((e) => e.node) } : null)
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) {
          setBlog(null)
          setLoaded(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [blogHandle, graphql])

  const title = blog?.title ?? (loaded ? fallbackTitle ?? '' : '')
  const showEmpty = loaded && (!blog || blog.articles.length === 0)

  return (
    <section {...sharedRootProps(attributes)} className="blog-posts">
      <Container className="blog-posts__inner">
        {title && <h1 className="blog-posts__title">{title}</h1>}
        {blog && blog.articles.length > 0 && (
          <ul className="blog-posts__list" data-columns={columns} data-ratio={imageRatio}>
            {blog.articles.slice(0, postsToShow).map((article) => (
              <li key={article.handle} className="blog-posts__item">
                {article.image && (
                  <a
                    className="blog-posts__media"
                    href={`/blogs/${blogHandle}/${article.handle}`}
                  >
                    <img src={article.image.url} alt={article.image.altText ?? article.title} />
                  </a>
                )}
                <div className="blog-posts__body">
                  <h2 className="blog-posts__heading">
                    <a href={`/blogs/${blogHandle}/${article.handle}`}>{article.title}</a>
                  </h2>
                  {showDate && article.publishedAt && (
                    <time className="blog-posts__date" dateTime={article.publishedAt}>
                      {new Date(article.publishedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  )}
                  {showExcerpt && article.excerpt && (
                    <p className="blog-posts__excerpt">{article.excerpt}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {showEmpty && fallbackEmpty && (
          <div
            className="blog-posts__empty rich-text"
            dangerouslySetInnerHTML={{ __html: fallbackEmpty }}
          />
        )}
      </Container>
    </section>
  )
}

export default defineSection({
  name: 'blog-posts',
  role: 'section',
  requiresContext: ['blog'],
  title: 'Blog posts',
  category: 'content',
  icon: '✎',
  attributes: withShared({
    fallbackTitle: { type: 'text', label: 'Fallback title', default: 'Journal' },
    blog: { type: 'text', label: 'Blog handle (blank = from URL)' },
    columns: {
      type: 'select',
      default: '3',
      label: 'Columns',
      options: [
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '4', label: '4' },
      ],
    },
    postsToShow: { type: 'range', default: 3, min: 1, max: 9, step: 1, label: 'Posts to show' },
    showExcerpt: { type: 'boolean', default: false, label: 'Show excerpt' },
    showDate: { type: 'boolean', default: true, label: 'Show date' },
    imageRatio: {
      type: 'select',
      default: 'landscape',
      label: 'Image shape',
      options: [
        { value: 'landscape', label: 'Landscape' },
        { value: 'square', label: 'Square' },
        { value: 'adapt', label: 'Adapt to image' },
      ],
    },
    fallbackEmpty: {
      type: 'textarea',
      label: 'Fallback (when empty)',
      default: '',
    },
  }),
  component: BlogPosts,
})
