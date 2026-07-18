import { useEffect, useState } from 'react'
import { decodeHandle } from '../lib/handle'
import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { apiBase } from '../lib/api-base'
import { Container } from '../components/Container'

interface ArticleDetail {
  title: string
  contentHtml: string
  publishedAt: string | null
  author: { name: string } | null
  image: { url: string; altText?: string } | null
  blog: { handle: string; title: string } | null
}

/**
 * Renders one Article for `/blogs/<blogHandle>/<articleHandle>`. Like
 * PageBody / BlogPosts this fetches its own data so the wire-up ships via
 * a single theme-file PUT — no runtime image rebuild required.
 */
export function ArticleBody({ attributes }: SectionProps): JSX.Element {
  const { fallbackTitle, fallbackBody } = attributes as Record<string, string | undefined>

  const handles =
    typeof window !== 'undefined'
      ? window.location.pathname.match(/^\/blogs\/([^/]+)\/([^/]+)\/?$/)
      : null
  const blogHandle = decodeHandle(handles?.[1])
  const articleHandle = decodeHandle(handles?.[2])

  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!blogHandle || !articleHandle) {
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
        // Use the nested Blog.articleByHandle resolver: the root-level
        // article(handle: ArticleHandleInput) endpoint has a known store-api
        // bug (passes the whole input object where the data layer expects a
        // string handle, throws internal_error). Nested form works end-to-end
        // and gives us the same article shape; switching back is a one-line
        // change once the resolver is patched.
        query: `query A($blogHandle: String!, $articleHandle: String!) {
          blog(handle: $blogHandle) {
            handle
            title
            articleByHandle(handle: $articleHandle) {
              title
              contentHtml
              publishedAt
              author { name }
              image { url altText }
            }
          }
        }`,
        variables: { blogHandle, articleHandle },
      }),
    })
      .then((r) => r.json())
      .then((j: {
        data?: {
          blog?: {
            handle: string
            title: string
            articleByHandle: Omit<ArticleDetail, 'blog'> | null
          } | null
        }
      }) => {
        if (cancelled) return
        const blog = j.data?.blog
        const a = blog?.articleByHandle
        if (a) {
          setArticle({
            ...a,
            blog: blog ? { handle: blog.handle, title: blog.title } : null,
          })
        } else {
          setArticle(null)
        }
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [blogHandle, articleHandle])

  const title = article?.title ?? (loaded ? fallbackTitle ?? '' : '')
  const body = article?.contentHtml ?? (loaded ? fallbackBody ?? '' : '')

  return (
    <article className="article-body">
      <Container className="article-body__inner">
        {article?.blog && (
          <p className="article-body__crumbs">
            <a href={`/blogs/${article.blog.handle}`}>{article.blog.title}</a>
          </p>
        )}
        {title && <h1 className="article-body__title">{title}</h1>}
        {(article?.publishedAt || article?.author) && (
          <p className="article-body__meta">
            {article?.publishedAt && (
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            )}
            {article?.author?.name && (
              <>
                {article.publishedAt && ' · '}
                <span>{article.author.name}</span>
              </>
            )}
          </p>
        )}
        {article?.image && (
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
      </Container>
    </article>
  )
}

export default defineSection({
  name: 'article-body',
  title: 'Article content',
  category: 'content',
  icon: '✎',
  attributes: {
    fallbackTitle: { type: 'text', label: 'Fallback title', default: 'Article' },
    fallbackBody: { type: 'textarea', label: 'Fallback body (HTML)', default: '' },
  },
  component: ArticleBody,
})
