/**
 * Relative luminance and the contrast guard the style system requires.
 *
 * The design states it directly: "Button label on Primary ≥ 4.5:1 — if a
 * merchant brand fails, Text Inverse flips automatically to Text Primary."
 * Until now the theme copied the merchant's stored `{background, foreground}`
 * pair onto the brand tokens verbatim. One live store has `#c63131` paired
 * with `#d7aeae` — red with pale pink on top, 2.72:1 — and the Subscribe
 * button in its footer shipped unreadable.
 */

/** Text Primary and Text Inverse, the only two label colours the system has. */
const INK = '#1b1a18'
const INVERSE = '#ffffff'
const MIN_RATIO = 4.5

/** #rgb / #rrggbb → [r, g, b], or null if it is not a hex colour. */
export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number): number => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** WCAG contrast ratio between two hex colours; 1 when either cannot be read. */
export function contrastRatio(a: string, b: string): number {
  const x = parseHex(a)
  const y = parseHex(b)
  if (!x || !y) return 1
  const la = luminance(x) + 0.05
  const lb = luminance(y) + 0.05
  return Math.max(la, lb) / Math.min(la, lb)
}

/**
 * The label colour to use on `background`.
 *
 * A merchant's own foreground is kept when it is legible; otherwise the system
 * flips to whichever of Text Primary / Text Inverse reads better, which is what
 * the style system says must happen. A background that is not a hex colour is
 * left alone — the caller then keeps the token default.
 */
export function readableOn(background: string, preferred?: string | null): string | null {
  if (!parseHex(background)) return null
  if (preferred && parseHex(preferred) && contrastRatio(preferred, background) >= MIN_RATIO) {
    return preferred
  }
  return contrastRatio(INVERSE, background) >= contrastRatio(INK, background) ? INVERSE : INK
}
