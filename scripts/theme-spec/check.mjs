#!/usr/bin/env node
/**
 * `pnpm check` — validate this BUILT theme against Tanqory theme spec v1.
 *
 * The theme owns all of its code, so it carries its own copy of the spec
 * checker (the platform keeps the canonical one in `packages/theme-spec`);
 * a clone of this repository alone can run every gate.
 */
import { readFile, stat, access } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const SPEC_VERSION = 1

const CANVAS_PROTOCOL = Object.freeze({
  fromTheme: Object.freeze(['tq:ready', 'tq:select', 'tanqory-section-selected', 'tanqory-block-selected', 'tanqory-content-changed', 'tanqory-content', 'tanqory-collections', 'tanqory-menus', 'tanqory-products', 'tq-preview-height']),
  toTheme: Object.freeze(['tq:set-content', 'tq:select', 'tq:theme-settings', 'tanqory-preview-update-section', 'tanqory-preview-select', 'tanqory-preview-reorder-sections', 'tanqory-preview-remove-section', 'tanqory-preview-insert-section', 'tanqory-get-content', 'tanqory-request-collections', 'tanqory-request-menus', 'tanqory-request-products']),
})

const LIMITS = Object.freeze({
  ssrBundleBytes: 10 * 1024 * 1024,   // Workers script limit
  clientBundleBytes: 25 * 1024 * 1024,
  renderMs: 50,                       // CPU budget per render (isolate)
})

const SETTING_TYPES = new Set(['text', 'textarea', 'richtext', 'html', 'url', 'number', 'range', 'boolean', 'select', 'radio', 'color', 'text_alignment', 'image', 'video', 'collection', 'product', 'page', 'blog', 'article', 'menu', 'header', 'paragraph', 'link_list', 'inline_richtext', 'font_picker', 'checkbox'])

/** Errors in a manifest object; [] when valid. */
function validateManifest(m) {
  const errors = []
  if (!m || typeof m !== 'object') return ['manifest is not an object']
  if (m.spec !== SPEC_VERSION) errors.push(`manifest.spec must be ${SPEC_VERSION}`)
  if (typeof m.name !== 'string' || !m.name) errors.push('manifest.name is required')
  if (!Array.isArray(m.sections)) errors.push('manifest.sections must be an array')
  else {
    const seen = new Set()
    m.sections.forEach((s, i) => {
      if (!s || typeof s.name !== 'string' || !/^[a-z0-9-]+$/.test(s.name)) { errors.push(`sections[${i}].name must be kebab-case`); return }
      if (seen.has(s.name)) errors.push(`duplicate section "${s.name}"`)
      seen.add(s.name)
      if (s.role && !['layout', 'section', 'block'].includes(s.role)) errors.push(`sections[${i}] "${s.name}": role must be layout|section|block`)
      for (const [id, spec] of Object.entries(s.attributes ?? {})) {
        if (!spec || typeof spec.type !== 'string') errors.push(`section "${s.name}" attribute "${id}" has no type`)
        else if (!SETTING_TYPES.has(spec.type)) errors.push(`section "${s.name}" attribute "${id}": unknown type "${spec.type}"`)
      }
    })
  }
  if (!Array.isArray(m.templates) || !m.templates.includes('index')) errors.push('manifest.templates must include "index"')
  if (m.groups !== undefined && !Array.isArray(m.groups)) errors.push('manifest.groups must be an array')
  return errors
}

const FORBIDDEN_IMPORTS = /(?:^|[^\w])(?:from|import)\s*\(?\s*["'](node:[a-z_]+|fs|path|os|child_process|crypto|net|http|https|worker_threads|vm)["']/g

/** Validate a BUILT theme directory. Never throws for a theme error — reports it. */
async function checkTheme(themeDir) {
  const errors = [], warnings = []
  const entry = join(themeDir, 'dist', 'ssr', 'entry.mjs')
  const clientDir = join(themeDir, 'dist', 'client')
  const exists = async (p) => { try { await access(p); return true } catch { return false } }
  if (!(await exists(entry))) errors.push('dist/ssr/entry.mjs is missing — the theme must build an SSR entry that exports render() and manifest')
  if (!(await exists(join(clientDir, '.vite', 'manifest.json')))) errors.push('dist/client/.vite/manifest.json is missing — build the client with `build.manifest: true`')
  let manifest
  if (errors.length === 0) {
    const size = (await stat(entry)).size
    if (size > LIMITS.ssrBundleBytes) errors.push(`dist/ssr/entry.mjs is ${size} bytes, over the ${LIMITS.ssrBundleBytes}-byte isolate limit`)
    const src = await readFile(entry, 'utf8')
    const bad = [...src.matchAll(FORBIDDEN_IMPORTS)].map((m) => m[1])
    if (bad.length) errors.push(`SSR bundle imports Node built-ins (${[...new Set(bad)].join(', ')}) — not available in the isolate; bundle everything (ssr.noExternal) and avoid Node APIs`)
    if (/\brequire\s*\(/.test(src)) warnings.push('SSR bundle contains require() — it must be pure ESM for the isolate')
    try {
      const mod = await import(pathToFileURL(entry).href)
      if (typeof mod.render !== 'function') errors.push('entry does not export render()')
      if (!mod.manifest || typeof mod.manifest !== 'object') errors.push('entry does not export manifest')
      else { manifest = mod.manifest; errors.push(...validateManifest(manifest)) }
    } catch (e) {
      errors.push(`entry failed to load: ${e?.message || e}`)
    }
  }
  return { ok: errors.length === 0, errors, warnings, manifest }
}

const dir = resolve(process.argv[2] || '.')
const r = await checkTheme(dir)
for (const w of r.warnings) console.log('warn ', w)
for (const e of r.errors) console.log('error', e)
if (r.ok) console.log(`✓ theme "${r.manifest.name}" v${r.manifest.version ?? '?'} passes spec v1 (${r.manifest.sections.length} sections, ${r.manifest.templates.length} templates)`)
process.exit(r.ok ? 0 : 1)
