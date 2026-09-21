# Nova — Tanqory React theme

A standalone storefront theme. **React component = section/block, content = JSON
tree.** The visual editor writes the JSON; you write the `.tsx`. The framework
(`@tanqory/theme-kit`) owns routing data, cart, storefront API and the editor
transport — the theme owns presentation, schema and composition.

There is no template language here: no markup files with embedded schema
blocks, no partials folder. A section's schema lives in code, next to its
component — `defineSection({ attributes })`.

```bash
pnpm install --frozen-lockfile   # pnpm only — there is one lockfile on purpose
pnpm dev                         # → http://localhost:4321
pnpm verify                      # every gate; what CI runs
pnpm verify:live                 # a11y + layout gates, needs `pnpm dev` running
```

---

## One rule to read the whole repo

> **`.ts` / `.tsx` = code (a developer writes) · `.json` = data (the merchant's
> editor writes)**

Never hand-edit `theme.manifest.json` — it is generated from the `.tsx` schemas
by `pnpm manifest`. Editing a `templates/*.json` by hand is fine but it is
merchant content, so treat it as starter data, not as code.

## Directory structure

```
.
├── assets/           styles.css + tokens.css — all styling and design tokens
├── components/       reusable pieces with NO schema; not placeable in the editor
├── config/           settings.schema.ts (types) + settings.json (values)
├── design/           the approved design package (.dc.html) — source of truth
│   └── spec/         generated extracts + the coverage ratchet's baseline
├── docs/             DESIGN-GAPS.md (deliberate deviations from the design)
├── groups/           header.json / footer.json — the SHARED chrome     [.json data]
├── layouts/          layout.tsx — the site shell: header, footer, SPA router
├── lib/              framework-adjacent helpers: routes, head, theme settings
├── locales/          en.json / th.json — system strings (NOT merchant content)
├── overlays/         cart drawer, search modal, account menu, mobile nav
├── scripts/          the manifest generator and the check-* gates
├── sections/         editor sections and blocks — React + schema  ← most work
├── templates/        per-page composition                          [.json data]
├── tests/            vitest regression suites
└── vendor/           the pinned @tanqory/theme-kit tarball + checksum (see vendor/README.md)
```

### `sections/`

Every file here calls `defineSection` and becomes something the merchant can
place. A **section** is a top-level page unit (Hero, ProductGrid); a **block**
is a smaller unit that only exists inside a section's `allowedBlocks` (SlideItem
inside Slideshow, FaqItem inside FAQ). Both are declared the same way — the
difference is whether anything lists it in `allowedBlocks`.

```tsx
import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

export function Hero({ attributes, children }: SectionProps): JSX.Element {
  const heading = attributes.heading as string | undefined
  return (
    <section {...sharedRootProps(attributes)} className="section">
      <div className="container">{heading && <h2>{heading}</h2>}</div>
    </section>
  )
}

export default defineSection({
  name: 'hero',              // kebab-case; this is the id templates reference
  title: 'Hero',             // what the editor shows
  category: 'layout',
  icon: 'image',
  attributes: withShared({   // the merchant-editable settings
    heading: { type: 'text', label: 'Heading', default: 'Welcome' },
  }),
  allowedBlocks: ['slide'],  // omit for a section that takes no blocks
  presets: [{ name: 'Hero', settings: {}, blocks: [] }],
  component: Hero,
})
```

Rules that the gates enforce:

- **Every declared attribute must be read by the section that declares it.**
  `pnpm check:inert` resolves `name` → the file that declares it and walks only
  that file's transitive local imports. A control the editor shows that changes
  nothing is worse than a missing one.
- **A section's root gets `{...sharedRootProps(attributes)}`** so the eleven
  shared props (spacing, width, alignment, background, anchor, hide-on-mobile)
  work. Spread it FIRST so a section's own explicit attribute wins.
- **One `h1` per page.** `pnpm check:headings` enforces it across templates.

### `components/`

No schema, not placeable, not in the manifest. If two sections need the same
markup it belongs here. `ProductCard`, `Button`, `Select`, `StateBlock`,
`CollectionBody` are the load-bearing ones — prefer extending them over
hand-rolling a variant inside a section.

### `assets/`

`tokens.css` holds the design system (colour roles, type scale, spacing,
radius, motion, z-index). `styles.css` consumes it. **No raw hex or magic
numbers in `styles.css`** — the design's own principle is "semantic, never raw".
If a value has no token, add the token.

---

## The settings schema

`AttrSpec.type` is a closed vocabulary — these 20 ids and no others:

```
text · textarea · richtext · html · url · number · range · boolean
select · radio · color · text_alignment · image · video
collection · product · page · blog · article · menu
```

Anything the design asks for that is not in this list (font picker, multi-select,
resource list, 9-grid position picker, stepper) has no id and must degrade to
the nearest one — record it in `docs/DESIGN-GAPS.md` rather than faking it.

Other `AttrSpec` fields: `default`, `label`, `info`, `placeholder`,
`min`/`max`/`step`/`unit` (for `range`), `options` (for `select`/`radio`), and
`visible_if` for conditional visibility, `group` (editor panel grouping) and
`dynamic` (the setting can be bound to a data source). All of them are in the
kit's published `AttrSpec` type — there is no local type shim any more.

```ts
rotation: {
  type: 'boolean',
  default: false,
  label: 'Auto-rotate',
  visible_if: "{{ section.settings.text2 != '' }}",
}
```

### Good practices

**A setting that maps to one CSS value → a CSS custom property.**

```tsx
<section className="section" data-logo-height={logoHeight}>
```
```css
.site-header[data-logo-height='small'] { --logo-height-header: 24px; }
.site-header__logo { height: var(--logo-height-header); }
```

**A setting that changes several properties → a data attribute the CSS branches
on.** Nova uses `data-*`, not class concatenation, so the value stays readable
in the DOM and the editor:

```css
.section[data-content-align='center'] { text-align: center; }
.section[data-content-align='center'] .section-head { align-items: center; }
```

**Never let a setting introduce a value the token system does not have.**
`lib/theme-settings.ts` is the one place semantic choices (`buttonRadius: 'pill'`)
become tokens (`--btn-radius: var(--radius-pill)`). A merchant picks a rung, not
a pixel.

### Global theme settings — one pipeline, and it is live in the editor

```
config/settings.schema.ts   names + controls (the design's 25 global props, + logo / shopName / locale / accent)
config/settings.json        the values; '' = "not set"
lib/theme-settings.ts       PURE: settings (+ Settings → Brand) → CSS variables, root data-* flags, font stylesheet, logo
components/ThemeSettings.tsx the provider: renders the <style>, so SSG bakes it in; listens for the editor's live values
lib/live-settings.ts        which keys an editor frame may set live, validated from the resolver's own tables
```

- **Adding a global setting** = schema entry + a row in the resolver's table
  (`RUNGS`, `COLOR_ROLES`, `ROOT_FLAGS`, …). The live-preview allowlist derives
  from those tables, so the editor's Theme panel moves it with no extra wiring.
  Never apply a setting by mutating `document` from a section or from `main.tsx`.
- **`''` means not set.** Precedence for colour / font / logo: theme setting →
  the store's Settings → Brand → the token in `tokens.css`. A non-empty colour
  default would be written on every store and switch off the dark scheme; the
  design's defaults live in the tokens, and `check:design` checks them there.
- **The design default of a rung writes nothing** — an untouched store gets no
  `<style>` at all (`lib/theme-settings.test.ts` pins this).
- **Label colours are never taken on trust.** Every colour that carries text gets
  its label picked for AA on that colour *and* on its hover shade.
- **Only style keys are live.** `lib/live-settings.test.ts` pins the full list;
  a link, menu handle, copy or feature toggle must never be settable from a frame.
- Names follow `design/spec/global.json`. `colorBrand` / `fontHeading` /
  `fontBody` are older names: still read, renamed by `scripts/migrate-content.mjs`.

**Renaming a setting orphans saved merchant content.** Add it to
`scripts/migrate-content.mjs` — `RENAMES` for a key change, `VALUE_RENAMES` for
a vocabulary change. Both tables are append-only so they stay replayable. A
value rename is the quieter hazard: a value that is no longer in the select
falls back to the default with no warning.

---

### `groups/` and `templates/`

The header and footer live **once**, in `groups/header.json` and
`groups/footer.json`. A template binds them (`"groups": { "header": "header",
"footer": "footer" }`) or keeps its own copy as an explicit
`{ "override": [ …nodes ] }` — the home page does, because it carries an
announcement bar. Editing the shared header in the Studio editor changes every
page that binds it (the editor says so: "Shared · 17 pages"); "Customize for
this page" freezes a copy, "Use shared header" goes back without overwriting
the group.

`resolvePageSections(template, GROUPS)` from the kit is the ONLY way a page
becomes a section list — `layouts/layout.tsx`, `main.tsx` and
`entry-server.tsx` all call it, and studio-api, the editor and the AI use the
same `resolvePage`. Never flatten a template by hand.

`scripts/migrate-groups.mjs --check` (idempotent; the manifest gate fails on a
template that references a group that does not exist) turns inline
header/footer copies into bindings and prints, never merges, a page whose copy
differs. Every section also declares `role` (`layout` | `section` | `block`),
`area` for chrome, and `requiresContext` (`['product']`, …); the editor's
picker and the save validator use them, so a product block can't land on the
cart page. `category` is a picker label, not a placement rule.

## Data

Sections read data through `useData()` from the kit. Everything optional is
optional because an offline/editor payload may not have it — always guard.

```tsx
const { collectionByHandle, collectionProducts, graphql } = useData()
```

| Sync (from the bootstrap payload) | Async (live storefront) |
|---|---|
| `collectionByHandle(handle)` | `collectionProducts(handle, { first, after, sortKey, reverse, filters })` |
| `productByHandle(handle)` | `fetchProduct(handle, { metafields })` |
| `pageByHandle(handle)` | `search(query, { first, types: ['PRODUCT','PAGE','ARTICLE'] })` |
| `allCollections()` | `productRecommendations(productId)` |
| `menu(handle)` | `fetchMenu(handle)` · `blogByHandle` · `articleByHandle` |
| `shop`, `localization` | `locations()` · `metaobject(s)` · `graphql(query, vars)` |

**The bootstrap cache is baked at build time.** A collection whose products were
assigned after the last build sits in the cache as an empty shell. Trust the
cache only when it actually has products; otherwise live-fetch. See
`sections/FeaturedCollection.tsx` for the pattern.

**Cart** is `useCart()` from the kit — never mutate cart state directly.

### Known data-layer limits

The storefront ignores `sortKey`/`reverse` on a collection query, returns no
facet list, and `productRecommendations` takes no intent argument. `locations()`
returns a postal address with no coordinates or hours. Each is recorded in
`docs/DESIGN-GAPS.md` with what ships instead — read it before concluding a
prop was forgotten.

---

## Routing

`lib/routes.ts` is the single route table. `matchRoute(pathname)` returns the
template; `resolvePageTemplate` also honours a merchant's `templateSuffix`.
There is no second route map anywhere — do not add one.

SPA soft navigation is **on by default** (`layouts/layout.tsx`). That means a
section instance is REUSED across routes, which is the single most common source
of bugs in this theme:

- Reset fetched state when the route key changes, or the previous page's content
  renders under the new URL.
- Key resolution to the handle it came from, not to a bare boolean.
- Tag async results with the query they answered, so a slow response cannot
  overwrite a newer one.
- The router tracks pathname **and search**, so `?q=` navigation re-renders.

`lib/head.ts` owns title/canonical/OG per route, and CLEARS a tag the new page
has no value for. `lib/route-analytics.ts` emits route events, de-duplicated by
URL.

---

## The design system contract

The approved package in `design/` has **four configuration levels**, and all of
them are checked:

| Level | What | Source | Spec file |
|---|---|---|---|
| 1 | 25 global theme props | `06 Configuration System` | `design/spec/global.json` |
| 2 | 48 component props | `06 Configuration System` | not ratcheted (internal API) |
| 3 | 11 shared section props (13 entries — one row names three header slots) | `06 Configuration System` | `design/spec/shared.json` |
| 4 | 165 per-section props | `05 Handoff Notes` | `design/spec/sections.json` |

The spec files are **generated**, never hand-edited:

```bash
node scripts/extract-design-spec.mjs --write   # regenerate from design/
pnpm check:spec                                # fail if they drift
```

`design/*.dc.html` carries its data in a `<script type="text/x-dc">` block —
executing `renderVals()` is the only faithful way to read it. Scraping the
markup reads the template, not the values.

Deliberate deviations live in `docs/DESIGN-GAPS.md`. **Read it before "fixing" a
prop that looks missing** — several are blocked by the platform, and two colour
tokens are intentionally darker than the design because the design's own values
fail WCAG AA.

---

## The gates

`pnpm verify` runs these in order. None is decorative; each exists because
something shipped broken past it.

| Gate | Catches |
|---|---|
| `pnpm typecheck` | `tsc` over every file the theme ships, `sections/` included |
| `pnpm manifest:check` | manifest + README catalog stale; a template setting no section declares |
| `pnpm check:spec` | the spec files drifting from `design/` |
| `pnpm check:inert` | a setting the editor shows that nothing reads |
| `pnpm check:design` | design coverage going backwards (shrink-only ratchet) |
| `pnpm check:headings` | a template with zero or two page headings |
| `pnpm test` | vitest regression suites, then `test:lib` — node's runner over `lib/**/*.test.ts` (the pure modules: theme settings, live settings, head, locale, safe-href) |
| `pnpm build` | production build (regenerates the manifest first) |

`pnpm verify:live` needs `pnpm dev` running and adds:

| Gate | Catches |
|---|---|
| `pnpm check:a11y` | axe violations reproducible across two scans, 10 routes |
| `pnpm check:layout` | clipped fields, cramped text, touch targets, 4 routes × 4 widths |

`qa/fidelity/check.py` measures the rendered page against the rules the design
states in writing (bar heights, column counts, aspect ratios). It needs python
playwright; `qa/` is gitignored.

**A ratchet baseline may only ever shrink.** `--update` records a new one and is
a reviewed act, not a reflex.

---

## Rules and skills

`.claude/rules/theme-standards.md` is always loaded — nine invariants, each of
which has been broken at least once.

@.claude/rules/theme-standards.md

Three skills carry the ✅/❌ patterns. Load the one that matches the task
**before** writing code, not after a gate fails:

| Skill | Load it before |
|---|---|
| `theme-section` | adding or editing anything in `sections/`, `groups/` or `templates/` — schema vocabulary, role / area / requiresContext, shared groups, shared props, presets, renames |
| `design-fidelity` | touching tokens, global settings, `design/`, or either ratchet |
| `storefront-correctness` | any section that fetches, any async state, any interactive primitive |

## Traps that have each cost real time

- **A green gate is not proof.** `check:inert` reported "every setting is read"
  while three dead controls shipped, because it matched the key against every
  file in the theme rather than the one that declares it. When a gate is green
  and the behaviour is wrong, suspect the gate.
- **Starter content ships to every store.** Only `all` is guaranteed to exist.
  A handle in `lib/collections.json` is an offline fixture — it can be absent
  from the real shop, which renders an empty row exactly as a dev store's
  handle did.
- **Never state a policy on the merchant's behalf.** No "free shipping", "30-day
  returns" or material claims in defaults, presets or templates. Tests enforce
  this against templates, manifest defaults AND section source.
- **`visibility: hidden` removes an element from the accessibility tree.** Use
  `opacity: 0` when the text must keep providing the accessible name.
- **Layout is not typechecked.** `pnpm verify` passing says nothing about
  whether a field collapsed to 34px; run `verify:live`.
- **The dev server is on 4321**, and it may be pointed at a live backend rather
  than fixtures — check the console before assuming mock data.
- **The kit is installed from `vendor/`, not the registry.** `package.json`
  pins `file:vendor/tanqory-theme-kit-<version>.tgz` and the lockfile pins its
  integrity, so replacing the tarball without `pnpm install --force` makes
  `--frozen-lockfile` fail on a clean clone. `vendor/README.md` has the switch
  to the registry. Never add a local `.d.ts` shim to paper over a kit type —
  fix the kit and ship a new tarball.
- **This repository is public.** Never name another commerce platform, its
  themes, its template language or its documentation — in code, comments, docs,
  tests, commit messages or pull requests. Describe what THIS theme does.
  `tests/theme-integrity.test.ts` fails on the known names; it cannot know
  every one, so the rule is yours to keep. Internal reviews, audits and
  anything that names an unpatched weakness do not belong here either.
- **This repo is one of four.** The Studio editor, studio-api and the AI agent
  live elsewhere and read this theme through `theme.manifest.json`, `groups/`,
  `templates/` and the `defineSection` schemas. If a change here alters one of
  those shapes, it is a contract change: regenerate the manifest, run
  `pnpm verify`, and say so — do not assume the other side adapts.
