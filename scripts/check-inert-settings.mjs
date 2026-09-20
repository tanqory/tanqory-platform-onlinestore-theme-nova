#!/usr/bin/env node
/**
 * Finds merchant settings that are declared but never read.
 *
 * A setting that appears in the editor and changes nothing is worse than a
 * missing one: the merchant sets it, sees no effect, and reasonably concludes
 * the theme is broken. Four header controls shipped this way.
 *
 * SCOPING IS THE WHOLE POINT. An earlier version asked "does this key appear in
 * ANY theme source file?" and so passed on three genuinely dead controls:
 * `header.logoHeight` matched `sections/LogoList.tsx`, a different section;
 * `product-details.buttonLink` matched `Hero.tsx`; `store-locator.layout`
 * matched the word `layout` in `layouts/layout.tsx`. A key now counts as read
 * only inside the file that DECLARES the section plus that file's transitive
 * local imports — the code that can actually receive the value.
 *
 * Two match strengths, because the two positions differ. In the DECLARING file
 * the key must appear as an access on `attributes` — a bare word there is
 * usually the same identifier used as a JSX prop name, which is how five
 * sections were caught declaring `description` while actually reading
 * `subheading` and passing it to `<SectionHead description={…}>`. In an
 * IMPORTED file a word-boundary match is enough, because a component
 * legitimately renames what it receives: `useChrome` reads `a.shopMenu`.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(ROOT, 'theme.manifest.json'), 'utf8'))

const read = (p) => {
  try { return readFileSync(p, 'utf8') } catch { return null }
}

/** Resolve a relative import to a file on disk, trying the usual extensions. */
function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null // package import — not ours to walk
  const base = resolve(dirname(fromFile), spec)
  for (const cand of [base, `${base}.tsx`, `${base}.ts`, join(base, 'index.tsx'), join(base, 'index.ts')]) {
    if (existsSync(cand) && statSync(cand).isFile()) return cand
  }
  return null
}

/** Every `{ … }` block that follows `key:` at any depth, brace-matched. */
function stripBlocks(body, key) {
  let out = body
  for (;;) {
    const i = out.indexOf(`${key}:`)
    if (i === -1) return out
    const start = out.indexOf('{', i)
    if (start === -1) return out
    let depth = 0
    let j = start
    for (; j < out.length; j += 1) {
      if (out[j] === '{') depth += 1
      else if (out[j] === '}') { depth -= 1; if (depth === 0) { j += 1; break } }
    }
    out = out.slice(0, i) + out.slice(j)
  }
}

/**
 * A section file with every DECLARATION of settings removed, so a key is not
 * counted as "read" by the very block that declares it.
 *   - `attributes: { … }` — the schema itself, at any nesting depth.
 *   - `presets: [{ settings: { … } }]` — starter values. `Slideshow.tsx`
 *     literally contains `buttonLink: '/collections/all'` in a preset, which
 *     is a value, not a read.
 */
function declarationsRemoved(body) {
  return stripBlocks(stripBlocks(body, 'attributes'), 'settings')
}

/** section name → the sections/*.tsx that declares it. */
const owners = new Map()
const sectionFiles = ['sections', 'overlays'].flatMap((dir) => {
  const d = join(ROOT, dir)
  try {
    return readdirSync(d).filter((f) => /\.tsx?$/.test(f)).map((f) => join(d, f))
  } catch {
    return []
  }
})
for (const file of sectionFiles) {
  const body = read(file)
  if (!body) continue
  for (const m of body.matchAll(/\bname:\s*'([a-z0-9-]+)'/g)) {
    // A file can register several sections (blocks live beside their parent);
    // the first `name:` inside a `defineSection` wins for each.
    if (!owners.has(m[1])) owners.set(m[1], file)
  }
}

/** The owning file plus everything it locally imports, transitively. */
function graphOf(entry) {
  const seen = new Set()
  const out = []
  const walk = (file, isEntry) => {
    if (seen.has(file)) return
    seen.add(file)
    const body = read(file)
    if (body === null) return
    out.push({ file, body: isEntry ? declarationsRemoved(body) : body })
    for (const m of body.matchAll(/^\s*(?:import|export)\b[^'"]*from\s*['"]([^'"]+)['"]/gm)) {
      const next = resolveImport(file, m[1])
      if (next) walk(next, false)
    }
  }
  walk(entry, true)
  return out
}

/**
 * Keys reached through a computed access — `attributes[`text${n}`]` in
 * `AnnouncementBar`, where the design's `messages[]` became three numbered
 * slots. The literal `text2` never appears in the source, so a name match
 * cannot see it; the PREFIX does, and covers exactly the keys that access can
 * reach.
 */
function dynamicPrefixes(files) {
  const out = []
  for (const f of files) {
    for (const m of f.body.matchAll(/attributes\??\[\s*`([A-Za-z0-9_]*)\$\{/g)) out.push(m[1])
  }
  return out
}

const graphs = new Map()
const inert = []
const unowned = []

for (const section of manifest.sections) {
  const attrs = Object.keys(section.attributes ?? {})
  if (attrs.length === 0) continue
  const entry = owners.get(section.name)
  if (!entry) { unowned.push(section.name); continue }
  if (!graphs.has(entry)) graphs.set(entry, graphOf(entry))
  const files = graphs.get(entry)
  const prefixes = dynamicPrefixes(files)
  // Identifiers the declaring file binds to `attributes`, so `a.key` counts.
  const own = files[0]?.body ?? ''
  const aliases = ['attributes']
  for (const m of own.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*(?::[^=\n]+)?=\s*attributes\b/g)) {
    aliases.push(m[1])
  }
  for (const m of own.matchAll(/\battributes\s*:\s*([A-Za-z_$][\w$]*)\s*[,}]/g)) aliases.push(m[1])
  const alt = aliases.join('|')
  for (const key of attrs) {
    const word = new RegExp(`\\b${key}\\b`)
    // `attributes.key`, `attributes?.key`, `attributes['key']`, a destructure,
    // or the same through a local alias — `Hero` does `const a = attributes`
    // and then reads `a.backgroundImage`.
    const access = new RegExp(
      `(?:${alt})\\??\\.${key}\\b` +
        `|(?:${alt})\\??\\[\\s*['"\`]${key}['"\`]` +
        `|\\b${key}\\b[^}]*\\}\\s*=\\s*(?:${alt})`,
    )
    const readHere = files.some((f, i) => (i === 0 ? access.test(f.body) : word.test(f.body)))
    if (readHere) continue
    if (prefixes.some((pre) => pre !== '' && key.startsWith(pre))) continue
    inert.push(`${section.name}.${key}`)
  }
}

if (unowned.length) {
  console.error(`✗ ${unowned.length} section(s) declare settings but no source file declares the section:`)
  for (const x of unowned) console.error(`    ${x}`)
}
if (inert.length) {
  console.error(`✗ ${inert.length} setting(s) appear in the editor but are never read:`)
  for (const x of inert) console.error(`    ${x}`)
}
if (inert.length || unowned.length) process.exit(1)
console.log('✓ every declared setting is read by the section that declares it')
