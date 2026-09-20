/**
 * The three checks whose absence let a full audit's worth of defects ship.
 *
 * The suite asked "does it render, is the font right, is the radius one of the
 * approved values". None of those can see white text on a light surface, a
 * capsule input beside a 4px button, or a token that misses the contrast its
 * own comment promises. These read the stylesheet and the token layer directly,
 * so they run without a browser.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrastRatio, readableOn } from '../lib/contrast'

const ROOT = join(__dirname, '..')
const TOKENS = readFileSync(join(ROOT, 'assets/tokens.css'), 'utf8')
const STYLES = readFileSync(join(ROOT, 'assets/styles.css'), 'utf8')

/** The value of a custom property from the `:root` block. */
function token(name: string): string {
  const m = new RegExp(`${name}:\\s*([^;]+);`).exec(TOKENS)
  if (!m) throw new Error(`token ${name} not found`)
  return m[1].trim()
}

/** The three surfaces text is allowed to sit on. */
const SURFACES = {
  page: '--color-bg',
  'surface secondary': '--color-bg-muted',
  elevated: '--color-bg-elevated',
} as const

describe('ink tokens meet the contrast their role promises', () => {
  // The style system states: Text Primary ≥ 12:1, Text Secondary ≥ 7:1,
  // Text Muted ≥ 4.5:1. `--color-fg-subtle` shipped at 3.53:1.
  const ROLES: [string, number][] = [
    ['--color-fg', 12],
    ['--color-fg-muted', 7],
    ['--color-fg-subtle', 4.5],
  ]
  for (const [name, need] of ROLES) {
    for (const [label, surface] of Object.entries(SURFACES)) {
      it(`${name} reaches ${need}:1 on the ${label} surface`, () => {
        const ratio = contrastRatio(token(name), token(surface))
        expect(Math.round(ratio * 100) / 100).toBeGreaterThanOrEqual(need)
      })
    }
  }
})

describe('no rule paints inverse ink on a surface that is not inverse', () => {
  it('nothing outside an inverse context uses --color-fg-inverse for text', () => {
    // `.site-footer__bottom` did, for months after the footer turned light.
    const offenders: string[] = []
    const blocks = STYLES.split('}')
    for (const block of blocks) {
      const sel = block.split('{')[0]?.trim() ?? ''
      const body = block.split('{')[1] ?? ''
      if (!/color:\s*[^;]*--color-fg-inverse/.test(body)) continue
      // Legitimate when the SAME rule paints a solid background for the ink to
      // sit on, or when the selector names an explicitly inverse/over-media
      // context. What this catches is inverse ink inherited onto a light
      // surface — which is exactly what the footer legal line was.
      if (/background(-color)?:\s*(var\(--color-|#|rgb|hsl)/.test(body)) continue
      // Or when the selector explicitly opts into a dark context: the footer's
      // `primary` background role, a transparent header over hero media, or a
      // selected chip whose companion rule fills it with `--color-fg`.
      if (/inverse|--dark|overlay|scrim|hero|slide|announcement|marquee|toast/i.test(sel)) continue
      if (/\[data-background='primary'\]|\[data-transparent='true'\]|\.is-active/.test(sel)) continue
      offenders.push(sel.replace(/\s+/g, ' ').slice(0, 70))
    }
    expect(offenders).toEqual([])
  })
})

describe('corner radius follows the element role, not just the token set', () => {
  it('no input or text field is given the pill radius', () => {
    // `.newsletter__form .field__input` was a capsule beside a 4px button.
    const offenders: string[] = []
    for (const block of STYLES.split('}')) {
      const sel = block.split('{')[0]?.trim() ?? ''
      const body = block.split('{')[1] ?? ''
      if (!/border-radius:\s*[^;]*--radius-pill/.test(body)) continue
      if (/input|textarea|select|field__|\.card|product-card__media/.test(sel)) {
        offenders.push(sel.replace(/\s+/g, ' ').slice(0, 70))
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('the brand contrast guard', () => {
  it('keeps a merchant colour pair that is legible', () => {
    expect(readableOn('#1b1a18', '#ffffff')).toBe('#ffffff')
  })

  it('replaces a pair that is not', () => {
    // The live store's stored pair: red with pale pink, 2.72:1.
    expect(readableOn('#c63131', '#d7aeae')).toBe('#ffffff')
    expect(contrastRatio('#ffffff', '#c63131')).toBeGreaterThanOrEqual(4.5)
  })

  it('picks dark ink on a light brand colour', () => {
    expect(readableOn('#f2e9d8', '#ffffff')).toBe('#1b1a18')
  })

  it('leaves a non-hex brand value alone so the token default stands', () => {
    expect(readableOn('var(--something)')).toBeNull()
  })
})
