/**
 * Manifest source-of-truth extractor. Loaded through Vite SSR by
 * `gen-manifest.mjs` so `import.meta.glob` resolves against the SAME files the
 * app registers at runtime (`main.tsx` / `entry-server.tsx` use the identical
 * globs). That coupling is the point: the manifest cannot describe a section the
 * app doesn't ship, or miss one it does — they read the same glob.
 *
 * Everything here is pure data extraction: it reads each section's static
 * `defineSection({...})` definition and drops the `component` function. No React
 * render, no DOM — safe under SSR.
 */
import settings from '../config/settings.json'
import settingsSchema from '../config/settings.schema'
import pkg from '../package.json'
import type { SectionDef, AttrSpec } from '@tanqory/theme-kit'

type SectionModule = { default?: SectionDef }
type TemplateJson = { sections?: Array<{ type?: string; blocks?: unknown[] }> }

const sectionMods = import.meta.glob<SectionModule>('../sections/*.tsx', { eager: true })
const templateMods = import.meta.glob<TemplateJson>('../templates/*.json', { eager: true })
const layoutMods = import.meta.glob('../layouts/*.tsx', { eager: true })

/** A JSON-safe copy of one attribute spec — keeps type/label/default/options,
 *  never a function. */
function serializeAttr(spec: AttrSpec): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(spec as Record<string, unknown>)) {
    if (typeof v === 'function') continue
    out[k] = v
  }
  return out
}

function serializeSection(def: SectionDef) {
  const attributes: Record<string, unknown> = {}
  for (const [key, spec] of Object.entries(def.attributes ?? {})) {
    attributes[key] = serializeAttr(spec as AttrSpec)
  }
  return {
    name: def.name,
    title: def.title,
    category: def.category ?? 'uncategorized',
    icon: def.icon ?? null,
    // The controls the editor auto-renders and the AI must fill to place this
    // section — the section's public contract.
    attributes,
    // What may nest inside it (empty = a leaf section).
    allowedBlocks: def.allowedBlocks ?? [],
  }
}

function fileStem(path: string): string {
  return path.split('/').pop()!.replace(/\.[^.]+$/, '')
}

export function buildManifest() {
  const sections = Object.values(sectionMods)
    .map((m) => m.default)
    .filter((d): d is SectionDef => !!d && typeof d.name === 'string')
    .map(serializeSection)
    .sort((a, b) => a.name.localeCompare(b.name))

  const templates = Object.entries(templateMods)
    .map(([path, json]) => {
      const secs = Array.isArray(json.sections) ? json.sections : []
      const sectionTypes = [...new Set(secs.map((s) => s.type).filter(Boolean))] as string[]
      return { name: fileStem(path), sectionCount: secs.length, sectionTypes: sectionTypes.sort() }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const layouts = Object.keys(layoutMods).map(fileStem).sort()

  // Every section type a template references must resolve to a known section —
  // a mismatch means a template points at a section the theme no longer ships.
  const known = new Set(sections.map((s) => s.name))
  const danglingTemplateRefs = templates
    .flatMap((t) => t.sectionTypes.map((type) => ({ template: t.name, type })))
    .filter((ref) => !known.has(ref.type))

  const categories: Record<string, number> = {}
  for (const s of sections) categories[s.category] = (categories[s.category] ?? 0) + 1

  // Theme settings, as a typed+grouped schema (settings.schema.ts) plus the
  // current values (settings.json). Serialize each spec the same way section
  // attributes are serialized (drop functions), and group for the editor panel.
  const schemaKeys = Object.keys(settingsSchema)
  const settingGroups: Record<string, Array<{ key: string } & Record<string, unknown>>> = {}
  for (const [key, spec] of Object.entries(settingsSchema)) {
    const s = serializeAttr(spec as AttrSpec)
    const group = (s.group as string) ?? 'General'
    ;(settingGroups[group] ??= []).push({ key, ...s })
  }

  const valueKeys = Object.keys(settings as Record<string, unknown>)
  // A key with a value but no schema entry is invisible to the editor; a key in
  // the schema with no value falls back to its declared default. Both are drift
  // the Phase 1 conformance test should watch.
  const settingsUndeclared = valueKeys.filter((k) => !schemaKeys.includes(k))
  const settingsMissingValue = schemaKeys.filter((k) => !valueKeys.includes(k))

  return {
    $schema: 'https://tanqory.com/schemas/theme-manifest/v1',
    theme: {
      name: (pkg as { name?: string }).name ?? 'nova',
      version: (pkg as { version?: string }).version ?? '0.0.0',
    },
    // Provenance so a reader knows this is generated, not hand-authored.
    generatedFrom: ['sections/*.tsx', 'templates/*.json', 'layouts/*.tsx', 'config/settings.json'],
    stats: {
      sections: sections.length,
      templates: templates.length,
      layouts: layouts.length,
      settings: schemaKeys.length,
      categories,
    },
    sections,
    templates,
    layouts,
    // Typed, grouped theme-settings schema (settings.schema.ts) — what the
    // editor panel and the AI generator read. `settingGroups` is the same data
    // keyed by editor group heading.
    settingsSchema: Object.entries(settingGroups)
      .map(([group, items]) => ({ group, items }))
      .sort((a, b) => a.group.localeCompare(b.group)),
    // Current values (settings.json).
    settings: settings as Record<string, unknown>,
    // Non-fatal integrity signals for the reader / the Phase 1 conformance test.
    warnings: {
      danglingTemplateRefs,
      settingsUndeclared,
      settingsMissingValue,
    },
  }
}
