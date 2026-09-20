#!/usr/bin/env node
/**
 * Exactly one top-level heading per template.
 *
 * A live sweep catches this on routable pages, but `templateSuffix` variants
 * (product.bundle, collection.featured, blog.featured) need a product or
 * collection assigned to them and so are never visited in a local run. Three
 * of them shipped with two `h1`s because a decorative rich-text was set to the
 * h1 size above a section that already owns the page heading.
 *
 * The list below is the source of truth for which sections own an `h1`, and is
 * asserted against the code by tests/design-system.test.ts.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Sections that always render the page's `h1`. */
const OWNS_H1 = new Set([
  'main-collection', 'product-details', 'blog-posts', 'page-body',
  'article-body', 'cart-items', 'account', 'search-results',
  'not-found', 'policy-page',
])
/** Sections that own it only in some configuration. */
const CONDITIONAL = {
  // Only the first slide, and only when the slideshow is the page's opener.
  slideshow: () => true,
  hero: () => true,
  // Only on the /collections index route, where it is the whole page.
  'collection-list': (_s, template) => template === 'list-collections',
  // Only when the merchant picks the h1 size.
  'rich-text': (s) => (s.settings ?? {}).headingSize === 'h1',
}

const problems = []
for (const file of readdirSync(join(ROOT, 'templates')).filter((f) => f.endsWith('.json'))) {
  const doc = JSON.parse(readFileSync(join(ROOT, 'templates', file), 'utf8'))
  const body = (doc.sections ?? []).filter(
    (s) => s.area !== 'header' && !['header', 'footer', 'announcement-bar'].includes(s.type),
  )
  const owners = body.filter(
    (s) => OWNS_H1.has(s.type) || (CONDITIONAL[s.type]?.(s, file.replace(/\.json$/, '')) ?? false),
  )
  if (owners.length > 1) {
    problems.push(`${file}: ${owners.length} sections claim the page heading — ${owners.map((s) => s.type).join(', ')}`)
  }
  if (owners.length === 0) {
    problems.push(`${file}: no section carries the page heading`)
  }
}

if (problems.length) {
  console.error('✗ page heading problems:')
  for (const p of problems) console.error(`    ${p}`)
  process.exit(1)
}
console.log('✓ every template has exactly one section carrying the page heading')
