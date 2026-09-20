#!/usr/bin/env node
/**
 * Move the per-template header/footer copies into shared groups.
 *
 *   node scripts/migrate-groups.mjs            # migrate, print the report
 *   node scripts/migrate-groups.mjs --check    # exit 1 if a run would change anything
 *   node scripts/migrate-groups.mjs --dry      # report only, write nothing
 *   node scripts/migrate-groups.mjs --inline   # ROLLBACK: fold the groups back into every template
 *
 * Before: 17 of 18 templates carried their own copy of the header and footer,
 * so "edit the header" meant editing one page. After: `groups/header.json` and
 * `groups/footer.json` are the single source of truth, templates reference
 * them, and a page that is deliberately different keeps its own copy as an
 * explicit `override` — printed here, never merged away.
 *
 * The logic is the kit contract's `extractGroups`, which the studio-api
 * migration path calls too. This file only reads the theme, feeds the section
 * defaults (so `{}` and `{ sticky: 'always' }` compare equal), writes what
 * comes back, and prints the report. Idempotent: `--check` on a migrated theme
 * passes, which is what CI runs.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractGroups, resolvePage } from '@tanqory/theme-kit/contract'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATES = join(ROOT, 'templates')
const GROUPS = join(ROOT, 'groups')
const CHECK = process.argv.includes('--check')
const DRY = process.argv.includes('--dry')
const INLINE = process.argv.includes('--inline')

const read = (p) => JSON.parse(readFileSync(p, 'utf8'))
const stringify = (o) => JSON.stringify(o, null, 2) + '\n'

// Attribute defaults per section type, from the generated manifest — the same
// source the runtime applies at render, so the comparison is what a shopper sees.
const manifest = read(join(ROOT, 'theme.manifest.json'))
const defaults = {}
for (const s of manifest.sections) {
  defaults[s.name] = {}
  for (const [k, spec] of Object.entries(s.attributes ?? {})) {
    if (spec?.default !== undefined) defaults[s.name][k] = spec.default
  }
}

const templates = {}
for (const f of readdirSync(TEMPLATES).filter((x) => x.endsWith('.json')).sort()) {
  templates[f.replace(/\.json$/, '')] = read(join(TEMPLATES, f))
}

// ── rollback: groups → inline copies (content version 1) ──────────────────
// The exact inverse of the migration, through the same resolver the runtime
// uses: every template gets the header/footer it currently RENDERS written
// back as inline `area` nodes, the `groups` binding and `contentVersion` are
// dropped, and groups/ is left in place (harmless to a v1 reader; delete it
// by hand once nothing references it). Running the migration again afterwards
// reproduces the bindings, so this is a round trip, not a one-way door.
if (INLINE) {
  const groupDocs = {}
  if (existsSync(GROUPS)) {
    for (const f of readdirSync(GROUPS).filter((x) => x.endsWith('.json'))) groupDocs[f.replace(/\.json$/, '')] = read(join(GROUPS, f))
  }
  let n = 0
  for (const [slug, doc] of Object.entries(templates)) {
    if (!doc.groups && doc.contentVersion === undefined) continue
    const r = resolvePage(doc, groupDocs)
    if (r.missingGroups.length) { console.error(`✗ ${slug}: binds missing group(s) ${r.missingGroups.join(', ')} — nothing written`); process.exit(1) }
    const { groups: _g, contentVersion: _v, ...rest } = doc
    const inlined = { ...rest, sections: r.sections.map(({ area, ...node }) => (area && area !== 'template' ? { ...node, area } : node)) }
    if (DRY) { console.log(`would inline ${slug} (${r.sections.length} sections)`); continue }
    writeFileSync(join(TEMPLATES, `${slug}.json`), stringify(inlined))
    n++
  }
  console.log(DRY ? '(dry run — nothing written)' : `✓ folded the shared groups back into ${n} template(s); groups/ left in place`)
  process.exit(0)
}

const { groups, templates: next, report, noop } = extractGroups(templates, { defaults })

// ── report ────────────────────────────────────────────────────────────────
for (const r of report) {
  console.log(`\n${r.slot.toUpperCase()} → groups/${r.group}.json`)
  if (r.alreadyBound.length) console.log(`  already bound (${r.alreadyBound.length}): ${r.alreadyBound.join(', ')}`)
  if (r.canonical.templates.length) console.log(`  shared by (${r.canonical.templates.length}): ${r.canonical.templates.join(', ')}`)
  for (const o of r.overrides) {
    console.log(`  ⚠ ${o.template} DIFFERS — kept as an explicit override:`)
    for (const d of o.differences) console.log(`      ${d}`)
  }
  for (const m of r.idRemaps) console.log(`  ↻ ${m.template}: id ${m.from} → ${m.to} (same content, takes the group's id)`)
  if (r.empty.length) console.log(`  ∅ no ${r.slot} at all: ${r.empty.join(', ')}`)
}

if (CHECK) {
  // A bound template whose group file is missing renders without its chrome.
  // `extractGroups` has nothing to migrate in that state, so check it here.
  const dangling = []
  for (const [slug, doc] of Object.entries(templates)) {
    for (const [slot, v] of Object.entries(doc.groups ?? {})) {
      const name = typeof v === 'string' ? v : v && typeof v === 'object' && 'ref' in v ? v.ref : null
      if (name && !existsSync(join(GROUPS, `${name}.json`))) dangling.push(`${slug}.${slot} → groups/${name}.json`)
    }
  }
  if (dangling.length) {
    console.error(`\n✗ template(s) bind a group that does not exist:\n  ${dangling.join('\n  ')}`)
    process.exit(1)
  }
  if (noop) {
    console.log('\n✓ groups are up to date — a migration run would change nothing')
    process.exit(0)
  }
  console.error('\n✗ templates still carry inline header/footer copies. Run `node scripts/migrate-groups.mjs`.')
  process.exit(1)
}

if (noop) {
  console.log('\n✓ nothing to migrate')
  process.exit(0)
}
if (DRY) {
  console.log('\n(dry run — nothing written)')
  process.exit(0)
}

// ── write ─────────────────────────────────────────────────────────────────
mkdirSync(GROUPS, { recursive: true })
for (const g of Object.values(groups)) {
  const file = join(GROUPS, `${g.name}.json`)
  if (existsSync(file)) {
    // A re-run with a new canonical would overwrite a group somebody edited.
    // extractGroups only produces a group when inline copies still exist, so
    // reaching here means a template was un-migrated by hand; refuse rather
    // than clobber.
    console.error(`✗ ${file} already exists — will not overwrite a shared group. Bind the template by hand.`)
    process.exit(1)
  }
  writeFileSync(file, stringify({ type: g.doc.type, name: g.name[0].toUpperCase() + g.name.slice(1), sections: g.doc.sections }))
  console.log(`\n✓ wrote groups/${g.name}.json`)
}
let rewritten = 0
for (const [slug, doc] of Object.entries(next)) {
  const before = stringify(templates[slug])
  const after = stringify({ contentVersion: 2, ...doc })
  if (before === after) continue
  writeFileSync(join(TEMPLATES, `${slug}.json`), after)
  rewritten++
}
console.log(`✓ rewrote ${rewritten} template(s)`)
