# nova — Tanqory React theme

A standalone Tanqory theme. Runs **offline** with mock data; depends on
`@tanqory/theme-kit` for the framework. The model: **React component = block**,
**content = JSON tree** (not HTML), edited by the visual editor.

```bash
npm install
npm run dev        # → http://localhost:4321  (offline, mock data)
npm run build
npm run typecheck
```

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
- vs Shopify: Liquid → typed React; reusable bits are plain **components/** (not a
  separate `snippets/`); schema/values split by file extension (`.ts` vs `.json`).

## Catalog

Everything this theme contains is described, machine-readably, in
[`theme.manifest.json`](./theme.manifest.json) — every section (with its editor
attributes), every template, and the theme settings. The editor inserter, the AI
generator, and the dashboard↔storefront conformance test all read it, so it is
the one place that can never disagree with the code.

The list below is generated from that manifest — **do not edit by hand**; run
`npm run manifest` (it also refreshes this block).

<!-- BEGIN GENERATED CATALOG -->
**61 sections · 18 templates · 34 settings**

### Sections by category
- **block** (28): accordion, add-to-cart, button, collection-item, column, faq-item, footer-brand, footer-menu, footer-text, heading, icon, image, jumbo-text, logo, payment-icons, product-description, product-inventory, product-price, product-sku, product-title, quantity, slide, social-links, spacer, swatches, text, variant-picker, video
- **commerce** (10): account, cart-items, collection-list, featured-collection, featured-product, policy-page, product-details, product-grid, search-results, store-locator
- **content** (11): article-body, blog-posts, collection-links, faq, feature-grid-blocks, feature-highlights, image-with-text, marquee, multicolumn, page-body, rich-text
- **forms** (1): contact-form
- **layout** (7): announcement-bar, divider, footer, group, header, hero, slideshow
- **marketing** (1): newsletter
- **product** (1): product-recommendations
- **social-proof** (1): logo-list
- **system** (1): not-found

### Templates
| template | sections |
| --- | --- |
| `404` | featured-collection, footer, header, not-found |
| `account` | account, footer, header |
| `article` | article-body, footer, header |
| `article.longform` | article-body, footer, header, rich-text |
| `blog` | blog-posts, footer, header |
| `blog.featured` | blog-posts, footer, header, rich-text |
| `cart` | cart-items, featured-collection, footer, header |
| `collection` | featured-collection, footer, header |
| `collection.featured` | featured-collection, footer, header, rich-text |
| `contact` | contact-form, footer, header, rich-text |
| `index` | collection-list, featured-collection, featured-product, footer, header, image-with-text, logo-list, multicolumn, slideshow |
| `list-collections` | collection-list, footer, header |
| `page` | footer, header, page-body |
| `page.contact` | contact-form, page-body |
| `policy` | footer, header, policy-page |
| `product` | featured-collection, footer, header, product-details |
| `product.bundle` | featured-collection, footer, header, product-details, rich-text |
| `search` | footer, header, search-results |

### Theme settings
- **Account**: accountLoggedIn, accountHeading, accountSubtext, accountPrimaryLabel, accountPrimaryHref, accountSecondaryLabel, accountSecondaryHref, accountExtraLinks
- **Brand**: shopName, accent
- **Cart**: enableCartDrawer, cartDrawerWidth, cartEmptyHeading, cartEmptySubtext, cartCheckoutLabel, cartViewLabel
- **Footer**: footerShopMenuHandle, footerHelpMenuHandle, footerCompanyMenuHandle, footerTagline, showPoweredBy, poweredByLabel
- **Header**: headerMenuHandle, enableSpaNavigation, enableAccountDropdown, enableMobileNavDrawer, mobileNavHeading, mobileNavWidth
- **Search**: enableSearchModal, searchPlaceholder, searchCtaLabel, searchModalWidth, searchDebounceMs, searchMaxResults
<!-- END GENERATED CATALOG -->

