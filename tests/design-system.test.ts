/**
 * Guards for the approved design system.
 *
 * Each case pins a decision the package states explicitly, so a later change
 * that contradicts it fails here instead of shipping. These are the rules that
 * were violated before the conversion — pill buttons, shadowed cards, cropped
 * product media, a token vocabulary that disagreed with itself.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..')
const tokens = readFileSync(join(ROOT, 'assets/tokens.css'), 'utf8')
const styles = readFileSync(join(ROOT, 'assets/styles.css'), 'utf8')

// Design tokens, plus the component-local custom properties styles.css
// declares for itself (e.g. `--hero-scrim`, set once per overlay strength).
// A local property is not a token — it must never appear in tokens.css — but
// it still resolves, so the orphan check has to know about it.
const defined = new Set([
  ...[...tokens.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1]!),
  ...[...styles.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1]!),
])

describe('token layer', () => {
  it('every var() in styles.css resolves to a defined token', () => {
    // A var() with no definition silently falls back to nothing — the failure
    // is invisible in the browser and only shows as a missing style.
    const used = [...styles.matchAll(/var\(\s*(--[a-z0-9-]+)/g)].map((m) => m[1]!)
    const orphans = [...new Set(used.filter((t) => !defined.has(t)))]
    expect(orphans).toEqual([])
  })

  it('carries no var() fallback literals', () => {
    // `var(--radius-md, 10px)` drifts: the literal disagreed with the token.
    const withFallback = [...styles.matchAll(/var\(\s*--[a-z0-9-]+\s*,[^)]+\)/g)]
    expect(withFallback.map((m) => m[0])).toEqual([])
  })

  it('keeps the --color-* / --space-* / --z-* names the AI generator depends on', () => {
    // ai-api's dna-storefront writes ai-tokens.css against this contract.
    for (const t of ['--color-bg', '--color-fg', '--color-brand', '--space-4', '--z-modal']) {
      expect(defined.has(t)).toBe(true)
    }
  })
})

describe('approved decisions', () => {
  it('buttons, inputs and cards sit at the 4px house radius', () => {
    expect(tokens).toMatch(/--btn-radius:\s*var\(--radius-sm\)/)
    expect(tokens).toMatch(/--input-radius:\s*var\(--radius-sm\)/)
    expect(tokens).toMatch(/--card-radius:\s*var\(--radius-sm\)/)
    expect(tokens).toMatch(/--radius-sm:\s*4px/)
  })

  it('defines exactly the four purpose-named shadows', () => {
    const shadows = [...tokens.matchAll(/^\s*(--shadow-[a-z-]+)\s*:/gm)].map((m) => m[1])
    expect(shadows.sort()).toEqual([
      '--shadow-drawer',
      '--shadow-floating',
      '--shadow-modal',
      '--shadow-popover',
    ])
  })

  it('never shadows a card — borders before shadows', () => {
    const cardShadow = /\.card[^{]*\{[^}]*box-shadow:\s*(?!none)/.exec(styles)
    expect(cardShadow).toBeNull()
  })

  it('product media is contained, not cropped, by default', () => {
    const block = styles.slice(styles.indexOf('.product-card__media img'))
    expect(block.slice(0, 200)).toContain('object-fit: contain')
  })

  it('uses the design easing, not the Material curve it replaced', () => {
    expect(tokens).toMatch(/--ease-standard:\s*cubic-bezier\(0\.2,\s*0,\s*0,\s*1\)/)
    expect(tokens).not.toContain('cubic-bezier(0.4, 0, 0.2, 1)')
  })

  it('caps h1 at the design size rather than the old 72px ladder', () => {
    expect(tokens).toMatch(/--type-h1:.*2\.75rem/)
    expect(tokens).not.toMatch(/--type-step-[0-6]/)
  })

  it('uses only the design breakpoints', () => {
    // Only MEDIA QUERY widths — a `max-width` on a text measure is not a breakpoint.
    const mq = [...styles.matchAll(/@media[^{]*max-width:\s*(\d+)px/g)].map((m) => Number(m[1]))
    const allowed = new Set([767, 768, 1023, 1279, 1439])
    expect([...new Set(mq.filter((w) => !allowed.has(w)))]).toEqual([])
  })
})

describe('one implementation per component', () => {
  const tsx = (dir: string): string[] =>
    readdirSync(join(ROOT, dir))
      .filter((f) => f.endsWith('.tsx'))
      .map((f) => readFileSync(join(ROOT, dir, f), 'utf8'))

  const all = [...tsx('sections'), ...tsx('components'), ...tsx('overlays')]

  it('only ProductCard renders a product card', () => {
    // Five independent copies existed before; a fix to one reached none.
    // The card composes its class name, so match the literal wherever it appears
    // in a className expression rather than assuming a plain string.
    const renderers = all.filter((s) => /className=\{?[`"'][^`"']*\bproduct-card\b/.test(s))
    expect(renderers).toHaveLength(1)
  })

  it('no section hand-rolls its own section header', () => {
    const heads = tsx('sections').filter((s) => /className="[a-z-]+__head"/.test(s))
    expect(heads).toHaveLength(0)
  })

  it('SectionHead is actually used', () => {
    // It shipped with zero consumers while eight sections duplicated it.
    const consumers = tsx('sections').filter((s) => s.includes('SectionHead'))
    expect(consumers.length).toBeGreaterThanOrEqual(8)
  })
})

describe('accessibility foundations', () => {
  it('declares a global focus-visible ring at the approved width and offset', () => {
    expect(styles).toContain(':focus-visible')
    expect(tokens).toMatch(/--focus-ring-width:\s*2px/)
    expect(tokens).toMatch(/--focus-ring-offset:\s*2px/)
  })

  it('never suppresses an outline', () => {
    // One exception is allowed and must stay explicit: the borderless search
    // input delegates its ring to the row that wraps it.
    const lines = styles.split('\n')
    const offenders = lines
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => /outline:\s*(none|0)\s*[;}]/.test(l))
      .filter(({ i }) => !lines[i - 1]?.includes('search-modal__input:focus-visible')
        && !lines[i]?.includes('search-modal__input:focus-visible'))
      .map(({ l }) => l.trim())
    expect(offenders).toEqual([])
  })

  it('removes transforms under reduced motion, not just shortens them', () => {
    const rm = tokens.slice(tokens.indexOf('prefers-reduced-motion'))
    expect(rm).toContain('transform: none !important')
  })

  it('declares a 44px touch target', () => {
    expect(tokens).toMatch(/--touch-target:\s*44px/)
  })
})

/**
 * Section layout ladders.
 *
 * Every number here is quoted from the design's own responsive notes, so a
 * later "tidy-up" that rounds 380 to 400 or drops a breakpoint fails loudly
 * instead of quietly producing a different layout.
 */
describe('section layout ladders', () => {
  it('splits the product page 7/5 at 1280 and 6/6 at 768', () => {
    expect(styles).toMatch(/\.product-details\s*\{[^}]*grid-template-columns:\s*6fr 6fr|grid-template-columns:\s*6fr 6fr/)
    expect(styles).toContain('grid-template-columns: 7fr 5fr')
  })

  it('makes the purchase column sticky only once there is room beside the gallery', () => {
    const sticky = styles.slice(styles.indexOf('.product-details__body'))
    expect(sticky).toContain('position: sticky')
  })

  it('gives the cart a 380 summary at 1280 and 320 below it', () => {
    expect(styles).toContain('grid-template-columns: 1fr 320px')
    expect(styles).toContain('grid-template-columns: 1fr 380px')
  })

  it('ladders the footer brand 1.4fr / menus 1fr / newsletter 1.4fr', () => {
    expect(styles).toContain('grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr)) 1.4fr')
  })

  it('collapses footer menus into accordions that are forced open on desktop', () => {
    expect(styles).toContain('details.site-footer__col > ul { display: flex !important; }')
  })

  it('offers both approved header layouts', () => {
    expect(styles).toContain("[data-layout='logo-center']")
    expect(styles).toContain("[data-sticky='none']")
    expect(styles).toContain("[data-sticky='on-scroll-up'][data-hidden='true']")
  })

  it('feathers the header shadow in on scroll rather than showing it at rest', () => {
    expect(styles).toContain(".site-header[data-scrolled='true']")
    // ...and it uses one of the four approved shadows, not a new one.
    expect(styles).toMatch(/\.site-header\[data-scrolled='true'\][^}]*var\(--shadow-floating\)/)
  })

  it('gives collection-list all three approved layouts with snap scrolling', () => {
    expect(styles).toContain("[data-layout='editorial']")
    expect(styles).toContain("[data-layout='carousel']")
    expect(styles).toContain('scroll-snap-type: x mandatory')
  })
})

/**
 * Primitive and commerce-component coverage.
 *
 * The design's 02 and 03 canvases define a fixed set of building blocks. These
 * guards pin that every one exists as a single shared implementation, because
 * the failure mode this conversion was fixing was five ProductCards, three
 * quantity steppers and eight section headers — not a missing file.
 */
describe('component inventory', () => {
  const components = readdirSync(join(ROOT, 'components'))

  const REQUIRED = [
    'Badge.tsx', 'Chip.tsx', 'IconButton.tsx', 'Spinner.tsx',
    'Field.tsx', 'Disclosure.tsx', 'Overlays.tsx', 'StateBlock.tsx',
    'ProductCard.tsx', 'CollectionCard.tsx', 'ProductGallery.tsx',
    'VariantPicker.tsx', 'QuantityStepper.tsx', 'CartLineItem.tsx',
    'CollectionToolbar.tsx', 'CollectionBody.tsx', 'HeroComposition.tsx',
    'Price.tsx', 'SectionHead.tsx', 'Button.tsx', 'Modal.tsx', 'Drawer.tsx',
  ]

  it.each(REQUIRED)('ships %s', (file) => {
    expect(components).toContain(file)
  })

  it('has exactly one quantity stepper', () => {
    // Three existed: `.quantity`, `.cart__qty` and `.drawer__qty`, which
    // disagreed on radius, hit area and whether they stopped at the minimum.
    const src = sourceFiles()
    const steppers = src.filter((f) => /aria-label="Decrease quantity"/.test(f.body))
    expect(steppers.map((f) => f.name)).toEqual(['components/QuantityStepper.tsx'])
  })

  it('has exactly one hero composition', () => {
    // Hero, SlideItem and Slideshow each had their own, which is why the
    // slideshow ignored every hero layout control a merchant set.
    const src = sourceFiles()
    const heroes = src.filter((f) => /className="hero__content"|className=\{?'hero__content/.test(f.body))
    expect(heroes.map((f) => f.name)).toEqual(['components/HeroComposition.tsx'])
  })

  it('renders no per-instance <style> blocks inside sections', () => {
    // Two sections shipped a full stylesheet in their JSX, re-injected on every
    // placement and referencing tokens that do not exist.
    const offenders = sourceFiles()
      .filter((f) => f.name.startsWith('sections/'))
      .filter((f) => /<style>\{`/.test(f.body))
      .map((f) => f.name)
    expect(offenders).toEqual([])
  })
})

describe('design coverage', () => {
  it('declares every approved prop for every approved section', () => {
    const spec = JSON.parse(readFileSync(join(ROOT, 'design', 'spec', 'sections.json'), 'utf8')) as {
      name: string
      props: { name: string }[]
    }[]
    const manifest = JSON.parse(readFileSync(join(ROOT, 'theme.manifest.json'), 'utf8')) as {
      sections: { name: string; attributes?: Record<string, unknown> }[]
    }
    const have = new Map(manifest.sections.map((s) => [s.name, s]))

    /**
     * Props the design defines that the DATA LAYER blocks, each recorded in
     * docs/DESIGN-GAPS.md. They are listed here rather than declared as controls,
     * because a control with one option that is read by nothing is the thing
     * `check-inert-settings` exists to catch — the two gates would otherwise
     * require opposite things.
     */
    const BLOCKED_BY_DATA = new Set([
      // F17: `list+map` needs coordinates and a map provider; `locations()`
      // returns a postal address and nothing else.
      'store-locator.layout',
    ])

    const missing: string[] = []
    for (const s of spec) {
      const declared = new Set(Object.keys(have.get(s.name)?.attributes ?? {}))
      for (const p of s.props) {
        const id = `${s.name}.${p.name}`
        if (!declared.has(p.name) && !BLOCKED_BY_DATA.has(id)) missing.push(id)
      }
    }
    expect(missing).toEqual([])
  })
})

/** Every .tsx under components/ and sections/, with its source. */
function sourceFiles(): { name: string; body: string }[] {
  const out: { name: string; body: string }[] = []
  for (const dir of ['components', 'sections', 'overlays', 'layouts']) {
    for (const f of readdirSync(join(ROOT, dir))) {
      if (!f.endsWith('.tsx')) continue
      out.push({ name: `${dir}/${f}`, body: readFileSync(join(ROOT, dir, f), 'utf8') })
    }
  }
  return out
}

/**
 * A component that renders global UI has to be MOUNTED somewhere, not merely
 * exported. `ToastHost` shipped defined-but-unmounted: two features called
 * `showToast` and neither could ever display anything, because nothing was
 * listening to the store. Type-checking and unit tests both passed.
 */
describe('global surfaces are actually mounted', () => {
  const shell = readFileSync(join(ROOT, 'layouts/layout.tsx'), 'utf8')

  it.each(['ToastHost', 'CookieConsent', 'CartDrawer', 'SearchModal', 'MobileNavDrawer'])(
    'renders <%s /> in the shell',
    (name) => {
      expect(shell).toMatch(new RegExp(`<${name}\\b`))
    },
  )

  it('every showToast caller can reach a mounted host', () => {
    const callers = sourceFiles().filter((f) => /\bshowToast\(/.test(f.body) && !f.name.endsWith('Overlays.tsx'))
    // The host is global, so one mount covers them all — but if there are
    // callers and no mount, none of them works.
    expect(callers.length).toBeGreaterThan(0)
    expect(shell).toMatch(/<ToastHost\b/)
  })
})

/**
 * Exactly one `h1` per page.
 *
 * Making every slideshow slide an `h2` avoided competing `h1`s and left the
 * home page with none at all — nothing for a screen reader or a search engine
 * to anchor on. The first slide now carries it.
 */
describe('document outline', () => {
  it('gives the slide ON SCREEN the page heading and the others a lower level', () => {
    const slideshow = readFileSync(join(ROOT, 'sections/Slideshow.tsx'), 'utf8')
    const slide = readFileSync(join(ROOT, 'sections/SlideItem.tsx'), 'utf8')
    expect(slideshow).toMatch(/headingLevel: i === idx \? 'h1' : 'h2'/)
    // The heading follows the slide on SCREEN, not slide one. An inactive
    // slide is hidden with `visibility: hidden`, which removes it from the
    // accessibility tree — so pinning the h1 to the first slide left the home
    // page with no top-level heading six seconds after load.
    expect(slide).toMatch(/headingLevel: index >= 0 && index === active \? 'h1' : 'h2'/)
  })

  it('gives the search page its own top-level heading', () => {
    expect(readFileSync(join(ROOT, 'sections/SearchResults.tsx'), 'utf8')).toMatch(/<h1 className="search__heading"/)
  })

  it('lets the section that IS the page carry the page heading', () => {
    // /collections renders collection-list and nothing else, so its header is
    // the page's h1 — it had none at all.
    expect(readFileSync(join(ROOT, 'sections/CollectionList.tsx'), 'utf8')).toMatch(/as=\{isIndexPage \? 'h1' : 'h2'\}/)
    expect(readFileSync(join(ROOT, 'components/SectionHead.tsx'), 'utf8')).toMatch(/as\?: 'h1' \| 'h2'/)
  })
})

/**
 * A grid that reserves a track must contain the thing that fills it.
 *
 * The collection page reserved a 260px sidebar column while the sidebar was
 * rendered in a sibling element, so the product grid landed in the 260px
 * track: every card was 71px wide at 1440 on every collection page. Nothing
 * in type-checking or the unit tests could see it.
 */
describe('collection page layout', () => {
  const body = readFileSync(join(ROOT, 'components/CollectionBody.tsx'), 'utf8')
  const toolbar = readFileSync(join(ROOT, 'components/CollectionToolbar.tsx'), 'utf8')

  it('renders the filter sidebar inside the grid that lays it out', () => {
    // The sidebar must appear between the opening .collection-body div and the
    // results div — i.e. as its child, not before it.
    const start = body.indexOf('className="collection-body"')
    const results = body.indexOf('collection-body__results')
    const sidebar = body.indexOf('<CollectionFilters')
    expect(sidebar).toBeGreaterThan(start)
    expect(sidebar).toBeLessThan(results)
  })

  it('does not let the toolbar render the sidebar', () => {
    expect(toolbar).not.toMatch(/<aside className="collection-filters"[\s\S]{0,200}<\/aside>\s*\)\}\s*<Drawer/)
  })

  it('reserves the sidebar track only when a sidebar is actually present', () => {
    // Without :has(), a store whose products share one brand has no facets,
    // no sidebar — and a grid squeezed into the empty 260px track.
    expect(styles).toMatch(/\.collection-body\[data-filters='sidebar'\]:has\(\.collection-filters\)\s*\{[^}]*260px/)
  })
})

/**
 * No hardcoded light-on-dark text.
 *
 * The footer's secondary text was a literal `rgba(255,255,255,.7)`, which only
 * worked while the footer was always dark. The moment its background became a
 * merchant choice — and the design's default is the LIGHT Surface Secondary —
 * that text turned invisible. Colour must come from a role, never a literal.
 */
describe('colour is never hardcoded for one background', () => {
  it('has no literal white text in the chrome or sections', () => {
    const offenders = sourceFiles()
      .filter((f) => /rgba\(\s*255\s*,\s*255\s*,\s*255/.test(f.body))
      .map((f) => f.name)
    expect(offenders).toEqual([])
  })
})

/**
 * Sections read the platform's real data contract.
 *
 * Several sections invented fields by casting — `hours` and `image` onto a
 * store location, `totalPrice` onto an order, `tags` onto an article that the
 * query never asked for. A cast makes it type-check; it does not make the data
 * arrive, so the feature silently never renders.
 */
describe('data mapping', () => {
  it('widens no contract type with an inline cast', () => {
    const offenders = sourceFiles()
      .filter((f) => /as [A-Za-z]+ & \{ /.test(f.body.replace(/ImportMetaEnv & \{/g, '')))
      .map((f) => f.name)
    expect(offenders).toEqual([])
  })

  it('shows the cart total, not the subtotal in its place', () => {
    // `Cart.total` is the amount after discounts and gift cards. Printing
    // `subtotal` as the Total is wrong the moment either applies.
    const cart = readFileSync(join(ROOT, 'sections/CartItems.tsx'), 'utf8')
    expect(cart).toMatch(/total,/)
    expect(cart).toMatch(/total=\{total\}/)
  })

  it('persists the order note through the cart API', () => {
    // It used to live in local state and was discarded on navigation.
    expect(readFileSync(join(ROOT, 'sections/CartItems.tsx'), 'utf8')).toMatch(/updateNote\(note\)/)
  })

  it('reports fulfilment status, not payment status, in order history', () => {
    const acct = readFileSync(join(ROOT, 'sections/AccountPage.tsx'), 'utf8')
    expect(acct).toMatch(/fulfillmentStatus/)
  })

  it('asks the article query for the tags it renders', () => {
    const article = readFileSync(join(ROOT, 'sections/ArticleBody.tsx'), 'utf8')
    const queryAsksForTags = /author \{ name \}\s*\n\s*tags/.test(article)
    expect(queryAsksForTags).toBe(true)
  })
})

/**
 * One transport for storefront data.
 *
 * Five places hand-built their own `fetch` — each reading env vars, building
 * the store URL, attaching the publishable key, and (in three of the five)
 * forgetting the country header. That is how one section quotes a different
 * currency from the rest of the store. The kit's `graphql()` / typed lookups
 * carry those headers already.
 */
describe('data transport', () => {
  it('no section or layout builds its own storefront request', () => {
    // Precise: a same-origin POST to the merchant's contact endpoint or the
    // account session route is fine. What is banned is hand-building a
    // STOREFRONT call — the tell is the graphql path or the publishable key.
    const offenders = sourceFiles()
      .filter((f) => /\/graphql|x-publishable-key/.test(f.body))
      .map((f) => f.name)
    expect(offenders).toEqual([])
  })

  it('no section reaches for the backend env vars directly', () => {
    const offenders = sourceFiles()
      .filter((f) => /VITE_TANQORY_(BACKEND|STORE_ID|STOREFRONT_TOKEN)/.test(f.body))
      .map((f) => f.name)
    expect(offenders).toEqual([])
  })
})

/**
 * A dead image URL degrades to the placeholder.
 *
 * Real catalogues carry dead media references — one product in the dev store
 * points at an object that 404s and returns HTML, which the browser refuses to
 * render. Without an error path the card shows a blank frame instead of the
 * "no image" treatment the design specifies.
 */
describe('image robustness', () => {
  it('drops an image that fails to load', () => {
    const src = readFileSync(join(ROOT, 'components/ImageResponsive.tsx'), 'utf8')
    expect(src).toMatch(/onError=\{\(\) => setFailed\(true\)\}/)
    expect(src).toMatch(/if \(!src \|\| failed\) return null/)
  })
})

/**
 * Stretching a control must not shrink its touch target.
 *
 * Making the quantity stepper match the buy button's height used `height:
 * auto`, which collapsed the buttons to 18px the moment the row stacked on a
 * phone — well under the 44px the design requires of every control.
 */
describe('touch targets survive layout changes', () => {
  it('never lets a stretched control fall below the touch target', () => {
    const buy = styles.slice(styles.indexOf('.product-details__buy .qty__btn'))
    expect(buy).toMatch(/min-height: var\(--touch-target\)/)
  })
})
