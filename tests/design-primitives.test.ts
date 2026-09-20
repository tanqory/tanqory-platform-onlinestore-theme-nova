/**
 * The design system's primitives must be the ones actually in use.
 *
 * `design coverage 165/165` only checks that every prop NAME the design lists
 * exists in the schema. It passed for months while the locale switcher, the
 * variant picker's long-option fallback and `Field.Select` were all native
 * `<select>` elements with a chevron painted over them — the browser drew the
 * open state, so the "Select open" panel the style system specifies could not
 * exist. These check the implementation, not the schema.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..')
const DIRS = ['components', 'sections', 'layouts', 'overlays']

function sources(): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = []
  for (const dir of DIRS) {
    for (const f of readdirSync(join(ROOT, dir))) {
      if (!/\.tsx?$/.test(f)) continue
      out.push({ file: `${dir}/${f}`, text: readFileSync(join(ROOT, dir, f), 'utf8') })
    }
  }
  return out
}

/** Strip comments so a rule cannot be tripped by prose describing the old way. */
function code(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

describe('form controls are the design system, not the browser', () => {
  it('no component renders a native select', () => {
    const offenders = sources()
      .filter((s) => /<select[\s>]/.test(code(s.text)))
      .map((s) => s.file)
    expect(offenders).toEqual([])
  })

  it('the Select primitive exists and is built on the shared popover', () => {
    const src = readFileSync(join(ROOT, 'components/Select.tsx'), 'utf8')
    expect(src).toMatch(/from '\.\/Overlays'/)
    expect(src).toMatch(/role="listbox"/)
    expect(src).toMatch(/role="option"/)
    expect(src).toMatch(/aria-selected/)
  })

  it('every native select site now uses it', () => {
    for (const f of ['layouts/layout.tsx', 'components/VariantPicker.tsx', 'components/Field.tsx']) {
      expect(code(readFileSync(join(ROOT, f), 'utf8'))).toMatch(/Select/)
    }
  })
})

describe('the radius ladder is used by rung, not by taste', () => {
  const CSS = readFileSync(join(ROOT, 'assets/styles.css'), 'utf8')

  it('the popover panel sits on the Medium rung the ladder assigns it', () => {
    // tokens.css: `--radius-md: 8px; /* popover, toast, drawer panel */`
    const block = /\.popover__panel\s*\{([^}]*)\}/.exec(CSS)
    expect(block).not.toBeNull()
    expect(block![1]).toMatch(/border-radius:\s*var\(--radius-md\)/)
  })

  it('the select control sits on the Small rung, like every other input', () => {
    // Anchored to the start of a line so it matches the BASE rule, not a
    // compound selector that merely ends in `.select__control` (the error
    // and success states are written as `.field--error .select__control`).
    const block = /^\.select__control\s*\{([^}]*)\}/m.exec(CSS)
    expect(block).not.toBeNull()
    expect(block![1]).toMatch(/border-radius:\s*var\(--radius-sm\)/)
    expect(block![1]).toMatch(/min-height:\s*48px/)
  })
})
