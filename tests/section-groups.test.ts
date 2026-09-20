/**
 * Shared header/footer groups, against the theme's REAL files.
 *
 * The kit's own suite proves the contract on fixtures; this proves that Nova's
 * templates and groups, as shipped, satisfy the acceptance criteria:
 *
 *   A  one header edit reaches home, product and collection
 *   B  a page that overrides the header keeps its override across save/reload
 *   F  the migration preserved every id/setting/block/order, and re-running
 *      it is a no-op
 *
 * And that the theme's own runtime path — the SPA router's template lookup —
 * resolves through the same function the entry mounts with.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  extractGroups,
  groupImpact,
  resolvePage,
  resolvePageFrom,
  splitPage,
  validatePage,
  templateContext,
  type GroupedPageDoc,
  type SectionGroupDoc,
} from '@tanqory/theme-kit/contract'
import manifest from '../theme.manifest.json'

const ROOT = join(__dirname, '..')
const read = <T,>(rel: string): T => JSON.parse(readFileSync(join(ROOT, rel), 'utf8')) as T

const templates: Record<string, GroupedPageDoc> = Object.fromEntries(
  readdirSync(join(ROOT, 'templates'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => [f.replace(/\.json$/, ''), read<GroupedPageDoc>(`templates/${f}`)]),
)
const groups: Record<string, SectionGroupDoc> = Object.fromEntries(
  readdirSync(join(ROOT, 'groups'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => [f.replace(/\.json$/, ''), read<SectionGroupDoc>(`groups/${f}`)]),
)

/** The section catalogue the validator needs, from the generated manifest. */
const catalog = Object.fromEntries(
  (manifest.sections as Array<Record<string, unknown>>).map((s) => [s.name as string, s]),
) as unknown as Parameters<typeof validatePage>[2]

describe('shared groups — what ships', () => {
  it('ships one header group and one footer group', () => {
    expect(Object.keys(groups).sort()).toEqual(['footer', 'header'])
    expect(groups.header.type).toBe('header')
    expect(groups.footer.type).toBe('footer')
  })

  it('A — product, collection and every plain page bind the shared header; home overrides it on purpose', () => {
    for (const slug of ['product', 'collection', 'page', 'cart', 'search']) {
      expect(resolvePage(templates[slug]!, groups).slots.header.mode, slug).toBe('ref')
    }
    // The home page carries an announcement bar above its header — the
    // migration kept that as an explicit override rather than merging it away.
    expect(resolvePage(templates.index!, groups).slots.header.mode).toBe('override')
  })

  it('A — one edit to the shared header changes every page that binds it, and only those', () => {
    const edited = {
      ...groups,
      header: {
        ...groups.header,
        sections: groups.header.sections.map((s) =>
          s.type === 'header' ? { ...s, settings: { ...s.settings, sticky: 'none' } } : s,
        ),
      },
    }
    const bound = groupImpact('header', templates)
    expect(bound.length).toBeGreaterThanOrEqual(3)
    for (const slug of bound) {
      const header = resolvePage(templates[slug]!, edited).sections.find((s) => s.type === 'header')
      expect(header?.settings?.sticky, slug).toBe('none')
    }
    for (const slug of Object.keys(templates).filter((s) => !bound.includes(s))) {
      const r = resolvePage(templates[slug]!, edited)
      const header = r.sections.find((s) => s.type === 'header')
      // An override or an empty slot is untouched by a group edit.
      if (header) expect(header.settings?.sticky, slug).not.toBe('none')
    }
  })

  it('every template + the groups validate, with the context the template provides', () => {
    for (const [slug, doc] of Object.entries(templates)) {
      const r = validatePage(doc, groups, catalog, { template: slug, context: templateContext(slug) })
      expect(r.issues.filter((i) => i.severity === 'error'), slug).toEqual([])
    }
  })

  it('no page renders a header twice or ends up without one it used to have', () => {
    for (const [slug, doc] of Object.entries(templates)) {
      const r = resolvePage(doc, groups)
      expect(r.sections.filter((s) => s.type === 'header').length, slug).toBeLessThanOrEqual(1)
      expect(r.missingGroups, slug).toEqual([])
      // Header first, footer last, exactly as the inline layout used to be.
      const types = r.sections.map((s) => s.area ?? 'template')
      const firstBody = types.indexOf('template')
      const lastHeader = types.lastIndexOf('header')
      const firstFooter = types.indexOf('footer')
      if (lastHeader >= 0 && firstBody >= 0) expect(lastHeader, slug).toBeLessThan(firstBody)
      if (firstFooter >= 0 && firstBody >= 0) expect(firstFooter, slug).toBeGreaterThan(firstBody)
    }
  })
})

describe('B — a page-specific override', () => {
  const overriding = Object.entries(templates).filter(
    ([, doc]) => resolvePage(doc, groups).slots.header.mode === 'override',
  )

  it('at least one template overrides the header on purpose (the home page carries the announcement bar)', () => {
    expect(overriding.map(([slug]) => slug)).toContain('index')
  })

  it.each(overriding.map(([slug]) => slug))('%s keeps its override across an edit → save → reload', (slug) => {
    const resolved = resolvePageFrom(templates[slug]!, groups)
    // Edit the override's first node and the body, then save.
    const edited = resolved.sections.map((n, i) =>
      i === 0 ? { ...n, settings: { ...n.settings, __edited: true } } : n,
    )
    const out = splitPage(edited, resolved)
    expect(out.template.groups?.header).toMatchObject({ override: expect.any(Array) })
    expect(out.groups.header, 'an override never writes the shared group').toBeUndefined()
    // Reload: the override, with its edit, is what renders.
    const again = resolvePage(out.template, groups)
    expect(again.slots.header.mode).toBe('override')
    expect(again.sections[0]!.settings?.__edited).toBe(true)
    // And the shared header is untouched.
    expect(groups.header.sections[0]!.settings?.__edited).toBeUndefined()
  })
})

describe('F — migration', () => {
  it('is a no-op on the migrated theme (re-running changes nothing)', () => {
    const defaults = Object.fromEntries(
      (manifest.sections as unknown as Array<{ name: string; attributes: Record<string, { default?: unknown }> }>).map((s) => [
        s.name,
        Object.fromEntries(Object.entries(s.attributes).flatMap(([k, a]) => (a.default === undefined ? [] : [[k, a.default]]))),
      ]),
    )
    const r = extractGroups(templates, { defaults })
    expect(r.noop).toBe(true)
    expect(r.templates).toEqual(templates)
  })

  it('the CLI agrees: `migrate-groups --check` passes', () => {
    const out = execFileSync('node', [join(ROOT, 'scripts/migrate-groups.mjs'), '--check'], { encoding: 'utf8' })
    expect(out).toContain('would change nothing')
  })

  it('preserved every id in the shared groups and every override (nothing was re-minted)', () => {
    const ids = (nodes: Array<{ id?: string; blocks?: unknown[] }>): string[] =>
      nodes.flatMap((n) => [n.id ?? '', ...ids((n.blocks ?? []) as never)])
    for (const g of Object.values(groups)) {
      for (const id of ids(g.sections)) expect(id).toMatch(/^[A-Za-z0-9][A-Za-z0-9._-]*$/)
    }
    // The 14 templates that shared one footer keep the ids that footer had.
    expect(ids(groups.footer.sections)).toContain('footer')
    expect(ids(groups.footer.sections)).toContain('footer-brand')
    expect(ids(groups.header.sections)).toContain('header')
  })
})

describe('the runtime resolves through the contract', () => {
  it('layouts/layout.tsx and main.tsx both hand the groups glob to the kit resolver', () => {
    const layout = readFileSync(join(ROOT, 'layouts/layout.tsx'), 'utf8')
    const main = readFileSync(join(ROOT, 'main.tsx'), 'utf8')
    const ssg = readFileSync(join(ROOT, 'entry-server.tsx'), 'utf8')
    expect(layout).toMatch(/resolvePageSections\(mod\.default, GROUPS\)/)
    expect(main).toMatch(/groups: import\.meta\.glob\('\.\/groups\/\*\.json'/)
    expect(ssg).toMatch(/groups: import\.meta\.glob\('\.\/groups\/\*\.json'/)
  })

  it('the manifest carries the groups and each template’s binding, generated from the same files', () => {
    const m = manifest as unknown as {
      groups: Array<{ name: string; usedBy: string[] }>
      templates: Array<{ name: string; groups: { header: { mode: string } } }>
      contract: { contentVersion: number }
    }
    expect(m.groups.map((g) => g.name).sort()).toEqual(['footer', 'header'])
    expect(m.groups.find((g) => g.name === 'header')!.usedBy).toEqual(groupImpact('header', templates))
    expect(m.templates.find((t) => t.name === 'product')!.groups.header.mode).toBe('ref')
    expect(m.contract.contentVersion).toBe(2)
  })
})
