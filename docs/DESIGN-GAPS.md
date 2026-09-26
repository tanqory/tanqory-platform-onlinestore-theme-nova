# Design conversion — known gaps

Written for: the next person implementing against the approved Claude Design
package.

The design has **four configuration levels**, and this file now covers all of
them. It used to cover one:

| Level | What | Where the design defines it | Enforced by |
|---|---|---|---|
| 1 | 25 global theme props | `06 Configuration System` | `check:design` |
| 2 | 48 component props | `06 Configuration System` | not ratcheted — internal component API, not merchant settings |
| 3 | 11 shared section props | `06 Configuration System` | `check:design` |
| 4 | 165 per-section props, 33 sections | `05 Handoff Notes` | `check:design` |

`design/spec/*.json` are **generated**, not hand-maintained:
`node scripts/extract-design-spec.mjs --write` executes each `.dc.html`'s own
`renderVals()` and writes the three spec files. `pnpm check:spec` fails if they
drift from `design/`, which is why `design/` is now **tracked in git** — it was
gitignored while the files derived from it were committed, so nobody downstream
could re-verify the extraction.

`node scripts/check-design-coverage.mjs` is the shrink-only ratchet across
levels 1, 3 and 4. It compares option lists and defaults, not just names: a
name-only check is what let eleven global props drift, three of them onto a
different concept than the design specified.

Layout: the approved package is `design/`, everything extracted from it is
`design/spec/`, and this file is the written record beside it in `docs/`.

This file records the places where the platform, not the theme, is the
constraint, plus the deliberate deviations — so nobody re-litigates them by
reading the code and assuming something was forgotten.

Each entry says what the design asks for, why it cannot be delivered in full,
and what ships instead. **Nothing here is silently downgraded** — the control
exists in the editor with the design's vocabulary, and the section degrades to
the nearest honest behaviour.

---

## Data-layer gaps

These block a prop outright. The fix is in `lib/tanqory` / the storefront
API, not here.

| # | Design asks for | Why not | Ships instead |
|---|---|---|---|
| **F17** | `store-locator.layout: list \| list+map`, `showHours`, `showImage` | `locations()` returns name, code and a postal address. No coordinates, no opening hours, no image, no map provider. | **`layout` is no longer declared.** It shipped as a one-option select that no code read — a control that cannot change anything is worse than an absent one, and `check:inert` now fails on it. It returns the moment the resource carries coordinates. `showHours` / `showImage` stay declared and render the field when the resource carries it; today the row omits it rather than printing an empty label. |
| ~~**F18**~~ | `cart-items.showLineCompareAt` strikethrough | ~~`CartLine` has no `compareAtPrice`.~~ | **Resolved 2026-09-19.** `CartLine.discountAllocations` carries the amount taken off, so the pre-discount figure is `lineSubtotal + allocations` — real data, not an invented field. |
| **F19** | `policy-page.showLastUpdated` | `ShopPolicy` has no updated timestamp. | The control is wired; the line renders only when `updatedAt` is present. |
| **F20** | `product-recommendations.intent: related \| complementary` | `productRecommendations(productId)` takes no intent argument. | `intent` offers `related` only. Adding the second value without an API change would produce two options that return identical results. |
| ~~**F22**~~ | `search-results` over articles and pages | ~~There is no content search endpoint.~~ | **Resolved 2026-09-19.** The storefront does have `search(query, {types})` covering products, pages and articles. The section used to filter the bootstrap's `all` collection in the browser, which finds NOTHING on a live store because that collection is not in the boot payload. Now wired to the real endpoint; all three tabs report real counts. |
| **F24** | Colour swatches on a product card | `ProductOption` is `{name, values: string[]}` — the contract carries no swatch colour or image. | Swatches are mapped from the product's real colour option values. A circle is tinted only when the value names a CSS colour the browser resolves; otherwise it stays neutral and keeps the value as its accessible name, so the information survives even when the hue cannot. |
| **F25** | Collection sorting | The storefront ignores `sortKey` and `reverse` on a collection query — verified against the live store: default, `PRICE`, `TITLE` and `PRICE`+`reverse` all return identical order. | The request still sends the arguments, and the theme additionally orders the loaded products client-side so the Sort control actually reorders what the shopper sees. With load-more this orders the loaded set, not the whole catalogue; it becomes exact once the backend honours the arguments. |
| **F26** | `newsletter` / `contact-form` submit somewhere | The platform serves no form endpoint: nothing answers a POST from the storefront (no route in the gateway, the router, the BFFs or store-api). The sections used to default `action` to a made-up path, which sent every shopper to a 404. | `action` has no default. Without one the section renders its copy and no form, and the editor canvas says why. The form returns the day a public endpoint exists. |
| **F27** | `account` template | `/account*` is intercepted at the edge and served by the accounts service, so the theme's `account` template never renders on a published store. | The template and `account` section stay for the editor canvas and offline dev. Sign-in state on the storefront comes from the accounts service's session (`overlays/AccountMenu.tsx`). |
| **F23** | `product-grid` facets from the API | `collectionProducts` accepts a `filters` argument but returns no facet list. | Facets are **derived client-side** from the loaded products (vendor, type, tags) in `components/CollectionToolbar.tsx`. The options shown are exactly those present in the loaded results — correct, but not the full catalogue's facets until every page is loaded. |

## Editor / field-type gaps

The `AttrSpec` vocabulary has 20 field ids. These design controls have no id.

| Design control | Used by | Ships instead |
|---|---|---|
| **resource list** | `collection-list.collections`, `search-results.noResultsCollections`, `not-found.collectionLinks` | A comma-separated handle list, plus child blocks where the section supports them (`collection-list` prefers blocks). |
| **multi-select / chips** | `contact-form.fields`, `search-results.resultTypes` | A `select` of the approved combinations. The values the design lists are all reachable; arbitrary combinations are not. |
| **9-grid position picker** | `hero.contentPosition` | Two `select`s — vertical third and alignment — which is the same information with a different affordance. |
| **visual choice cards** | `hero.layout`, `header.layout`, `collection-list.layout`, `feature-grid-blocks.preset` | `select`. Every value survives; the picture-picker affordance does not. |
| **stepper** | `columns`, `productsToShow`, `lowStockThreshold` | `range`. The design distinguishes stepper from range; the distinction is inexpressible. |
| **segmented** | ~120 props | `select` / `text_alignment`. Values survive, affordance does not. |
| **per-option control type** | `product-details.variantStyle` | One section-wide choice plus `auto`, which picks swatches for colour and switches to a dropdown past 14 values. Per-option settings are keyed at author time and cannot vary by a product's option names. |
| **font picker** | global typography (`headingFont`, `bodyFont`) | A `select` over the curated Google list in `lib/theme-settings.ts` (`FONT_OPTIONS`), which also loads the stylesheet. The design's "system + curated Google list" is what it offers; an arbitrary family is not reachable. |

## Behavioural gaps

| Design rule | Status |
|---|---|
| ~~`faq.singleOpen` in block mode~~ | **Resolved 2026-09-18.** It was inert in block mode — which the section's own preset ships, so the setting did nothing for essentially every merchant. The section now owns the open state and coordinates its question blocks. A question block placed outside an FAQ still manages itself. |
| Overlay auto-raises when measured contrast < 4.5:1 | Not implemented — needs a luminance measurement of the merchant's image at render time. `overlay` defaults to `medium`, which clears the threshold for typical photography. |
| Adjacent-section spacing collapse | Not implemented. Sections render independently and cannot see a sibling's spacing. |
| `featured-product.showVariants` inline picker | The section does not fetch the variant list, so it cannot resolve a variant. The control changes the CTA between "Choose options" and "View details" — both routing to the PDP, where the real picker lives — rather than rendering a picker that cannot add to cart. |
| Announcement `messages[]` | Three explicit slots (`text`/`text2`/`text3`), because the editor cannot author a repeating list. |

## Controls that shipped dead (resolved 2026-09-20)

`check-inert-settings.mjs` reported `✓ every declared setting is read` while
three controls did nothing. Its matcher asked "does this key appear in ANY
theme source file?", so `header.logoHeight` was satisfied by `LogoList.tsx`,
`product-details.buttonLink` by `Hero.tsx`, and `store-locator.layout` by the
word `layout` in `layouts/layout.tsx`. It now resolves each section to the file
that DECLARES it and walks only that file's transitive imports.

| Control | Was | Now |
|---|---|---|
| `header.logoHeight` | declared with three options; `styles.css` hard-coded `height: 30px` — not even one of them — and two templates already persisted `"medium"` | read in `SiteHeader`, emitted as `data-logo-height`, sized 24/32/40 with the design's −8px on mobile |
| `product-details.buttonLink` | "Add to cart link override" on a cart-API submit — nothing to hook | removed; it is not in the design either |
| `store-locator.layout` | one-option select, read nowhere | removed — see F17 |

## Content migration

19 sections changed an attribute name or type, and eight global settings
changed their VALUE vocabulary (not their key) when the theme was realigned
onto `06 Configuration System`. `scripts/migrate-content.mjs` migrates the
theme's own templates and `config/settings.json`, and its `RENAMES` /
`VALUE_RENAMES` tables are the **record of every change**.

A value rename is the quieter hazard: a value no longer in the select falls
back to the default with no warning, so a merchant who chose "Bold" icons or a
"Pill" badge would silently land on the theme default.

Merchant content is NOT migrated by it. `k8s.mjs` merges theme updates by path
prefix with no content version, so a merchant's saved value under an old key is
orphaned on upgrade. Applying this same map at publish time is the outstanding
work; the map is deliberately append-only so it stays replayable.

## Deliberate deviations from the design (levels 1 and 3)

These are choices, not omissions. Each is a live gap in `check:design`'s
baseline, so the count cannot grow without someone noticing.

| # | Design | Ships | Why |
|---|---|---|---|
| **G1** | colour and font globals default to a value (`#FCFCFB`, `Instrument Sans`, …) | every Brand / Colour / font setting defaults to `''` | `''` means "not set": the storefront then uses the store's Settings → Brand where it has a value, else the token — and the token carries the design's default, which is what `check:design` now verifies (`assets/tokens.css`). A non-empty colour default would be written on every store and switch off the automatic dark scheme. |
| **G2** | `pageWidth: standard \| wide` | adds `full` | A Nova extension. `--container-full` exists in the token ladder and merchants may already have selected it; removing it would silently reset those stores. |
| **G3** | `sectionSpacing: small \| medium \| large` | adds `none` and `xlarge` | Same: the section-spacing token ladder defines all five rungs, and the design's own shared `spacingTop`/`spacingBottom` use `none … xl`. The global default matches the design. |
| **G4** | every section exposes the 11 shared props | `announcement-bar`, `header`, `footer`, `divider`, `marquee` expose none | `06` says "unless marked n/a in 05". These five are fixed-height chrome or full-bleed utility sections whose `05` entries specify their own heights, and two carry their own spacing control. Section padding/width/alignment controls on them would change nothing. |
| **G5** | shared `heading` / `eyebrow` / `description` on every section | only on sections that render a `SectionHead` | A declared setting nothing reads is exactly what `check:inert` exists to stop. Adding them everywhere would trade one broken promise for another. |
| **G6** | `cardHoverEffect: image-swap` (the default) | falls back to `zoom` | The design's own rule: "falls back to zoom when no 2nd image". `ProductCard` carries only `featuredImage` today. When the card carries a second image this starts working with no further change. |
| **G7** | Text Secondary `#5C5955`, Text Muted `#8A867F` | `#55524e`, `#736f68` | **Deliberately darker than the design.** The design's values measure 3.53:1 and 3.27:1 against the page and footer surfaces — they fail WCAG AA for the body-size text that uses them (sold-out chips, quantity glyphs, compare-at price, counts). Reverting to the design's hexes would reintroduce QA finding P1-3. |

## Not in the design package

Nova ships these and the design does not mention them. They are kept as Nova
extensions, not dropped:

- `main-collection` — the URL-driven collection page. The design folds this role
  into `product-grid`, but `main-collection` is what a `/collections/<handle>`
  route actually renders. Both now share `components/CollectionBody.tsx`, so
  they cannot diverge.
- `accent` — a second brand slot for primary (solid) buttons, with AA-checked
  label colours on the colour and on its hover shade. Not one of the design's 25
  global props; without it the primary button is the brand colour, as the design
  says.
- `logo`, `shopName`, `locale` — brand identity and the theme's own language.
- `colorBrand`, `fontHeading`, `fontBody` — the names an earlier build saved
  under. The schema uses the design's names (`colorPrimary`, `headingFont`,
  `bodyFont`); the old ones are still read by `lib/theme-settings.ts`, accepted
  by the live preview, and renamed by `scripts/migrate-content.mjs`.
- `[data-scheme='dark']` — a full dark scheme. The design defines no dark mode.
- The `--z-*` ladder — the design specifies no z-index system.
