#!/usr/bin/env node
/**
 * Regenerates the design spec files from the approved design package.
 *
 * `design/*.dc.html` carries its data in a `<script type="text/x-dc">` block —
 * a `class Component extends DCLogic` whose `renderVals()` returns the tables
 * the design renders. Executing that is the only faithful way to read them;
 * scraping the markup reads the TEMPLATE, not the values.
 *
 * Three specs come out, matching the design's own four levels:
 *   design/spec/sections.json  Level 4 — per-section props   (05 Handoff Notes)
 *   design/spec/global.json    Level 1 — global theme props  (06 Configuration)
 *   design/spec/shared.json    Level 3 — shared section props(06 Configuration)
 *
 * Level 2 (component props) is extracted too, for reference, but is not
 * ratcheted: component props are internal API, not merchant-facing settings.
 *
 *   node scripts/extract-design-spec.mjs          # verify committed files match
 *   node scripts/extract-design-spec.mjs --write  # rewrite them
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const WRITE = process.argv.includes('--write')

/** Execute a `.dc.html`'s logic block and return `renderVals()`. */
function renderVals(file) {
  const src = readFileSync(join(ROOT, file), 'utf8')
  const m = src.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)
  if (!m) throw new Error(`${file}: no x-dc logic block`)
  class DCLogic {}
  return new Function('DCLogic', `${m[1]}; return new Component().renderVals()`)(DCLogic)
}

const DESIGN = '05 Handoff Notes.dc.html'
const CONFIG = '06 Configuration System.dc.html'

if (!existsSync(join(ROOT, 'design', DESIGN))) {
  console.error('✗ design/ is not present — it is the source of truth for these specs.')
  console.error('  It used to be gitignored; if this fires, restore it from the design package.')
  process.exit(1)
}

// --- Level 4: sections -------------------------------------------------------
const sections = renderVals(`design/${DESIGN}`).sections.map((s) => ({
  name: s.name,
  group: s.group,
  purpose: s.purpose,
  components: s.components,
  slots: s.slots,
  responsive: s.responsive,
  edge: s.edge,
  // The design's `P()` helper writes an em dash for "no dependency"; the spec
  // files have always stored that as an empty string.
  props: s.props.map((p) => ({ ...p, dep: p.dep === '—' ? '' : p.dep })),
}))

// --- Levels 1 and 3: global + shared -----------------------------------------
const cfg = renderVals(`design/${CONFIG}`)
const table = (id) => {
  const t = cfg.tables.find((x) => x.id === id)
  if (!t) throw new Error(`${CONFIG}: no table "${id}"`)
  return t.rows.map((r) => ({ ...r, dep: r.dep === '—' ? '' : r.dep }))
}

const global = table('global')

// `heading / eyebrow / description` is one row describing three separate
// SectionHeader slots. Split it so each can be checked on its own.
const shared = table('shared-section').flatMap((r) =>
  r.name.includes(' / ')
    ? r.name.split(' / ').map((n) => ({ ...r, name: n.trim() }))
    : [r],
)

const OUT = [
  ['design/spec/sections.json', sections],
  ['design/spec/global.json', global],
  ['design/spec/shared.json', shared],
]

let drift = 0
for (const [name, data] of OUT) {
  const next = `${JSON.stringify(data, null, 1)}\n`
  const path = join(ROOT, name)
  const prev = existsSync(path) ? readFileSync(path, 'utf8') : null
  if (WRITE) {
    writeFileSync(path, next)
    console.log(`✓ wrote ${name} (${data.length} entries)`)
  } else if (prev !== next) {
    console.error(`✗ ${name} does not match the design package — run --write`)
    drift += 1
  }
}

if (!WRITE) {
  if (drift) process.exit(1)
  console.log(
    `✓ specs match the design package — ${sections.length} sections / ` +
      `${sections.reduce((a, s) => a + s.props.length, 0)} props, ` +
      `${global.length} global, ${shared.length} shared`,
  )
}
