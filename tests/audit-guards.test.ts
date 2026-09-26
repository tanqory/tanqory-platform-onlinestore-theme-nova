/**
 * Guards for the things a green gate did not catch (theme audit, 2026-09-25):
 * a section root that forgets the shared props, an interface string that
 * bypasses the locale layer, and the editor's section preview answering on
 * the published storefront.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { render } from '../entry'

const ROOT = join(import.meta.dirname ?? __dirname, '..')
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')
const list = (dir: string) => readdirSync(join(ROOT, dir)).filter((f) => /\.tsx?$/.test(f) && !f.includes('.test.')).map((f) => `${dir}/${f}`)

describe('every section root carries the shared props it declares', () => {
  it('spreads sharedRootProps on each <section> a withShared section returns', () => {
    const misses: string[] = []
    for (const f of list('sections')) {
      const src = read(f)
      if (!src.includes('withShared(')) continue
      // Every root the component returns: `return (\n<section …>` and the
      // provider-wrapped form `<XProvider value={…}>\n<section …>`.
      const roots = [...src.matchAll(/(?:return \(|Provider value=\{[^}]+\}>)\s*<section\b([^>]*)>/g)]
      for (const m of roots) if (!m[1].includes('sharedRootProps')) misses.push(`${f}: <section${m[1].trim().slice(0, 40)}`)
    }
    expect(misses).toEqual([])
  })
})

describe('interface strings come from the locale maps', () => {
  it('no aria-label or placeholder is a literal English string', () => {
    const hits: string[] = []
    for (const f of [...list('sections'), ...list('components'), ...list('overlays'), ...list('layouts')]) {
      for (const m of read(f).matchAll(/(aria-label|placeholder)="[A-Z][^"]*"/g)) hits.push(`${f}: ${m[0]}`)
    }
    expect(hits).toEqual([])
  })
  it('every t() key exists in en.json', () => {
    const en = JSON.parse(read('locales/en.json')) as Record<string, string>
    const missing = new Set<string>()
    for (const f of [...list('sections'), ...list('components'), ...list('overlays'), ...list('layouts')]) {
      for (const m of read(f).matchAll(/\bt\('([a-zA-Z0-9_.-]+)'/g)) if (!(m[1] in en)) missing.add(`${f}: ${m[1]}`)
    }
    expect([...missing]).toEqual([])
  })
})

describe('entry.render()', () => {
  const ctx = (mode: 'serve' | 'preview') => ({ mode, store: null, content: null, assets: null }) as never
  it('answers the section preview only on the preview plane', async () => {
    const url = 'https://shop.example/__editor/preview-section?type=hero'
    const preview = await render(new Request(url), ctx('preview'))
    expect(preview.status).toBe(200)
    expect(await preview.text()).toContain('tq-preview-height')
    const serve = await render(new Request(url), ctx('serve'))
    expect(serve.status).toBe(404)
    expect(await serve.text()).not.toContain('tq-preview-height')
  })
  it('does not ask the edge to keep a 404 for a day', async () => {
    const res = await render(new Request('https://shop.example/no-such-page'), ctx('serve'))
    expect(res.status).toBe(404)
    expect(res.headers.get('cache-control')).toContain('s-maxage=60')
    const ok = await render(new Request('https://shop.example/'), ctx('serve'))
    expect(ok.status).toBe(200)
    expect(ok.headers.get('cache-control')).toContain('s-maxage=86400')
  })
})
