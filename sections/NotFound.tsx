import { richTextHtml } from '../lib/safe-html'
import { defineSection, useData, type SectionProps, useT } from '../lib/tanqory/index'
import { Button } from '../components/Button'
import { CollectionCard, toCollectionCard } from '../components/CollectionCard'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

export function NotFound({ attributes }: SectionProps): JSX.Element {
  const t = useT()
  const { allCollections } = useData()
  const heading = (attributes.heading as string) ?? 'Page not found'
  const body =
    (attributes.body as string) ??
    'The page you\'re looking for doesn\'t exist or may have moved.'
  const buttonLabel = (attributes.buttonLabel as string) ?? 'Back to home'
  const buttonLink = (attributes.buttonLink as string) ?? '/'
  const showSearch = attributes.showSearch !== false
  const handles = String(attributes.collectionLinks ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
  const suggestions = allCollections()
    .filter((c) => handles.includes(c.handle))
    .slice(0, 4)

  return (
    <section {...sharedRootProps(attributes)} className="section">
      <div className="container">
        <div className="not-found">
          {/* The design uses a small eyebrow, not a giant numeral — the page
              is an apology and a way out, not a display of the error code. */}
          <span className="eyebrow not-found__code">Error 404</span>
          <h1>{heading}</h1>
          <div className="u-text-muted rich-text-body" dangerouslySetInnerHTML={{ __html: richTextHtml(body) }} />

          {showSearch && (
            <form className="not-found__search" action="/search" method="get" role="search">
              <input
                className="field__input"
                type="search"
                name="q"
                placeholder={t('search.theStore')}
                aria-label={t('search.theStore')}
              />
              <button className="btn btn--secondary" type="submit">
                {t('search.button')}
              </button>
            </form>
          )}

          <div className="cluster">
            {/* "Not-found without search enabled: single primary button." */}
            <Button label={buttonLabel} link={buttonLink} variant="primary" size="lg" />
            {showSearch && (
              <Button label={t('search.browseShop')} link="/collections/all" variant="ghost" size="lg" />
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="collection-list__grid" data-columns={Math.min(suggestions.length, 4)}>
              {suggestions.map((c) => (
                <CollectionCard key={c.handle} collection={toCollectionCard(c)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default defineSection({
  name: 'not-found',
  role: 'section',
  title: '404',
  description: 'The page shown when a link goes nowhere.',
  category: 'system',
  icon: '⚠',
  attributes: withShared({
    heading: { type: 'text', default: 'Page not found', label: 'Heading' },
    body: {
      type: 'richtext',
      default: 'The page you\'re looking for doesn\'t exist or may have moved.',
      label: 'Body',
    },
    buttonLabel: { type: 'text', default: 'Back to home', label: 'Button label' },
    buttonLink: { type: 'url', default: '/', label: 'Button link' },
    showSearch: { type: 'boolean', default: true, label: 'Show a search box' },
    collectionLinks: {
      type: 'text',
      label: 'Collections to suggest (handles, comma separated)',
    },
  }),
  component: NotFound,
})
