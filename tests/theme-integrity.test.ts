/**
 * Theme content integrity: the templates the theme SHIPS must be renderable by
 * the sections the theme SHIPS.
 *
 * `pnpm manifest:check` proves the manifest matches the code. This proves the
 * templates match the manifest — the drift that reaches a merchant as a setting
 * that silently does nothing, a not-found card on their home page, or a
 * composition the editor would refuse to save.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import manifest from '../theme.manifest.json'

interface Node {
  type?: string
  settings?: Record<string, unknown>
  blocks?: Node[]
}

/** What this test needs from a manifest section entry. `theme.manifest.json` is
 *  imported for its values; TypeScript infers `never[]` for a section whose
 *  `allowedBlocks` happens to be empty in the committed file, so the shape is
 *  stated explicitly here rather than inferred from one sample. */
interface ManifestSection {
  name: string
  attributes: Record<string, { default?: unknown }>
  allowedBlocks: string[]
}

const TEMPLATE_DIR = join(__dirname, '..', 'templates')
const templates = readdirSync(TEMPLATE_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({
    name: f.replace(/\.json$/, ''),
    doc: JSON.parse(readFileSync(join(TEMPLATE_DIR, f), 'utf8')) as { sections?: Node[] },
  }))

const manifestSections = manifest.sections as unknown as ManifestSection[]
const sections = new Map<string, ManifestSection>(manifestSections.map((s) => [s.name, s]))

function walk(nodes: Node[] | undefined, visit: (node: Node, parent?: string) => void, parent?: string): void {
  for (const node of nodes ?? []) {
    visit(node, parent)
    walk(node.blocks, visit, node.type)
  }
}

describe('templates reference only sections the theme ships', () => {
  it.each(templates)('$name', ({ doc }) => {
    const unknown: string[] = []
    walk(doc.sections, (node) => {
      if (node.type && !sections.has(node.type)) unknown.push(node.type)
    })
    expect(unknown).toEqual([])
  })
})

describe('templates only set settings their section declares', () => {
  it.each(templates)('$name', ({ doc }) => {
    const undeclared: string[] = []
    walk(doc.sections, (node) => {
      const def = node.type ? sections.get(node.type) : undefined
      if (!def) return
      for (const key of Object.keys(node.settings ?? {})) {
        if (!(key in def.attributes)) undeclared.push(`${node.type}.${key}`)
      }
    })
    // A setting the section does not declare is dropped on render and invisible
    // in the editor — the template appears to configure something it does not.
    expect(undeclared).toEqual([])
  })
})

describe('nested blocks are permitted by their parent', () => {
  it.each(templates)('$name', ({ doc }) => {
    const disallowed: string[] = []
    walk(doc.sections, (node, parent) => {
      if (!parent || !node.type) return
      const parentDef = sections.get(parent)
      if (parentDef && !parentDef.allowedBlocks.includes(node.type)) {
        disallowed.push(`${parent} > ${node.type}`)
      }
    })
    expect(disallowed).toEqual([])
  })
})

describe('starter content makes no claims on the merchant’s behalf', () => {
  const BANNED = [
    /free shipping/i,
    /\d+-day returns?/i,
    // "Free returns within 30 days" came back in `announcement-bar` after P1-7
    // removed "30-day returns" — the claim, not its wording, is what is banned.
    /free returns?/i,
    /returns? within \d+/i,
    /organic cotton/i,
    /ships in \d+ ?h/i,
  ]

  it('no template ships a shipping/returns/materials claim', () => {
    const hits: string[] = []
    for (const { name, doc } of templates) {
      const json = JSON.stringify(doc)
      for (const re of BANNED) {
        const m = json.match(re)
        if (m) hits.push(`${name}: ${m[0]}`)
      }
    }
    expect(hits).toEqual([])
  })

  it('no section DEFAULT ships one either', () => {
    // A default reaches a live storefront the moment the section is placed —
    // `announcement-bar` defaulted to "Free shipping on orders over $50".
    const hits: string[] = []
    for (const s of manifestSections) {
      for (const [key, spec] of Object.entries(s.attributes)) {
        const value = spec?.default
        if (typeof value !== 'string') continue
        for (const re of BANNED) {
          if (re.test(value)) hits.push(`${s.name}.${key}`)
        }
      }
    }
    expect(hits).toEqual([])
  })

  it('no section SOURCE ships one in a preset or a hardcoded fallback', () => {
    // The two tests above read the manifest, which carries `attributes` but not
    // a section's `presets` or its in-code fallbacks. `Multicolumn`'s
    // DEFAULT_ITEMS and `FeatureGridBlocks`' preset both still shipped
    // "Free shipping — on orders over $50" after P1-7 cleaned the templates:
    // a merchant met the claim the moment they placed the section.
    const dir = join(__dirname, '..', 'sections')
    const hits: string[] = []
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.tsx'))) {
      const body = readFileSync(join(dir, file), 'utf8')
      // Strip comments so prose ABOUT the removed claims does not trip it —
      // `ProductDetails` documents the exact strings it stopped hardcoding.
      const code = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
      for (const re of BANNED) {
        const m = code.match(re)
        if (m) hits.push(`${file}: ${m[0]}`)
      }
    }
    expect(hits).toEqual([])
  })
})

describe('theme settings schema', () => {
  it('has no drift between schema and values', () => {
    expect(manifest.warnings.settingsUndeclared).toEqual([])
    expect(manifest.warnings.settingsMissingValue).toEqual([])
  })

  it('records no template drift', () => {
    expect(manifest.warnings.danglingTemplateRefs).toEqual([])
    expect(manifest.warnings.unknownTemplateSettings).toEqual([])
    expect(manifest.warnings.disallowedTemplateBlocks).toEqual([])
  })
})

describe('translations', () => {
  const locales = readdirSync(join(__dirname, '..', 'locales')).filter((f) => f.endsWith('.json'))
  const load = (f: string): Record<string, string> =>
    JSON.parse(readFileSync(join(__dirname, '..', 'locales', f), 'utf8'))
  const en = load('en.json')

  it.each(locales.filter((f) => f !== 'en.json'))('%s covers every en key', (file) => {
    const other = load(file)
    // A missing key falls back to English silently; the shopper sees a mixed
    // page and nothing reports it.
    expect(Object.keys(en).filter((k) => !(k in other))).toEqual([])
  })
})

describe('starter content resolves against the shipped fixtures', () => {
  // A handle that is not in `lib/collections.json` renders as an empty row or a
  // 404 CTA for every merchant who has not yet replaced the starter content,
  // and for anyone developing offline. `test-collection` / `blazer` / `featured`
  // were a dev store's handles and shipped in `index.json` for months.
  const fixtures = new Set(
    (JSON.parse(readFileSync(join(__dirname, '..', 'lib', 'collections.json'), 'utf8')) as {
      handle: string
    }[]).map((c) => c.handle),
  )

  /** Every collection handle a template references, wherever it appears. */
  const handles = (doc: { sections?: Node[] }): string[] => {
    const out: string[] = []
    const walk = (n: Node): void => {
      const s = n.settings ?? {}
      for (const [key, value] of Object.entries(s)) {
        if (typeof value !== 'string' || !value) continue
        if (key === 'collection') out.push(value)
        else if (key === 'collections') out.push(...value.split(',').map((h) => h.trim()))
        else if (key.toLowerCase().endsWith('link')) {
          const m = /^\/collections\/([^/?#]+)/.exec(value)
          if (m?.[1]) out.push(m[1])
        }
      }
      n.blocks?.forEach(walk)
    }
    doc.sections?.forEach(walk)
    return out.filter(Boolean)
  }

  it.each(templates)('$name references only collections that exist', ({ doc }) => {
    expect(handles(doc).filter((h) => !fixtures.has(h))).toEqual([])
  })

  /**
   * Existing in `lib/collections.json` is NOT enough.
   *
   * Those fixtures are the theme's offline/editor data. A handle can be in
   * them and absent from the shop the theme is installed on — `new-arrivals`
   * passed the test above and still rendered "No products in this collection
   * yet" against a live store, exactly as the dev store's `test-collection`
   * did before it. `all` is the one handle every storefront has.
   */
  it.each(templates)('$name starter content only references `all`', ({ doc }) => {
    expect([...new Set(handles(doc))].filter((h) => h !== 'all')).toEqual([])
  })
})

/**
 * This repository is public. It must describe itself in its own words and never
 * name another commerce platform, its themes, its template language or its
 * documentation — a rule the team already applied once by hand and that then
 * regressed. The list cannot know every name; it pins the ones that have
 * actually appeared here, across every tracked text file.
 */
describe('no third-party platform references in a public repository', () => {
  const ROOT_DIR = join(__dirname, '..')
  const SKIP_DIRS = new Set(['node_modules', 'dist', 'dist-ssr', '.git', '.vite', 'qa', 'vendor'])
  const TEXT = /\.(tsx?|mjs|cjs|js|json|css|md|html|ya?ml|txt)$/
  // Built from parts so this file does not contain the names it forbids.
  const FORBIDDEN = new RegExp(
    [['shop', 'ify'], ['\\bliq', 'uid\\b'], ['\\.liq', 'uid\\b'], ['\\{', '%'], ['my', 'shop', 'ify'], ['woo', 'commerce'], ['big', 'commerce'], ['\\bmag', 'ento\\b']]
      .map((p) => p.join(''))
      .join('|'),
    'i',
  )
  const files: string[] = []
  const scan = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue
      const full = join(dir, entry.name)
      if (entry.isDirectory()) scan(full)
      else if (TEXT.test(entry.name) && entry.name !== 'pnpm-lock.yaml') files.push(full)
    }
  }
  scan(ROOT_DIR)

  it('scans the repository', () => {
    expect(files.length).toBeGreaterThan(100)
  })

  it('names no other platform, theme or template language', () => {
    const hits: string[] = []
    for (const file of files) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (FORBIDDEN.test(line)) hits.push(`${file.slice(ROOT_DIR.length + 1)}:${i + 1}: ${line.trim().slice(0, 90)}`)
      })
    }
    expect(hits).toEqual([])
  })
})
