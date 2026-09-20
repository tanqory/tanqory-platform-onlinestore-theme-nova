#!/usr/bin/env node
/**
 * Content migration for renamed section settings.
 *
 * Renaming an attribute orphans every saved value under the old key — the
 * theme's own templates AND every merchant's customised copy. `k8s.mjs` merges
 * theme updates by path prefix with no content version, so nothing else will
 * carry those values across.
 *
 * This script migrates the theme's shipped templates. Merchant content needs
 * the same map applied at publish time; the RENAMES table below is the record
 * of what changed, and is intentionally append-only.
 *
 *   node scripts/migrate-content.mjs [--dry]
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DRY = process.argv.includes('--dry')

/** section/block type → { oldKey: newKey | [newKey, transform] } */
const RENAMES = {
  // 2026-09-18 — design conversion: semantic presets replace raw values.
  slideshow: {
    size: 'slideHeight',
    intervalMs: ['interval', (ms) => (ms <= 4000 ? '4s' : ms >= 8000 ? '8s' : '6s')],
    showDots: ['controls', (on) => (on ? 'arrows+counter' : 'none')],
  },
  divider: {
    height: ['spacing', (px) => (px <= 16 ? 'sm' : px <= 48 ? 'md' : px <= 96 ? 'lg' : 'xl')],
    showLine: ['style', (on) => (on ? 'line-subtle' : 'space')],
    color: null, // dropped: raw colour is not a design control
  },
  group: {
    gap: ['innerGap', (px) => (px <= 12 ? 'small' : px <= 24 ? 'medium' : 'large')],
  },
  'featured-collection': {
    limit: ['productsToShow', (n) => Math.max(2, Math.min(12, Number(n) || 4))],
  },
  'main-collection': {
    limit: ['productsPerPage', (n) => String([12, 24, 48].includes(Number(n)) ? n : 24)],
  },
  'rich-text': {
    align: 'contentAlignment',
  },
  'image-with-text': {
    imageRight: ['mediaPosition', (on) => (on ? 'right' : 'left')],
  },
  'contact-form': {
    showPhone: ['fields', (on) => (on ? 'name,email,phone,message' : 'name,email,message')],
  },
  marquee: {
    speed: ['speed', (v) => (typeof v === 'number' ? (v >= 34 ? 'slow' : v <= 16 ? 'fast' : 'standard') : v)],
    bg: ['background', (hex) => (String(hex).toLowerCase() === '#ffffff' ? 'surface' : 'primary')],
    fg: null,
  },
  newsletter: {
    inverse: ['background', (on) => (on ? 'primary' : 'surface-secondary')],
  },
  'feature-highlights': {
    textAlign: 'textAlignment',
    background: ['background', (v) => (typeof v === 'string' && v.startsWith('#') ? 'surface' : v || 'surface')],
  },
  'announcement-bar': {
    bg: ['background', (hex) => (String(hex).toLowerCase() === '#ffffff' ? 'surface-secondary' : 'primary')],
    fg: null,
  },
}

/**
 * Global theme settings whose VALUE vocabulary changed, not their key.
 * `config/settings.json` and every merchant's copy hold the old word, and a
 * value that is no longer in the select silently falls back to the default —
 * so a merchant who chose "Bold" icons would land on the theme default with no
 * warning. Append-only, same as RENAMES.
 */
const VALUE_RENAMES = {
  // 2026-09-20 — realigned onto the approved design package (06 Configuration
  // System), which the theme had drifted from on both axis and vocabulary.
  typeScale: { standard: 'default', spacious: 'large' },
  buttonTextStyle: { sentence: 'default' },
  // badgeStyle was a SHAPE (square|pill); the design's axis is fill.
  badgeStyle: { square: 'filled', pill: 'filled' },
  // iconStyle was a WEIGHT (light|regular|bold); the design's axis is family.
  iconStyle: { light: 'outline', regular: 'outline', bold: 'filled' },
  cardHoverEffect: { zoom: 'image-swap', border: 'image-swap' },
  motion: { none: 'reduced', subtle: 'standard' },
  productImageRatio: { tall: 'landscape' },
  // buttonBorder became a role rather than an on/off.
  buttonBorder: { true: 'default', false: 'default' },
}

let changed = 0
const log = []

function migrateNode(node) {
  const map = RENAMES[node.type]
  if (map && node.settings) {
    for (const [oldKey, target] of Object.entries(map)) {
      if (!(oldKey in node.settings)) continue
      const value = node.settings[oldKey]
      delete node.settings[oldKey]
      changed += 1
      if (target === null) {
        log.push(`  ${node.type}.${oldKey} dropped (was ${JSON.stringify(value)})`)
        continue
      }
      const [newKey, transform] = Array.isArray(target) ? target : [target, (v) => v]
      // Never clobber a value the merchant already set under the new name.
      if (node.settings[newKey] === undefined) node.settings[newKey] = transform(value)
      log.push(`  ${node.type}.${oldKey} → ${newKey} = ${JSON.stringify(node.settings[newKey])}`)
    }
  }
  for (const child of node.blocks ?? []) migrateNode(child)
}

const dir = join(ROOT, 'templates')
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const path = join(dir, file)
  const before = readFileSync(path, 'utf8')
  const doc = JSON.parse(before)
  const start = changed
  for (const s of doc.sections ?? []) migrateNode(s)
  if (changed > start && !DRY) writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`)
  if (changed > start) console.log(`${file}:`)
}
// ── Global theme settings ───────────────────────────────────────────────────
const settingsPath = join(ROOT, 'config', 'settings.json')
const settings = JSON.parse(readFileSync(settingsPath, 'utf8'))
const settingsStart = changed
for (const [key, map] of Object.entries(VALUE_RENAMES)) {
  if (!(key in settings)) continue
  const next = map[String(settings[key])]
  if (next === undefined) continue
  log.push(`  settings.${key}: ${JSON.stringify(settings[key])} → ${JSON.stringify(next)}`)
  settings[key] = next
  changed += 1
}
if (changed > settingsStart) {
  console.log('config/settings.json:')
  if (!DRY) writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`)
}

console.log(log.join('\n'))
console.log(changed === 0 ? '✓ no orphaned settings' : `${DRY ? 'would migrate' : '✓ migrated'} ${changed} setting(s)`)
