---
name: theme-section
description: Building or changing an editor section or block in the Nova theme — defineSection, the AttrSpec vocabulary, the placement contract (role, area, requiresContext), shared header/footer groups and template bindings, shared props, presets, allowedBlocks, and renaming a setting without orphaning merchant content. Load this before adding or editing anything in sections/, groups/ or templates/.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Sections and blocks

A section is a React component plus a schema. The schema is a promise to the
merchant: every control it declares must change something. `pnpm check:inert`
turns that promise into a gate, and three controls still shipped dead behind an
earlier version of it — so the patterns below are not style preferences.

The always-loaded invariants are in `.claude/rules/theme-standards.md`.

## The shape

```tsx
import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

export function Marquee({ attributes, children }: SectionProps): JSX.Element {
  const speed = (attributes.speed as string) ?? 'standard'
  return (
    <section {...sharedRootProps(attributes)} className="section" data-speed={speed}>
      {children}
    </section>
  )
}

export default defineSection({
  name: 'marquee',        // kebab-case, the id templates reference
  role: 'section',        // 'layout' | 'section' | 'block' — the placement contract
  title: 'Marquee',       // editor label
  category: 'layout',     // picker grouping ONLY — never a placement rule
  icon: 'arrow-right',
  attributes: withShared({
    speed: {
      type: 'select',
      default: 'standard',
      label: 'Speed',
      group: 'Appearance',
      options: [
        { value: 'slow', label: 'Slow' },
        { value: 'standard', label: 'Standard' },
      ],
    },
  }),
  allowedBlocks: ['text'],
  presets: [{ name: 'Marquee', settings: {}, blocks: [] }],
  component: Marquee,
})
```

**Section vs block**: identical declaration, different `role`. A block is a
unit with `role: 'block'` that a parent lists in `allowedBlocks` (`slide` inside
`slideshow`, `faq-item` inside `faq`). Do not invent a separate mechanism, and
do not move files into a `blocks/` folder — the role is the distinction.

## The placement contract

Every `defineSection` declares where the unit may go. The editor's picker, the
save validator in studio-api and the AI agent all read these same three keys
(through `theme.manifest.json`), so a wrong value is not cosmetic: it decides
what a merchant can insert and what a save refuses.

| Key | Values | Meaning |
|---|---|---|
| `role` | `'layout'` | site chrome (`header`, `announcement-bar`, `footer`). Lives in a header/footer slot, never nested |
| | `'section'` | a top-level page unit |
| | `'block'` | only inside a parent that lists it in `allowedBlocks`; never at the top level |
| `area` | `'header'` \| `'footer'` | for `role: 'layout'` — which slot it belongs to |
| `requiresContext` | `['product']`, `['collection']`, `['article']`, `['blog']`, `['page']`, `['cart']`, `['search']` | the route data the unit cannot render without |

```tsx
// sections/Header.tsx
role: 'layout', area: 'header',
// sections/ProductDetails.tsx
role: 'section', requiresContext: ['product'],
// sections/AddToCart.tsx — a block that also needs the product
role: 'block', requiresContext: ['product'],
```

### ❌ Using `category` to mean placement

```tsx
category: 'block',          // a picker label. The validator ignores it.
```

`category: 'commerce'` on `product-details` never stopped anyone placing it on
the cart page. `requiresContext: ['product']` does: the picker hides it there
and a save that contains it is refused with `missing_context`.

### ❌ Forgetting `requiresContext` on a unit that calls `useProduct()`

A section that reads the current product, collection or article and does not
declare it renders an empty state on every other template — and the editor
happily offers it there. If the component reads route data, declare it.

`block` parents are derived, not declared: the manifest computes a block's
`placement.parents` from every section whose `allowedBlocks` names it. Add the
block to the parent's `allowedBlocks`; never hand-write a parents list.

## Shared header and footer — `groups/`

The header and footer exist **once**:

```
groups/header.json      { "type": "header", "sections": [ { "type": "header", "id": "header", "settings": {} } ] }
groups/footer.json      { "type": "footer", "sections": [ … ] }
templates/product.json  { "contentVersion": 2, "groups": { "header": "header", "footer": "footer" }, "sections": [ … ] }
```

A template's slot is a group name, or an explicit page-only copy:

```json
"groups": { "header": { "override": [ { "type": "announcement-bar", … }, { "type": "header", … } ] }, "footer": "footer" }
```

Only `index` overrides (it carries the announcement bar); every other template binds both groups. Rules:

- **Changing the site header → edit `groups/header.json`.** That reaches every
  template that binds it (`theme.manifest.json` → `groups[].usedBy`). Editing
  one template's copy is only right when that page must differ.
- **Never paste header/footer nodes into a template's `sections`.** A new
  template binds the groups: `"groups": { "header": "header", "footer": "footer" }`.
- **Never flatten a template by hand.** `resolvePageSections(template, GROUPS)`
  from the kit is the only resolver — `layouts/layout.tsx`, `main.tsx` and
  `entry-server.tsx` call it; so do studio-api, the editor and the AI.
- **Node `id`s are stable identifiers.** The editor and the AI address nodes by
  id across saves. Do not renumber or regenerate ids when editing JSON.
- A template that references a group file that does not exist renders without
  its chrome. `node scripts/migrate-groups.mjs --check` and the manifest gate
  both fail on it.

### ❌ Making one page different by editing the shared group

```jsonc
// groups/header.json — now EVERY page has the sale bar
{ "type": "announcement-bar", "id": "sale", "settings": { "text": "Sale" } }
```

### ✅ An explicit override on that template

```jsonc
// templates/page.sale.json
"groups": { "header": { "override": [ { "type": "announcement-bar", "id": "ab_sale", … }, { "type": "header", "id": "header_sale", … } ] }, "footer": "footer" }
```

## The settings vocabulary

`AttrSpec.type` is closed — 20 ids, no others:

```
text · textarea · richtext · html · url · number · range · boolean
select · radio · color · text_alignment · image · video
collection · product · page · blog · article · menu
```

`group` (the editor panel groups by it) and `dynamic` (bindable to a data
source) are part of the kit's published `AttrSpec`. `options` are always
`{ value, label }` objects.

A design control with no matching id — font picker, multi-select, resource
list, 9-grid position picker, stepper — **degrades to the nearest id and gets an
entry in `docs/DESIGN-GAPS.md`**. Do not approximate it with a control that
cannot carry the information.

### ❌ A control with one option

```ts
// sections/StoreLocator.tsx — removed 2026-09-20
layout: {
  type: 'select',
  default: 'list',
  label: 'Layout',
  options: [{ value: 'list', label: 'List' }],   // `list+map` needs data we do not have
},
```

It read nowhere, so the merchant saw a dropdown that could not change anything.
✅ Do not declare it; record the gap (`docs/DESIGN-GAPS.md` F17) and let it
return when the data layer can support it.

### ❌ A control the section never reads

```ts
// sections/Header.tsx declared this…
logoHeight: { type: 'select', default: 'medium', options: [ /* 24 / 32 / 40 */ ] },
```
```css
/* …while assets/styles.css hard-coded a fourth value */
.site-header__logo { height: 30px; }
```

Two templates had already persisted `"logoHeight": "medium"`. ✅ The fix reads
it and maps it onto a token — `layouts/layout.tsx:665` and the
`.site-header[data-logo-height]` rules.

## Wiring a setting to CSS

**One CSS value → a custom property.** The `data-*` attribute selects a rung;
the property carries it.

```tsx
<section className="section" data-logo-height={logoHeight}>
```
```css
.site-header[data-logo-height='small'] { --logo-height-header: 24px; }
.site-header__logo { height: var(--logo-height-header); }
```

**Several CSS values → a `data-*` attribute the CSS branches on.** Nova uses
data attributes rather than class concatenation so the chosen value stays
readable in the DOM and in the editor.

```css
.section[data-content-align='center'] { text-align: center; }
.section[data-content-align='center'] .section-head { align-items: center; }
```

❌ Never let a setting introduce a value the token ladder does not have. A
`range` that writes `border-radius: 19px` breaks the system that
`lib/theme-settings.ts` exists to protect.

## Shared props

`06 Configuration System` says every section exposes eleven shared props —
spacing, width, alignment, background, header size, mobile alignment, hide on
mobile, anchor. `withShared()` merges them; `sharedRootProps(attributes)` turns
them into root attributes the CSS in `assets/styles.css` consumes.

```tsx
<section {...sharedRootProps(attributes)} className="section">
```

Spread it **first** so a section's own explicit attribute wins — `05 Handoff
Notes` restates a shared prop exactly when the section's default differs, and
that restatement is the authority.

Two deliberate exclusions:

- **Chrome and full-bleed sections** (`header`, `footer`, `announcement-bar`,
  `divider`, `marquee`) take none of them. `06` allows this — "unless marked n/a
  in 05" — and their `05` entries specify their own fixed heights.
- **`heading` / `eyebrow` / `description`** are opt-in, declared only by a
  section that renders a `SectionHead`. Blanket-adding them would create inert
  settings, trading one broken promise for another.

## What `check:inert` can and cannot see

It resolves `name:` → the declaring file, then walks that file's transitive
local imports. Inside the declaring file it wants a real access; in an imported
file a name match is enough, because a component legitimately renames what it
receives.

Patterns it understands:

```tsx
attributes.speed            // direct
attributes?.speed
attributes['speed']
const a = attributes        // sections/Hero.tsx:11 — alias, then a.backgroundImage
attributes[`text${n}`]      // sections/AnnouncementBar.tsx:20 — prefix-matched
```

❌ What it will NOT accept, and should not:

```tsx
// declared `description`, but reads `subheading` and passes it as a JSX prop
const subheading = attributes.subheading as string | undefined
<SectionHead description={subheading} />
```

The word `description` appears in the file, so a looser matcher passed this on
five sections at once. ✅ Read the design's own key with the old one as a
fallback — `sections/ProductGrid.tsx:23`:

```tsx
const subheading =
  (attributes.description as string | undefined) ??
  (attributes.subheading as string | undefined)
```

## Renaming a setting

A rename orphans every saved value under the old key — the theme's templates
AND every merchant's customised copy. `k8s.mjs` merges theme updates by path
prefix with no content version, so nothing else carries them across.

Add it to `scripts/migrate-content.mjs`:

- `RENAMES` — the key changed (`intervalMs` → `interval`, with a transform).
- `VALUE_RENAMES` — the key is the same but its vocabulary changed
  (`badgeStyle: square` → `filled`).

Both tables are append-only so they stay replayable. The value rename is the
quieter hazard: a value that is no longer in the select falls back to the
default with **no warning**, so a merchant who chose "Bold" icons silently lands
on the theme default.

## Starter content

`presets` and `templates/*.json` reach a live store the moment the section is
placed.

- **Only `all` is a safe collection handle.** A handle in `lib/collections.json`
  is an offline fixture — `new-arrivals` exists there and not on a real shop,
  which renders an empty row exactly as a dev store's handle did.
- **Never state a policy on the merchant's behalf.** "Free shipping", "30-day
  returns", "100% organic cotton" were removed from templates once and came back
  in section defaults and presets. `tests/theme-integrity.test.ts` now checks
  templates, manifest defaults and section source.

## Finishing

```bash
pnpm manifest        # regenerate theme.manifest.json + the README catalog
pnpm verify          # typecheck · manifest · spec · inert · design · headings · test · build
```

A new section usually needs a template entry to be reachable, and
`pnpm check:headings` requires exactly one section per template to carry the
page heading.

`pnpm manifest` is not optional after a schema change: studio-api trusts a
manifest entry only while its `sourceHash` matches the `.tsx`. A stale manifest
does not break the editor — it falls back to reading the source — but it is
reported as stale, and `pnpm manifest:check` fails CI.
