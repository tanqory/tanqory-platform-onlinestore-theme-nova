# nova — Tanqory React theme

A standalone Tanqory theme. Runs **offline** with mock data; depends on
`@tanqory/theme-kit` for the framework. The model: **React component = block**,
**content = JSON tree** (not HTML), edited by the visual editor.

```bash
pnpm install       # pnpm is the package manager for this repo (see packageManager)
pnpm dev           # → http://localhost:4321  (offline, mock data)
pnpm verify        # typecheck + manifest:check + test + build — what CI runs
```

Individual checks:

```bash
pnpm typecheck        # tsc over every file the theme ships, sections/ included
pnpm manifest:check   # theme.manifest.json + README catalog match the code,
                      # and no template sets a setting its section doesn't declare
pnpm test             # regression tests (vitest)
pnpm build            # production build (regenerates the manifest first)
```

A clean clone must pass all four with `pnpm install --frozen-lockfile` and no
local files: that is the contract. `npm` is not supported here — there is one
lockfile (`pnpm-lock.yaml`) on purpose.

## Docs

| File | For |
|---|---|
| [CLAUDE.md](CLAUDE.md) | architecture, the schema vocabulary, the data layer, the gates and their traps — start here when working on the theme |
| [docs/DESIGN-GAPS.md](docs/DESIGN-GAPS.md) | every deliberate deviation from the approved design package, and why |
| [docs/THEME-AUDIT.md](docs/THEME-AUDIT.md) | the readiness review and what it found |

## One rule to read the whole repo

> **`.ts` / `.tsx` = code (dev writes) · `.json` = data (editor/merchant edits)**

## Structure

```
assets/styles.css     styling + design tokens                  [static]
sections/             editor sections — React + schema         [.tsx]  code
  Hero · Button · ProductGrid                                    (top-level, placeable units)
components/           reusable pieces (no schema, not sections) [.tsx]  code
  Price
layouts/layout.tsx    site shell: header / footer              [.tsx]  code
templates/            per-page composition                      [.json] editor data
  index.json
config/
  settings.schema.ts  global settings — schema (typed)          [.ts]   code
  settings.json       global settings — values                  [.json] editor data
locales/en.json       storefront translations                   [.json] translator data
tanqory.config.ts     project config (data mode/endpoint)       [.ts]   dev
package.json          manifest + deps
─ build wiring (moves into the `tanqory dev` CLI later):
  index.html · main.tsx · vite.config.ts · lib/collections.json (mock)
```

## Where do I edit…?

| Want to | Go to |
| --- | --- |
| add / edit a section | `sections/*.tsx` |
| reusable piece (price, stars…) | `components/*.tsx` |
| arrange a page (order / section settings) | `templates/*.json` |
| header / footer | `layouts/layout.tsx` |
| colors / fonts / shop name (site-wide) | `config/settings.json` (schema in `settings.schema.ts`) |
| text / translations | `locales/*.json` |
| styling | `assets/styles.css` |
| data source / mode | `tanqory.config.ts` |

## How it works
- A **section** (`sections/*.tsx`) is one definition serving three consumers: dev writes
  the React component + `attributes` schema; the editor auto-builds settings UI from
  the schema; the storefront renders it. Content stays a **JSON tree** the editor edits.
- `@tanqory/theme-kit` auto-discovers `sections/`, `templates/`, `layouts/` and mounts.
- typed React sections (no proprietary templating); reusable bits are plain **components/** (not a
  separate `snippets/`); schema/values split by file extension (`.ts` vs `.json`).

## Catalog

Everything this theme contains is described, machine-readably, in
[`theme.manifest.json`](./theme.manifest.json) — every section (with its editor
attributes), every template, and the theme settings. The editor inserter, the AI
generator, and the dashboard↔storefront conformance test all read it, so it is
the one place that can never disagree with the code.

The list below is generated from that manifest — **do not edit by hand**; run
`pnpm manifest` (it also refreshes this block).

<!-- BEGIN GENERATED CATALOG -->
**62 sections · 18 templates · 61 settings**

### Sections by category
- **block** (28): accordion, add-to-cart, button, collection-item, column, faq-item, footer-brand, footer-menu, footer-text, heading, icon, image, jumbo-text, logo, payment-icons, product-description, product-inventory, product-price, product-sku, product-title, quantity, slide, social-links, spacer, swatches, text, variant-picker, video
- **commerce** (11): account, cart-items, collection-list, featured-collection, featured-product, main-collection, policy-page, product-details, product-grid, search-results, store-locator
- **content** (11): article-body, blog-posts, collection-links, faq, feature-grid-blocks, feature-highlights, image-with-text, marquee, multicolumn, page-body, rich-text
- **forms** (1): contact-form
- **layout** (7): announcement-bar, divider, footer, group, header, hero, slideshow
- **marketing** (1): newsletter
- **product** (1): product-recommendations
- **social-proof** (1): logo-list
- **system** (1): not-found

### Shared groups
- **footer** (footer): footer — used by 17 template(s)
- **header** (header): header — used by 17 template(s)

### Templates
| template | header | footer | sections |
| --- | --- | --- | --- |
| `404` | ↗ header | ↗ footer | featured-collection, not-found |
| `account` | ↗ header | ↗ footer | account |
| `article` | ↗ header | ↗ footer | article-body |
| `article.longform` | ↗ header | ↗ footer | article-body, rich-text |
| `blog` | ↗ header | ↗ footer | blog-posts |
| `blog.featured` | ↗ header | ↗ footer | blog-posts, rich-text |
| `cart` | ↗ header | ↗ footer | cart-items, featured-collection |
| `collection` | ↗ header | ↗ footer | main-collection |
| `collection.featured` | ↗ header | ↗ footer | main-collection, rich-text |
| `contact` | ↗ header | ↗ footer | contact-form, rich-text |
| `index` | override | override | collection-links, collection-list, contact-form, divider, faq, feature-grid-blocks, feature-highlights, featured-collection, featured-product, group, image-with-text, logo-list, marquee, multicolumn, newsletter, product-grid, product-recommendations, rich-text, slideshow, store-locator |
| `list-collections` | ↗ header | ↗ footer | collection-list |
| `page` | ↗ header | ↗ footer | page-body |
| `page.contact` | ↗ header | ↗ footer | contact-form, page-body |
| `policy` | ↗ header | ↗ footer | policy-page |
| `product` | ↗ header | ↗ footer | featured-collection, product-details |
| `product.bundle` | ↗ header | ↗ footer | featured-collection, product-details, rich-text |
| `search` | ↗ header | ↗ footer | search-results |

### Theme settings
- **Typography**: headingFont, bodyFont, typeScale, headingWeight, buttonTextStyle
- **Colour**: colorPrimary, colorBackground, colorText, colorSecondarySurface, colorBorder, colorSale, accent
- **Layout**: pageWidth, sectionSpacing
- **Components**: buttonRadius, buttonBorder, inputRadius, cardRadius, cardBorder, cardHoverEffect, badgeStyle, iconStyle, motion
- **Product media**: productImageRatio, productImageFit, showVendorGlobally
- **Brand**: logo, shopName, locale
- **Header**: headerMenuHandle, enableSpaNavigation, enableAccountDropdown, enableMobileNavDrawer, mobileNavHeading, mobileNavWidth
- **Search**: enableSearchModal, searchPlaceholder, searchCtaLabel, searchModalWidth, searchDebounceMs, searchMaxResults
- **Cart**: enableCartDrawer, cartDrawerWidth, cartEmptyHeading, cartEmptySubtext, cartCheckoutLabel, cartViewLabel
- **Account**: accountLoggedIn, accountHeading, accountSubtext, accountPrimaryLabel, accountPrimaryHref, accountSecondaryLabel, accountSecondaryHref, accountExtraLinks
- **Footer**: footerShopMenuHandle, footerHelpMenuHandle, footerCompanyMenuHandle, footerTagline, showPoweredBy, poweredByLabel
<!-- END GENERATED CATALOG -->

