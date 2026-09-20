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
import { createHash } from 'node:crypto'
import settings from '../config/settings.json'
import settingsSchema from '../config/settings.schema'
import pkg from '../package.json'
import { SHARED_ATTRIBUTES, CONTENT_SLOTS } from '../lib/shared-section-props'
import type { SectionDef, AttrSpec, SectionGroupDoc } from '@tanqory/theme-kit'
import {
  CONTRACT_VERSION,
  CURRENT_CONTENT_VERSION,
  groupImpact,
  resolvePage,
  roleOf,
  type GroupedPageDoc,
} from '@tanqory/theme-kit/contract'

type SectionModule = { default?: SectionDef }
interface TemplateNode {
  type?: string
  id?: string
  settings?: Record<string, unknown>
  blocks?: TemplateNode[]
}
type TemplateJson = { sections?: TemplateNode[]; groups?: unknown; contentVersion?: number }

const sectionMods = import.meta.glob<SectionModule>('../sections/*.tsx', { eager: true })
// The same files as text, so each section entry can carry the hash of the
// source it was generated from. A consumer (studio-api's catalog) compares it
// with the file it sees and knows whether this entry is current or stale.
const sectionSources = import.meta.glob<string>('../sections/*.tsx', { eager: true, query: '?raw', import: 'default' })
const templateMods = import.meta.glob<TemplateJson>('../templates/*.json', { eager: true })
const groupMods = import.meta.glob<{ default?: SectionGroupDoc }>('../groups/*.json', { eager: true })
const layoutMods = import.meta.glob('../layouts/*.tsx', { eager: true })

/** A JSON-safe copy of one attribute spec — keeps type/label/default/options,
 *  never a function. */
function serializeAttr(spec: AttrSpec): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const entries: Array<[string, unknown]> = Object.entries(spec)
  for (const [k, v] of entries) {
    if (typeof v === 'function') continue
    out[k] = v
  }
  return out
}

/** Presets as data: nested blocks and their settings, nothing executable. */
function serializePresets(def: SectionDef) {
  return (def.presets ?? []).map((p) => ({
    ...(p.name ? { name: p.name } : {}),
    settings: p.settings ?? {},
    blocks: (p.blocks ?? []).map((b) => ({ type: b.type, settings: b.settings ?? {}, ...(b.blocks ? { blocks: b.blocks } : {}) })),
  }))
}

/** sha256 of a file's bytes, shortened — the same shape studio-api uses for a revision. */
function sourceHash(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 32)
}

function serializeSection(def: SectionDef, parentsOf: Map<string, string[]>, source?: { path: string; text: string }) {
  const attributes: Record<string, unknown> = {}
  for (const [key, spec] of Object.entries(def.attributes ?? {})) {
    attributes[key] = serializeAttr(spec as AttrSpec)
  }
  const role = roleOf(def)
  // Placement is derived from the same source the runtime reads: a block's
  // parents are the sections whose `allowedBlocks` list it; a layout unit's
  // area is the slot it declares. Never a second hand-maintained list.
  const placement: Record<string, unknown> = { ...(def.placement ?? {}) }
  if (role === 'block' && !placement.parents) placement.parents = parentsOf.get(def.name) ?? []
  if (role === 'layout' && !placement.areas && def.area) placement.areas = [def.area]
  return {
    name: def.name,
    title: def.title,
    // Provenance: which file this entry was generated from and its hash at
    // generation time. Lets a consumer tell a stale entry from a current one
    // instead of trusting the manifest blindly.
    ...(source ? { source: source.path, sourceHash: sourceHash(source.text) } : {}),
    category: def.category ?? 'uncategorized',
    icon: def.icon ?? null,
    // What kind of unit this is and where it may go — the placement contract.
    // `category` is the inserter's display grouping, not a rule.
    role,
    ...(def.area ? { area: def.area } : {}),
    placement,
    requiresContext: def.requiresContext ?? [],
    // The controls the editor auto-renders and the AI must fill to place this
    // section — the section's public contract.
    attributes,
    // What may nest inside it (empty = a leaf section).
    allowedBlocks: def.allowedBlocks ?? [],
    // Starting compositions, nested blocks included, so an inserter or an AI
    // can seed a block-composed section without reading the source.
    presets: serializePresets(def),
  }
}

function fileStem(path: string): string {
  return path.split('/').pop()!.replace(/\.[^.]+$/, '')
}

export function buildManifest() {
  const defsWithSource = Object.entries(sectionMods)
    .map(([path, m]) => ({ def: m.default, source: { path: path.replace(/^\.\.\//, ''), text: sectionSources[path] ?? '' } }))
    .filter((x): x is { def: SectionDef; source: { path: string; text: string } } => !!x.def && typeof x.def.name === 'string')
  const defs = defsWithSource.map((x) => x.def)
  const parentsOf = new Map<string, string[]>()
  for (const d of defs) for (const b of d.allowedBlocks ?? []) parentsOf.set(b, [...(parentsOf.get(b) ?? []), d.name].sort())
  const sections = defsWithSource.map((x) => serializeSection(x.def, parentsOf, x.source)).sort((a, b) => a.name.localeCompare(b.name))

  // The shared props every `withShared()` schema folds in, as data. A consumer
  // that reads a section's .tsx itself (studio-api, for a file newer than this
  // manifest) applies these the same way `withShared` does: shared first, the
  // section's own keys win, `omit` and the content slots left out.
  const sharedAttributes: Record<string, unknown> = {}
  for (const [key, spec] of Object.entries(SHARED_ATTRIBUTES)) sharedAttributes[key] = serializeAttr(spec)

  // Shared header/footer groups, and which templates each one reaches.
  const groupDocs: Record<string, SectionGroupDoc> = {}
  for (const [path, mod] of Object.entries(groupMods)) if (mod.default) groupDocs[fileStem(path)] = mod.default
  const templateDocs: Record<string, GroupedPageDoc> = {}
  for (const [path, json] of Object.entries(templateMods)) templateDocs[fileStem(path)] = json as GroupedPageDoc
  const groups = Object.entries(groupDocs)
    .map(([name, doc]) => ({
      name,
      type: doc.type,
      sectionTypes: [...new Set(doc.sections.map((s) => s.type))].sort(),
      sectionIds: doc.sections.map((s) => s.id).filter(Boolean),
      // Every template that binds this group — the scope of an edit to it.
      usedBy: groupImpact(name, templateDocs),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const templates = Object.entries(templateMods)
    .map(([path, json]) => {
      const resolved = resolvePage(json as GroupedPageDoc, groupDocs)
      const secs = Array.isArray(json.sections) ? json.sections : []
      const sectionTypes = [...new Set(secs.map((s) => s.type).filter(Boolean))] as string[]
      const slot = (k: 'header' | 'footer') => {
        const r = resolved.slots[k]
        return r.mode === 'ref' ? { mode: 'ref' as const, group: r.group } : { mode: r.mode }
      }
      return {
        name: fileStem(path),
        contentVersion: json.contentVersion ?? 1,
        sectionCount: secs.length,
        sectionTypes: sectionTypes.sort(),
        // How the page fills its shared slots: `ref` (shared group), `override`
        // (its own copy, on purpose), `inline` (legacy copy), `none`.
        groups: { header: slot('header'), footer: slot('footer') },
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  // A template that binds a group this theme does not ship renders an empty
  // header — as loud a failure as a dangling section ref.
  const danglingGroupRefs = Object.entries(templateDocs)
    .flatMap(([name, doc]) => resolvePage(doc, groupDocs).missingGroups.map((group) => ({ template: name, group })))

  const layouts = Object.keys(layoutMods).map(fileStem).sort()

  // Every section type a template references must resolve to a known section —
  // a mismatch means a template points at a section the theme no longer ships.
  const known = new Set(sections.map((s) => s.name))
  const danglingTemplateRefs = templates
    .flatMap((t) => t.sectionTypes.map((type) => ({ template: t.name, type })))
    .filter((ref) => !known.has(ref.type))

  // Two more classes of template drift, both silent until now:
  //
  //   unknownTemplateSettings — a template sets a key the section does not
  //     declare. The value is dropped on render and the editor never shows a
  //     control for it, so the template appears to configure something it does
  //     not. Eight templates were passing `columns` to sections with no such
  //     attribute.
  //   disallowedTemplateBlocks — a template nests a block the parent section's
  //     `allowedBlocks` does not permit. The editor would refuse the same
  //     composition the theme ships.
  const byName = new Map(sections.map((s) => [s.name, s]))
  const unknownTemplateSettings: Array<{ template: string; type: string; setting: string }> = []
  const disallowedTemplateBlocks: Array<{ template: string; parent: string; type: string }> = []

  function validateNodes(template: string, nodes: TemplateNode[] | undefined, parent?: string): void {
    for (const node of nodes ?? []) {
      if (!node?.type) continue
      const def = byName.get(node.type)
      if (parent) {
        const parentDef = byName.get(parent)
        if (parentDef && !parentDef.allowedBlocks.includes(node.type)) {
          disallowedTemplateBlocks.push({ template, parent, type: node.type })
        }
      }
      if (def) {
        for (const key of Object.keys(node.settings ?? {})) {
          if (!(key in def.attributes)) {
            unknownTemplateSettings.push({ template, type: node.type, setting: key })
          }
        }
      }
      validateNodes(template, node.blocks, node.type)
    }
  }

  for (const [path, json] of Object.entries(templateMods)) {
    validateNodes(fileStem(path), Array.isArray(json.sections) ? json.sections : undefined)
  }

  // Group sections are content too — a group that sets a setting its section
  // does not declare is as broken as a template that does.
  for (const [name, doc] of Object.entries(groupDocs)) {
    validateNodes(`groups/${name}`, doc.sections as TemplateNode[])
  }

  const categories: Record<string, number> = {}
  for (const s of sections) categories[s.category] = (categories[s.category] ?? 0) + 1
  const roles: Record<string, number> = {}
  for (const s of sections) roles[s.role] = (roles[s.role] ?? 0) + 1

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
    generatedFrom: ['sections/*.tsx', 'templates/*.json', 'groups/*.json', 'layouts/*.tsx', 'config/settings.json'],
    // Which contract this manifest speaks — a consumer compares before trusting it.
    contract: { version: CONTRACT_VERSION, contentVersion: CURRENT_CONTENT_VERSION },
    stats: {
      sections: sections.length,
      templates: templates.length,
      groups: groups.length,
      layouts: layouts.length,
      settings: schemaKeys.length,
      categories,
      roles,
    },
    sections,
    sharedAttributes,
    contentSlots: [...CONTENT_SLOTS],
    templates,
    groups,
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
      danglingGroupRefs,
      unknownTemplateSettings,
      disallowedTemplateBlocks,
      settingsUndeclared,
      settingsMissingValue,
    },
  }
}
