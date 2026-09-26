import { Children, useEffect, useState } from 'react'
import { defineSection, useData, useT, type SectionProps } from '../lib/tanqory/index'
import { matchRoute } from '../lib/routes'
import { SectionHead } from '../components/SectionHead'
import { CollectionCard, toCollectionCard } from '../components/CollectionCard'
import { withShared, sharedRootProps } from '../lib/shared-section-props'
import { localizedCopy } from '../lib/theme-locale'

export function CollectionList({ attributes, children }: SectionProps): JSX.Element {
  const { allCollections } = useData()
  const t = useT()
  const limit = (attributes.limit as number) ?? 12
  // nova's English defaults follow the theme's language; the merchant's words,
  // and a heading cleared to '', are kept (lib/theme-locale.ts).
  const heading =
    attributes.heading === ''
      ? ''
      : localizedCopy(attributes.heading, 'Shop by collection', 'collections.heading', t)
  // The design's shared SectionHeader slot is `description` (06 Configuration
  // System). `subheading` is the key this section used before the conversion
  // and is still honoured, so saved merchant content is not orphaned.
  const rawSub =
    (attributes.description as string | undefined) ??
    (attributes.subheading as string | undefined)
  const subheading =
    rawSub === '' || rawSub === undefined
      ? rawSub
      : localizedCopy(rawSub, 'Browse every category we carry.', 'collections.subheading', t)
  const columns = (attributes.columns as number) ?? 4
  const imageRatio = (attributes.imageRatio as 'square' | 'portrait' | 'landscape') ?? 'portrait'
  const textStyle = (attributes.textStyle as 'below' | 'overlay') ?? 'below'
  const showCount = attributes.showCount !== false
  const showDescription = attributes.showDescription === true
  const headerAlignment = (attributes.headerAlignment as 'left' | 'center') ?? 'center'
  // The design's control is a resource LIST, which no field type expresses.
  // Child `collection-item` blocks are the existing, editor-native equivalent;
  // this setting narrows AUTO mode to a comma-separated list of handles so the
  // capability exists until a real resource-list picker does.
  const handles = String(attributes.collections ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
  const carouselOnMobile = attributes.carouselOnMobile !== false
  // On /collections this section IS the page, so its heading is the page's
  // top-level one. Everywhere else it is a section heading.
  /**
   * Resolved AFTER mount, never during the first render.
   *
   * Reading `window.location` while rendering made the element TYPE differ
   * between the two passes — the SSG prerender has no `window` and emitted
   * `<h2>`, the client's first render on `/collections` emitted `<h1>` — which
   * is a hydration mismatch on the page's primary heading. Starting from the
   * server's answer and upgrading in an effect keeps both passes identical and
   * still ends on the right level.
   */
  /**
   * The template says so first: `pageHeading: true` in `list-collections.json`
   * makes the FIRST paint (and the SSG prerender) carry the `<h1>`. The effect
   * below only covers a store whose saved template predates that setting — it
   * upgrades one render later, which a scanner sampling first paint read as a
   * page with no heading at all.
   */
  const declared = attributes.pageHeading === true
  const [routeSaysIndex, setRouteSaysIndex] = useState(false)
  useEffect(() => {
    setRouteSaysIndex(matchRoute(window.location.pathname).template === 'list-collections')
  }, [])
  const isIndexPage = declared || routeSaysIndex

  // CURATED mode: when the merchant added child blocks (collection-item) in
  // the editor, render exactly those, in their order. AUTO mode: with no
  // blocks, fall back to the whole catalogue (previous behaviour) so a
  // fresh theme renders something meaningful with zero configuration.
  const hasBlocks = Children.count(children) > 0
  const all = allCollections()
  const collections = hasBlocks
    ? []
    : handles.length > 0
      ? handles.map((h) => all.find((c) => c.handle === h)).filter((c): c is (typeof all)[number] => Boolean(c))
      : all.slice(0, limit)

  // "Fewer than 3 collections in editorial -> grid" is a design rule, so it is
  // enforced here rather than left to CSS that cannot count.
  const requested = (attributes.layout as 'grid' | 'carousel' | 'editorial') ?? 'grid'
  const count = hasBlocks ? Children.count(children) : collections.length
  const layout = requested === 'editorial' && count < 3 ? 'grid' : requested

  return (
    <section {...sharedRootProps(attributes)} className="section">
      <div className="container">
        <SectionHead
          heading={heading}
          description={subheading}
          align={headerAlignment}
          as={isIndexPage ? 'h1' : 'h2'}
        />

        {hasBlocks ? (
          <div className="collection-list__grid" data-layout={layout} data-columns={columns}>
            {children}
          </div>
        ) : collections.length === 0 ? (
          <div className="card card--padded card--bordered u-text-center">
            <p className="u-text-muted">No collections yet.</p>
          </div>
        ) : (
          <div
            className="collection-list__grid"
            data-layout={layout}
            data-columns={columns}
            data-carousel-mobile={carouselOnMobile && layout === 'grid' ? 'true' : undefined}
          >
            {collections.map((c) => (
              <CollectionCard
                key={c.handle}
                collection={toCollectionCard(c)}
                imageRatio={imageRatio}
                variant={textStyle === 'overlay' ? 'overlay' : 'text-below'}
                showCount={showCount}
                showDescription={showDescription}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default defineSection({
  name: 'collection-list',
  role: 'section',
  title: 'Collection list',
  description: 'A grid of collections with their images.',
  category: 'commerce',
  icon: '☷',
  attributes: withShared({
    description: { type: 'richtext', group: 'Content', label: 'Description' },
    heading: { type: 'text', default: 'Shop by collection', label: 'Heading' },
    pageHeading: {
      type: 'boolean',
      default: false,
      group: 'Content',
      label: 'This is the page heading',
      info: 'Turn on when this section titles the page (the all-collections page). Exactly one section per page should.',
    },
    subheading: { type: 'text', label: 'Subheading' },
    limit: { type: 'number', default: 6, label: 'Max collections (auto mode)' },
    collections: {
      type: 'text',
      label: 'Collections (handles, comma separated)',
      info: 'Leave blank to show the newest collections. Add blocks instead for full control.',
    },
    carouselOnMobile: {
      type: 'boolean',
      default: true,
      label: 'Swipe row on mobile',
      visible_if: "{{ section.settings.layout == 'grid' }}",
    },
    layout: {
      type: 'select',
      default: 'grid',
      label: 'Layout',
      options: [
        { value: 'grid', label: 'Grid' },
        { value: 'carousel', label: 'Carousel' },
        { value: 'editorial', label: 'Editorial' },
      ],
    },
    columns: { type: 'range', default: 4, min: 2, max: 5, step: 1, label: 'Columns' },
    imageRatio: {
      type: 'select',
      default: 'portrait',
      label: 'Image shape',
      options: [
        { value: 'square', label: 'Square' },
        { value: 'portrait', label: 'Portrait' },
        { value: 'landscape', label: 'Landscape' },
      ],
    },
    textStyle: {
      type: 'select',
      default: 'below',
      label: 'Text placement',
      options: [
        { value: 'below', label: 'Below image' },
        { value: 'overlay', label: 'Over image' },
      ],
    },
    showCount: { type: 'boolean', default: true, label: 'Show product count' },
    showDescription: { type: 'boolean', default: false, label: 'Show description' },
    headerAlignment: { type: 'text_alignment', default: 'center', label: 'Header alignment' },
  }),
  allowedBlocks: ['collection-item'],
  presets: [
    {
      blocks: [
        { type: 'collection-item', settings: {} },
        { type: 'collection-item', settings: {} },
        { type: 'collection-item', settings: {} },
      ],
    },
  ],
  component: CollectionList,
})
