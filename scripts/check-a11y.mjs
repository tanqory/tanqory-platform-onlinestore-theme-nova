#!/usr/bin/env node
/**
 * Accessibility gate — the real engine, not a hand-rolled probe.
 *
 * Every accessibility check in this repo before this one was written by hand,
 * so it only ever looked for what someone thought to look for.
 * `@accesslint/cli` runs the rule set a specialist audit would: on its first
 * run it found 195 violations across ten routes, none of which the 209 unit
 * tests could see — a button nested inside a link, duplicate ARIA ids, an
 * accessible name that contradicted its visible label, a video with no
 * captions, two banner landmarks per page.
 *
 * EACH ROUTE IS SCANNED TWICE and only violations present in BOTH runs are
 * reported. Scanning a client-rendered page races the render: the same route
 * came back with two, three or four violations run to run, and a footer
 * disclosure that plainly has a name was reported empty 27 times. A finding
 * that survives two independent scans is about the page; one that does not is
 * about the scanner.
 *
 *   pnpm check:a11y          # needs the dev server running
 *   THEME_URL=... pnpm check:a11y
 */
import { execFileSync } from 'node:child_process'

const BASE = process.env.THEME_URL ?? 'http://localhost:4321'
const ROUTES = {
  home: '/',
  product: '/products/classic-double-breasted-blazer',
  collection: '/collections/test-collection',
  collections: '/collections',
  cart: '/cart',
  contact: '/contact',
  search: '/search?q=blazer',
  account: '/account',
  policy: '/policies/privacy-policy',
  'not-found': '/no-such-page',
}
/** The last thing on the page to get its content, so the scan starts after the
 *  menus have resolved rather than during. */
const SETTLED = '.site-footer__col-title'

function scan(url) {
  let out
  try {
    out = execFileSync(
      'npx',
      ['-y', '@accesslint/cli@latest', 'scan', url,
       '--wait-for', SETTLED, '--wait-timeout', '20000', '--format', 'json'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 },
    )
  } catch (e) {
    out = e.stdout || ''
  }
  try {
    return JSON.parse(out).violations ?? []
  } catch {
    // The scanner truncates its own JSON on very large reports; that is itself
    // worth surfacing rather than silently passing.
    return [{ ruleId: 'scanner/unreadable-output', impact: 'serious', html: url }]
  }
}

/** What identifies one finding, so two runs can be compared. */
const key = (v) => `${v.ruleId ?? v.id}|${(v.selector ?? '').slice(0, 120)}`

let total = 0
const byRule = new Map()
for (const [name, route] of Object.entries(ROUTES)) {
  const url = BASE + route
  const first = new Map(scan(url).map((v) => [key(v), v]))
  const second = new Map(scan(url).map((v) => [key(v), v]))
  const stable = [...first.keys()].filter((k) => second.has(k)).map((k) => first.get(k))
  const flaky = first.size + second.size - stable.length * 2
  for (const v of stable) {
    total++
    const id = v.ruleId ?? v.id
    byRule.set(id, (byRule.get(id) ?? 0) + 1)
    console.error(`  ${name}: [${v.impact}] ${id}\n      ${(v.html ?? '').replace(/\s+/g, ' ').slice(0, 100)}`)
  }
  if (flaky > 0) console.error(`  ${name}: ${flaky} finding(s) appeared in only one of two scans — ignored`)
}

if (total) {
  console.error(`\n✗ ${total} accessibility violation(s) reproducible across two scans`)
  for (const [id, n] of [...byRule].sort((a, b) => b[1] - a[1])) console.error(`    ${n}x ${id}`)
  process.exit(1)
}
console.log(`✓ no reproducible accessibility violations across ${Object.keys(ROUTES).length} routes`)
