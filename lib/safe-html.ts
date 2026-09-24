/**
 * HTML that comes from a section SETTING (a fallback body, an accordion
 * answer) is authored in the editor as text and rendered on the store with
 * `dangerouslySetInnerHTML`. Every such value passes through here first, so
 * only formatting survives: the tags below, with every attribute dropped
 * except an `<a href>` that {@link safeHref} accepts.
 *
 * Pure and DOM-free (runs in SSG as well as the browser); unit-tested in
 * lib/safe-html.test.ts. Content that comes from the store's own API (page and
 * article bodies, product descriptions) is not routed through here — it is
 * the merchant's published content, formatted by the admin editor.
 */
import { safeHref } from './safe-href.ts'

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's', 'small', 'sup', 'sub', 'span', 'mark',
  'ul', 'ol', 'li',
  'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'code',
  'a',
])
const VOID_TAGS = new Set(['br', 'hr'])

/** The value of the `href` attribute inside a tag's attribute string, if any. */
function hrefOf(attrs: string): string | null {
  const m = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(attrs)
  if (!m) return null
  return m[1] ?? m[2] ?? m[3] ?? null
}

const escapeAttr = (v: string): string =>
  v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * `html` with every tag outside the allow-list removed (its text is kept),
 * every attribute removed, and `<a>` reduced to a safe `href`. Comments and
 * processing instructions are dropped whole. A non-string yields ''.
 */
export function sanitizeSettingHtml(html: unknown): string {
  if (typeof html !== 'string' || !html) return ''
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[!?][^>]*>/g, '')
    .replace(/<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9-]*)((?:\s[^>]*)?)>/g, (_whole, slash: string, rawName: string, attrs: string) => {
      const name = rawName.toLowerCase()
      if (!ALLOWED_TAGS.has(name)) return ''
      if (slash) return VOID_TAGS.has(name) ? '' : `</${name}>`
      if (name === 'a') {
        const href = safeHref(hrefOf(attrs))
        return href ? `<a href="${escapeAttr(href)}" rel="noopener">` : '<a>'
      }
      return `<${name}>`
    })
}
