/**
 * Links that come from settings (theme settings, merchant-edited copy) are
 * rendered as `href`s on the store's own origin. React 18 still renders a
 * `javascript:` href, so every such value is checked here at render — on the
 * live storefront, not only in the editor.
 *
 * Pure; unit-tested in lib/safe-href.test.ts.
 */

const ALLOWED_SCHEMES = new Set(['http', 'https', 'mailto', 'tel'])

/**
 * The value when it is safe to use as an `href`: a relative URL (`/path`,
 * `?q`, `#frag`, `page`), protocol-relative, or http(s) / mailto / tel.
 * Anything else — `javascript:`, `data:`, `vbscript:`, non-strings, empty — is
 * null so the caller falls back to its default link.
 */
export function safeHref(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  if (!v) return null
  // Browsers strip leading C0 controls/spaces and drop tabs and newlines
  // anywhere in a URL, so "java\tscript:" navigates as javascript:. Read the
  // scheme the way the browser will.
  const probe = v.replace(/[\u0000-\u0020]/g, '')
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(probe)
  if (scheme) return ALLOWED_SCHEMES.has(scheme[1].toLowerCase()) ? v : null
  return v
}

export interface AccountLink {
  label: string
  href: string
}

/**
 * The account menu's extra links (theme setting `accountExtraLinks`), in either
 * form — JSON `[{"label","href"}]` or one `Label|/path` per line / comma. Links
 * whose href is not {@link safeHref} are dropped.
 */
export function parseAccountLinks(raw: unknown): AccountLink[] {
  if (typeof raw !== 'string') return []
  const trimmed = raw.trim()
  if (!trimmed) return []
  let links: Array<{ label?: unknown; href?: unknown }>
  if (trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      links = Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  } else {
    links = trimmed
      .split(/[,\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [label, href] = entry.split('|').map((s) => s.trim())
        return { label, href }
      })
  }
  const out: AccountLink[] = []
  for (const l of links) {
    const href = safeHref(l?.href)
    if (typeof l?.label === 'string' && l.label && href) out.push({ label: l.label, href })
  }
  return out
}
