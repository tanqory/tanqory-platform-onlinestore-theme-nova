/**
 * Emit theme.manifest.json — the single machine-readable catalog of this theme,
 * read by the editor inserter, the AI theme generator (ai-api), and the Phase 1
 * dashboard↔surface conformance test.
 *
 * It loads `manifest-entry.ts` through a Vite SSR server rather than plain Node
 * so `import.meta.glob` resolves against the exact `sections/*.tsx` +
 * `templates/*.json` the app registers — the manifest is generated from the
 * same source of truth it describes, so it cannot drift.
 *
 *   node scripts/gen-manifest.mjs [--check]
 *
 * --check regenerates in memory and fails (exit 1) if the committed
 * theme.manifest.json is stale — for CI, so a new/edited section without a
 * regenerated manifest is caught in review.
 */
import { createServer } from 'vite'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const outFile = join(root, 'theme.manifest.json')
const readmeFile = join(root, 'README.md')
const check = process.argv.includes('--check')

const CATALOG_START = '<!-- BEGIN GENERATED CATALOG -->'
const CATALOG_END = '<!-- END GENERATED CATALOG -->'

/** Render the human-readable catalog block spliced into README.md — a view of
 *  the same manifest, so the docs can't drift from what the theme ships. */
function renderCatalog(m) {
  const byCat = {}
  for (const s of m.sections) (byCat[s.category] ??= []).push(s.name)
  const lines = []
  lines.push(`**${m.stats.sections} sections · ${m.stats.templates} templates · ${m.stats.settings} settings**`)
  lines.push('')
  lines.push('### Sections by category')
  for (const cat of Object.keys(byCat).sort()) {
    lines.push(`- **${cat}** (${byCat[cat].length}): ${byCat[cat].sort().join(', ')}`)
  }
  lines.push('')
  lines.push('### Shared groups')
  for (const g of m.groups ?? []) {
    lines.push(`- **${g.name}** (${g.type}): ${g.sectionTypes.join(', ')} — used by ${g.usedBy.length} template(s)`)
  }
  lines.push('')
  lines.push('### Templates')
  lines.push('| template | header | footer | sections |')
  lines.push('| --- | --- | --- | --- |')
  const slot = (s) => (s.mode === 'ref' ? `↗ ${s.group}` : s.mode)
  for (const t of m.templates)
    lines.push(`| \`${t.name}\` | ${slot(t.groups.header)} | ${slot(t.groups.footer)} | ${t.sectionTypes.join(', ') || '—'} |`)
  lines.push('')
  lines.push('### Theme settings')
  for (const g of m.settingsSchema) {
    lines.push(`- **${g.group}**: ${g.items.map((i) => i.key).join(', ')}`)
  }
  return lines.join('\n')
}

/** Splice a freshly-rendered catalog between the markers. Returns the new
 *  README text, or throws if the markers are missing. */
function spliceReadme(current, catalog) {
  const a = current.indexOf(CATALOG_START)
  const b = current.indexOf(CATALOG_END)
  if (a === -1 || b === -1 || b < a) {
    throw new Error(`README.md is missing the ${CATALOG_START} / ${CATALOG_END} markers`)
  }
  return current.slice(0, a + CATALOG_START.length) + '\n' + catalog + '\n' + current.slice(b)
}

/** Print every integrity warning the manifest carries. */
function reportWarnings(w, log) {
  for (const d of w.danglingTemplateRefs) log(`⚠ template ${d.template} → unknown section ${d.type}`)
  for (const d of w.danglingGroupRefs ?? []) log(`⚠ template ${d.template} → unknown group ${d.group} (groups/${d.group}.json)`)
  for (const u of w.unknownTemplateSettings ?? [])
    log(`⚠ template ${u.template} → ${u.type} sets '${u.setting}', which that section does not declare`)
  for (const b of w.disallowedTemplateBlocks ?? [])
    log(`⚠ template ${b.template} → ${b.parent} nests '${b.type}', not in its allowedBlocks`)
  for (const k of w.settingsUndeclared) log(`⚠ settings.json key '${k}' has no schema entry`)
  for (const k of w.settingsMissingValue) log(`⚠ schema key '${k}' has no value in settings.json`)
}

/** Drift that must fail CI (content that cannot work as written). */
function countDrift(w) {
  return (
    w.danglingTemplateRefs.length +
    (w.danglingGroupRefs ?? []).length +
    (w.unknownTemplateSettings ?? []).length +
    (w.disallowedTemplateBlocks ?? []).length
  )
}

const server = await createServer({
  root,
  logLevel: 'error',
  server: { middlewareMode: true },
  // The section files import CSS/assets; Vite SSR stubs those, so importing a
  // section to read its static definition is safe.
  appType: 'custom',
})

try {
  const mod = await server.ssrLoadModule('./scripts/manifest-entry.ts')
  const manifest = mod.buildManifest()
  const json = JSON.stringify(manifest, null, 2) + '\n'

  const newReadme = spliceReadme(readFileSync(readmeFile, 'utf8'), renderCatalog(manifest))

  if (check) {
    const curJson = existsSync(outFile) ? readFileSync(outFile, 'utf8') : ''
    const curReadme = readFileSync(readmeFile, 'utf8')
    const staleJson = curJson !== json
    const staleReadme = curReadme !== newReadme
    // Template drift is a CI failure, not a warning: a template that sets a
    // setting the section does not declare, nests a block the parent forbids,
    // or points at a section that no longer exists is broken content shipped
    // as if it worked.
    const drift = countDrift(manifest.warnings)
    if (drift > 0) {
      reportWarnings(manifest.warnings, console.error)
      console.error(`✗ ${drift} template/settings drift problem(s). Fix the template or declare the setting.`)
      process.exitCode = 1
    }
    if (staleJson || staleReadme) {
      const what = [staleJson && 'theme.manifest.json', staleReadme && 'README.md catalog']
        .filter(Boolean)
        .join(' + ')
      console.error(`✗ ${what} stale. Run \`node scripts/gen-manifest.mjs\` and commit the result.`)
      process.exitCode = 1
    } else {
      console.log('✓ theme.manifest.json + README catalog are up to date.')
    }
  } else {
    writeFileSync(outFile, json)
    writeFileSync(readmeFile, newReadme)
    const { sections, templates, layouts } = manifest.stats
    console.log(
      `✓ theme.manifest.json + README catalog — ${sections} sections, ${templates} templates, ${layouts} layouts`,
    )
    reportWarnings(manifest.warnings, console.warn)
  }
} finally {
  await server.close()
}
