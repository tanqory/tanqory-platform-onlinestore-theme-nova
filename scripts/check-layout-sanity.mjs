#!/usr/bin/env node
/**
 * Layout sanity — the check that was missing every time a screenshot looked
 * wrong while every gate passed.
 *
 * Nothing in this repo looked at PROPORTION. A footer cell stretched to 404px
 * around 120px of payment marks, a newsletter squeezed into a 163px column with
 * its email field clipped and its heading broken across two lines, a question
 * that opened onto an empty panel — all of it passed typecheck, 209 unit tests,
 * the design-rule checker and a full accessibility audit, because none of those
 * ask whether a block is mostly empty or a line is four words long.
 *
 * Three measurements, at every breakpoint the design names:
 *   1. a laid-out box far taller than what it contains
 *   2. a text column so narrow the copy breaks into very short lines
 *   3. a form field too narrow to show what a person types into it
 *
 *   pnpm check:layout          # needs the dev server running
 */
import { chromium } from 'playwright-core'

const BASE = process.env.THEME_URL ?? 'http://localhost:4321'
const WIDTHS = [1440, 1280, 768, 390]
const ROUTES = ['/', '/products/classic-double-breasted-blazer', '/collections/test-collection', '/cart']

/** Space a box holds beyond its content before it reads as a gap. */
const WASTE_PX = 120
/** Below this, a line of prose is too short to read comfortably. */
const MIN_CHARS_PER_LINE = 18
/** An email field narrower than this clips what has been typed. */
const MIN_FIELD_PX = 180

/** Runs in the page. A real function, not a string — passed as a string,
 *  Playwright read this arrow function with a destructured parameter as a
 *  statement and returned `undefined` for every page, so the gate reported
 *  success on a fixture built to fail three ways. */
function probe([wastePx, minChars, minField]) {
  const out = []
  /** Anything inside a closed overlay is not on screen; measuring it reports
   *  gaps nobody can see. */
  const onScreen = (e) => {
    for (let n = e; n; n = n.parentElement) {
      if (n.hasAttribute?.('inert')) return false
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false
    }
    return true
  }
  const boxes = [...document.querySelectorAll('main *, .site-footer *, .site-header *')]
  for (const e of boxes) {
    const r = e.getBoundingClientRect()
    if (r.height < 80 || r.width < 40) continue
    if (!onScreen(e)) continue
    const cs = getComputedStyle(e)
    if (cs.position === 'absolute' || cs.position === 'fixed') continue
    // A box whose size the author SET is not a gap. A hero is 640px because
    // the merchant chose "large" and its type sits at the bottom of the frame;
    // a thumbnail rail is as tall as the photo beside it. This check is for
    // space a layout leaves by accident, not space reserved on purpose.
    // `getComputedStyle().height` is the USED value and is never 'auto' for a
    // rendered element, so testing it disabled this check entirely — the
    // fixture built to fail stopped failing. Only a declared minimum, a fixed
    // ratio or a background image count as "the author asked for this space".
    if (cs.aspectRatio !== 'auto') continue
    if (cs.minHeight !== '0px' && cs.minHeight !== 'auto') continue
    if (cs.backgroundImage !== 'none') continue
    // Only overlays are excluded. Filtering on `position === 'static'` also
    // dropped every relatively-positioned child — a product card's media is
    // `position: relative`, so the card looked 80% empty.
    const kids = [...e.children].filter((c) => {
      const p = getComputedStyle(c).position
      return p !== 'absolute' && p !== 'fixed'
    })
    if (!kids.length) continue
    // The SPAN the children occupy, not the sum of their heights. Summing is
    // only right for a vertical stack; in a grid or a row the children sit side
    // by side, and adding their heights made a perfectly packed row of columns
    // look like a mostly empty box.
    const rects = kids.map((c) => c.getBoundingClientRect()).filter((b) => b.height > 0)
    if (!rects.length) continue
    const top = Math.min(...rects.map((b) => b.top))
    const bottom = Math.max(...rects.map((b) => b.bottom))
    // Padding is deliberate space, not a gap in the layout.
    const chrome = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    const content = bottom - top + chrome
    if (content > 0 && r.height - content > wastePx) {
      out.push({ kind: 'empty-space', el: (e.className || e.tagName).toString().split(' ')[0],
                 detail: `${Math.round(r.height - content)}px of a ${Math.round(r.height)}px box holds nothing` })
    }
  }
  for (const e of document.querySelectorAll('p, .lede, .newsletter__note')) {
    if (!onScreen(e)) continue
    const r = e.getBoundingClientRect()
    const text = (e.textContent || '').trim()
    if (r.height < 40 || text.length < 60) continue
    const lh = parseFloat(getComputedStyle(e).lineHeight) || 20
    const lines = Math.round(r.height / lh)
    if (lines >= 3 && text.length / lines < minChars) {
      out.push({ kind: 'cramped-text', el: (e.className || e.tagName).toString().split(' ')[0],
                 detail: `${Math.round(text.length / lines)} characters per line over ${lines} lines` })
    }
  }
  for (const e of document.querySelectorAll('input[type=email], input[type=search], input[type=text]')) {
    if (!onScreen(e)) continue
    const r = e.getBoundingClientRect()
    if (r.height > 0 && r.width < minField) {
      out.push({ kind: 'clipped-field', el: (e.className || e.type).toString().split(' ')[0],
                 detail: `${Math.round(r.width)}px wide` })
    }
  }
  const seen = new Set()
  return out.filter((o) => {
    const k = o.kind + o.el + o.detail
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}


// `playwright-core` ships no browser binaries, so it drives the Chrome already
// installed on the machine. Connecting over CDP to a shared Chrome was tried
// first and silently returned nothing on every page — a gate that reports
// success because it never looked is worse than no gate, which is why the
// sanity assertions below exist.
const browser = await chromium.launch({ channel: 'chrome' })

let total = 0
for (const width of WIDTHS) {
  // A CDP connection hands back the browser's existing context; creating a new
  // one is not supported, so the viewport is set on the page instead.
  const context = await browser.newContext({ viewport: { width, height: 1000 } })
  const page = await context.newPage()
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' })
    await page.waitForTimeout(4500)
    try { await page.click('button:has-text("Accept")', { timeout: 1500 }) } catch { /* none */ }
    // A silent empty result is how a gate becomes decoration: assert the page
    // is actually loaded and sized before believing that it found nothing.
    const sanity = await page.evaluate(() => ({
      url: location.href,
      width: document.documentElement.clientWidth,
      boxes: document.querySelectorAll('main *, .site-footer *, .site-header *').length,
    }))
    if (sanity.boxes === 0) {
      console.error(`  ${width}px ${route} — page produced no elements to measure (${sanity.url})`)
      process.exitCode = 1
      continue
    }
    if (Math.abs(sanity.width - width) > 40) {
      console.error(`  asked for ${width}px, the page reports ${sanity.width}px — viewport not applied`)
      process.exitCode = 1
      continue
    }
    const found = await page.evaluate(probe, [WASTE_PX, MIN_CHARS_PER_LINE, MIN_FIELD_PX])
    for (const f of found) {
      total++
      console.error(`  ${width}px ${route} — [${f.kind}] ${f.el}: ${f.detail}`)
    }
  }
  await context.close()
}
await browser.close()

if (total) {
  console.error(`\n✗ ${total} layout problem(s)`)
  process.exit(1)
}
console.log(`✓ no layout problems across ${ROUTES.length} routes x ${WIDTHS.length} widths`)
