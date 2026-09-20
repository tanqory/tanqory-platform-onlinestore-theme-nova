#!/usr/bin/env node
/**
 * Design coverage ratchet.
 *
 * The approved design package has FOUR configuration levels. An earlier version
 * of this script checked one of them — `design/spec/sections.json`, the Level 4
 * per-section props — and reported a clean 165/165 while 25 global props and 11
 * shared section props went unexamined. Eleven of the globals had already
 * drifted, three onto a different concept entirely, and the shared props were
 * declared on 0–6 of 62 sections. A green ratchet over a third of the surface
 * reads exactly like a green ratchet over all of it, which is the failure mode
 * this rewrite removes.
 *
 * Checked here:
 *   Level 1  global theme props   design/spec/global.json   vs settingsSchema
 *   Level 3  shared section props design/spec/shared.json   vs every section
 *   Level 4  per-section props    design/spec/sections.json vs its section
 *
 * Level 2 (component props) is deliberately not ratcheted: those are internal
 * component API, not merchant-facing settings, so the manifest is the wrong
 * thing to measure them against.
 *
 * Modelled on store-api's `check-rbac-coverage.mjs`: the baseline may only ever
 * shrink.
 *
 *   node scripts/check-design-coverage.mjs            # check
 *   node scripts/check-design-coverage.mjs --update   # record a new (smaller) baseline
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const load = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'))

const spec = load('design/spec/sections.json')
const globalSpec = load('design/spec/global.json')
const sharedSpec = load('design/spec/shared.json')
const manifest = load('theme.manifest.json')
const BASELINE = join(ROOT, 'design', 'spec', 'coverage-baseline.json')

const have = new Map((manifest.sections ?? manifest).map((s) => [s.name, s]))

/** settingsSchema is grouped; flatten to key → entry. */
const settings = new Map()
for (const group of manifest.settingsSchema ?? []) {
  for (const item of group.items ?? []) settings.set(item.key, item)
}

/**
 * The design writes an option list as prose: `small 24 | medium 32 | large 40`,
 * `standard 1200 | wide 1440`. The VALUE is the first token; the rest is the
 * measurement it stands for.
 */
const designOptions = (s) =>
  (s ?? '')
    .split('|')
    .map((o) => o.trim().split(/\s+/)[0]?.toLowerCase())
    .filter(Boolean)

const themeOptions = (item) =>
  (item.options ?? []).map((o) => String(o.value ?? o).toLowerCase()).filter(Boolean)

/** Design defaults are sometimes prose (`wide (commerce) / standard (content)`). */
const comparableDefault = (def) => {
  const d = (def ?? '').trim()
  if (!d || d === '—' || d.includes('(') || d.includes('/')) return null
  if (d === 'on') return true
  if (d === 'off') return false
  return d.toLowerCase()
}

const missing = {}
const add = (bucket, item) => {
  ;(missing[bucket] ??= []).push(item)
}

// ── Level 4: per-section props ───────────────────────────────────────────────
for (const s of spec) {
  const nova = have.get(s.name)
  const declared = new Set(Object.keys(nova?.attributes ?? {}))
  const gaps = s.props.map((p) => p.name).filter((p) => !declared.has(p))
  if (!nova) gaps.unshift('(section missing)')
  if (gaps.length) missing[s.name] = gaps
}

/** Global settings whose default is carried by a design token rather than the setting. */
const TOKEN_BACKED = {
  colorPrimary: '--color-brand',
  colorBackground: '--color-bg',
  colorText: '--color-fg',
  colorSecondarySurface: '--color-bg-muted',
  colorBorder: '--color-border',
  colorSale: '--color-sale',
  headingFont: '--font-display',
  bodyFont: '--font-body',
}
/** Declarations of the FIRST `:root { … }` block in tokens.css — the light-scheme defaults. */
const rootTokens = (() => {
  const css = readFileSync(join(ROOT, 'assets', 'tokens.css'), 'utf8')
  const block = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
  return new Map([...block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)].map((m) => [m[1], m[2].trim()]))
})()

// ── Level 1: global theme props ──────────────────────────────────────────────
for (const g of globalSpec) {
  const item = settings.get(g.name)
  if (!item) {
    add('(global) missing', g.name)
    continue
  }
  const want = designOptions(g.options)
  const got = themeOptions(item)
  // A control with no enumerated options in the design (text, toggle, colour,
  // font picker) has nothing to compare.
  if (want.length > 1 && got.length) {
    const absent = want.filter((o) => !got.includes(o))
    const extra = got.filter((o) => !want.includes(o))
    if (absent.length) add('(global) options missing', `${g.name}: ${absent.join(', ')}`)
    if (extra.length) add('(global) options not in design', `${g.name}: ${extra.join(', ')}`)
  }
  const wantDef = comparableDefault(g.def)
  if (wantDef !== null) {
    const gotDef = typeof item.default === 'string' ? item.default.toLowerCase() : item.default
    // A colour or font setting defaults to '' — "not set" — so the store's
    // Settings → Brand and the automatic dark scheme keep working. What a
    // shopper then sees is the TOKEN, so the design's default is checked
    // where it actually lives: assets/tokens.css.
    const token = TOKEN_BACKED[g.name]
    if (gotDef === '' && token) {
      const tokenValue = (rootTokens.get(token) ?? '').toLowerCase()
      if (!tokenValue.includes(String(wantDef))) {
        add('(global) default differs', `${g.name}: token ${token} is "${tokenValue}" ≠ ${wantDef}`)
      }
    } else if (gotDef !== wantDef) {
      add('(global) default differs', `${g.name}: ${gotDef} ≠ ${wantDef}`)
    }
  }
}

// ── Level 3: shared section props ────────────────────────────────────────────
// "Every section exposes these (unless marked n/a in 05)" — 06 Configuration
// System. Measured against the sections the design actually names, not all 62
// manifest entries, so blocks are not held to a section-level contract.
for (const p of sharedSpec) {
  for (const s of spec) {
    if (!Object.keys(have.get(s.name)?.attributes ?? {}).includes(p.name)) {
      add(`(shared) ${p.name}`, s.name)
    }
  }
}

const total = Object.values(missing).reduce((a, v) => a + v.length, 0)

if (process.argv.includes('--update')) {
  writeFileSync(BASELINE, `${JSON.stringify({ total, missing }, null, 2)}\n`)
  console.log(`✓ baseline recorded: ${total} gap(s) across ${Object.keys(missing).length} bucket(s)`)
  process.exit(0)
}

if (!existsSync(BASELINE)) {
  console.error('✗ no baseline — run with --update once to record the starting point')
  process.exit(1)
}
const base = JSON.parse(readFileSync(BASELINE, 'utf8'))

if (total > base.total) {
  console.error(`✗ design coverage went BACKWARDS: ${base.total} → ${total} gaps`)
  for (const [name, gaps] of Object.entries(missing)) {
    const was = base.missing[name] ?? []
    const added = gaps.filter((g) => !was.includes(g))
    if (added.length) console.error(`  ${name}: newly missing ${added.join(' · ')}`)
  }
  process.exit(1)
}

const props = spec.reduce((a, s) => a + s.props.length, 0)
console.log(
  `✓ design coverage — ${props} section props, ${globalSpec.length} global, ` +
    `${sharedSpec.length} shared · ${total} gap(s)` +
    (total < base.total ? ` — improved by ${base.total - total}, run --update to lock it in` : ''),
)
