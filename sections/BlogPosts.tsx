import { useEffect, useState } from 'react'
import { decodeHandle } from '../lib/handle'
import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { apiBase } from '../lib/api-base'
import { Container } from '../components/Container'

interface ArticleCard {
  handle: string
  title: string
  excerpt: string | null
  publishedAt: string | null
  image: { url: string; altText?: string } | null
}

/**
 * Lists every Article in the Blog whose `handle` matches `/blogs/<handle>`.
 * Self-contained for the same reason PageBody is — the runtime image bakes a
 * frozen copy of theme-kit, so adding `blogByHandle` to the bootstrap query
 * wouldn't reach prod until the runtime image is rebuilt.
 */
export function BlogPosts({ attributes }: SectionProps): JSX.Element {
  const { fallbackTitle, fallbackEmpty } = attributes as Record<string, string | undefined>

  const blogHandle =
    typeof window !== 'undefined'
      ? decodeHandle(window.location.pathname.match(/^\/blogs\/([^/]+)\/?$/)?.[1])
      : undefined

  const [blog, setBlog] = useState<{ title: string; articles: ArticleCard[] } | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!blogHandle) {
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
        query: `query B($h: String) {
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
        variables: { h: blogHandle },
      }),
    })
      .then((r) => r.json())
      .then((j: {
        data?: {
          blog?: {
            title: string
            articles: { edges: Array<{ node: ArticleCard }> }
          } | null
        }
      }) => {
        if (cancelled) return
        const b = j.data?.blog
        if (!b) {
          setBlog(null)
        } else {
          setBlog({
            title: b.title,
            articles: b.articles.edges.map((e) => e.node),
          })
        }
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [blogHandle])

  const title = blog?.title ?? (loaded ? fallbackTitle ?? '' : '')
  const showEmpty = loaded && (!blog || blog.articles.length === 0)

  return (
    <section className="blog-posts">
      <Container className="blog-posts__inner">
        {title && <h1 className="blog-posts__title">{title}</h1>}
        {blog && blog.articles.length > 0 && (
          <ul className="blog-posts__list">
            {blog.articles.map((article) => (
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
                  {article.publishedAt && (
                    <time className="blog-posts__date" dateTime={article.publishedAt}>
                      {new Date(article.publishedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  )}
                  {article.excerpt && <p className="blog-posts__excerpt">{article.excerpt}</p>}
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
  title: 'Blog posts',
  category: 'content',
  icon: '✎',
  attributes: {
    fallbackTitle: { type: 'text', label: 'Fallback title', default: 'Journal' },
    fallbackEmpty: {
      type: 'textarea',
      label: 'Fallback (when empty)',
      default: '',
    },
  },
  component: BlogPosts,
})
