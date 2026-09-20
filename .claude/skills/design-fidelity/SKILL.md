---
name: design-fidelity
description: Working against the approved design package in design/ — reading .dc.html files, the four-level configuration API, the coverage ratchet, and when to record a gap instead of faking a control. Load this before changing tokens, global theme settings, or anything the design specifies.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Design fidelity

`design/` is the approved package and the source of truth. Everything derived
from it is generated. The job is to keep the theme and the package in agreement
— or, where they cannot agree, to make the disagreement explicit and checked.

The always-loaded invariants are in `.claude/rules/theme-standards.md`.

## Reading a `.dc.html` file

Each file carries its data in a `<script type="text/x-dc">` block holding a
`class Component extends DCLogic` whose `renderVals()` returns the tables the
page renders. **Executing that is the only faithful way to read it.** Scraping
the markup reads the template, not the values.

```js
const src = readFileSync('design/01 Style System.dc.html', 'utf8')
const m = src.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)
class DCLogic {}
const vals = new Function('DCLogic', `${m[1]}; return new Component().renderVals()`)(DCLogic)
// → { colors, type, space, containers, sectionSpacing, radii, borders, shadows, motion, … }
```

`scripts/extract-design-spec.mjs` already does this for `05` and `06`. Use it,
or copy its approach — do not re-derive design values from memory or from the
rendered page.

## The four levels

| Level | What | Source | Spec file | Ratcheted |
|---|---|---|---|---|
| 1 | 25 global theme props | `06 Configuration System` | `design/spec/global.json` | yes |
| 2 | 48 component props | `06 Configuration System` | — | no (internal API) |
| 3 | 11 shared section props (13 entries) | `06 Configuration System` | `design/spec/shared.json` | yes |
| 4 | 165 per-section props | `05 Handoff Notes` | `design/spec/sections.json` | yes |

`05` states the split in its own markup: *"Shared props (sectionWidth,
spacingTop/Bottom, background, headerAlignment) are defined once in 06
Configuration System and not repeated here unless the default differs."*

**That sentence is why an earlier ratchet reported a clean 165/165 while 11 of
the 25 global props had drifted and the shared props were declared on almost no
section.** A spec file that covers one level reads exactly like one that covers
all four.

## The workflow

```bash
node scripts/extract-design-spec.mjs --write   # regenerate the spec files
pnpm check:spec                                # fail if they drift from design/
pnpm check:design                              # the shrink-only coverage ratchet
node scripts/check-design-coverage.mjs --update  # record a NEW, SMALLER baseline
```

- **Never hand-edit `design/spec/*.json`.** It is generated; `check:spec`
  re-runs the extraction and diffs.
- **The baseline may only shrink.** `--update` is a reviewed act. If the total
  grew, something regressed — find it rather than re-recording.
- `check:design` compares **option lists and defaults**, not just names. A
  name-only check is what let `badgeStyle` sit on a completely different axis
  from the design for months.

## Drift is not always a typo

Three of the eleven drifted global props were on a **different concept**, not a
different default:

| Prop | Design | What shipped |
|---|---|---|
| `badgeStyle` | `filled \| outline` — a fill | `square \| pill` — a shape |
| `iconStyle` | `outline \| filled` — a family | `light \| regular \| bold` — a weight |
| `cardHoverEffect` | `none \| image-swap \| zoom \| subtle-lift` | `none \| zoom \| border` — two dropped, one invented |

When the axis differs, aligning it is a **value migration**, not an edit: add it
to `VALUE_RENAMES` in `scripts/migrate-content.mjs` so a merchant who picked
"Bold" does not silently land on the default.

## Tokens

`assets/tokens.css` is the design system; `assets/styles.css` consumes it.

- **No raw hex, no magic numbers in `styles.css`.** The design's own principle
  is *"semantic, never raw"*. If a value has no token, add the token.
- **A token nothing reads is a bug in one of two directions** — either the rule
  that should consume it is missing, or the token should not exist.
  `--icon-stroke` was written by `lib/theme-settings.ts` and read by nothing
  while `Icon.tsx` hard-coded `1.6`, so the `iconStyle` setting did nothing at
  all.
- `lib/theme-settings.ts` is the single place a semantic merchant choice becomes
  a token. Adding a mapping anywhere else forks the system.

Quick audit:

```bash
node -e "
const fs=require('fs');
const defined=[...fs.readFileSync('assets/tokens.css','utf8').matchAll(/^\s*(--[a-z0-9-]+)\s*:/gmi)].map(m=>m[1]);
const all=['assets/styles.css','assets/tokens.css'].map(f=>fs.readFileSync(f,'utf8')).join('\n')
  + require('child_process').execSync('cat components/*.tsx sections/*.tsx layouts/*.tsx lib/*.ts').toString();
console.log([...new Set(defined)].filter(t=>!new RegExp('var\\\\('+t+'[,)]').test(all)));
"
```

## When you cannot deliver a design rule

**Record it — do not fake it, and do not silently drop it.**
`docs/DESIGN-GAPS.md` is the register, organised as:

- **Data-layer gaps (F-numbers)** — the storefront cannot supply it. The
  storefront ignores `sortKey`/`reverse` on a collection query, returns no facet
  list, gives `locations()` no coordinates, and `productRecommendations` takes
  no intent. Each entry says what ships instead.
- **Editor / field-type gaps** — the design control has no `AttrSpec` id.
- **Deliberate deviations (G-numbers)** — a choice, with the reason.

Two rules for an entry:

1. State what the design asks for, why it cannot be delivered, and **what ships
   instead**. A section degrades to the nearest honest behaviour.
2. If it stays a live gap in the ratchet, it cannot grow unnoticed.

### The one inversion worth knowing

`--color-fg-muted` and `--color-fg-subtle` are **deliberately darker than the
design** (`#55524e` / `#736f68` vs `#5C5955` / `#8A867F`). The design's values
measure 3.53:1 and 3.27:1 against the page and footer surfaces — they fail WCAG
AA for the body-size text that uses them. Reverting them to match the package
reintroduces QA finding P1-3. This is `docs/DESIGN-GAPS.md` **G7**.

## Verifying the rendered page

Coverage says a prop exists. It says nothing about what the page looks like.

```bash
pnpm dev &
pnpm verify:live                 # a11y + layout gates
python3 qa/fidelity/check.py     # measures bar heights, column counts, ratios
```

`qa/fidelity/check.py` extracts every rule from `05 Handoff Notes` that can be
measured and checks the rendered page against it, scoped by
`data-tq-section-type`. It needs python playwright in a venv; `qa/` is
gitignored.

It also catches what coverage cannot: a `featured-collection` reporting
`[3, 3, 2]` against the design's `4 → 3 → 2` was a starter-content handle that
did not exist on the live store, not a CSS bug.
