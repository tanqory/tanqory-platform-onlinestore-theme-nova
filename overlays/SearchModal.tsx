import { useEffect, useMemo, useRef, useState } from 'react'
import { useData, type Product } from '@tanqory/theme-kit'
import { Modal } from '../components/Modal'
import { ImageResponsive } from '../components/ImageResponsive'
import { Money } from '../components/Money'
import { useOverlay } from '../components/useOverlayChannel'

interface SearchModalProps {
  placeholder: string
  ctaLabel: string
  maxWidth: string
  debounceMs: number
  maxResults: number
}

/**
 * Predictive search overlay — replaces a full page navigation to `/search`
 * with an instant, debounced search-as-you-type experience.
 *
 * Searches the shop through the storefront search endpoint, the same one the
 * /search page uses.
 *
 * It used to filter only the product list already bootstrapped into the page.
 * On a live store that set is a handful of products, so the header search —
 * the main way a shopper looks for something — answered "No matches" for
 * things the shop plainly sells: 0 results for "blazer" and 0 for "book" while
 * /search returned 6 and 3. The in-memory filter is kept as the fallback for
 * offline development and the editor preview, where there is no endpoint.
 */
export function SearchModal(props: SearchModalProps): JSX.Element {
  const open = useOverlay('search')
  const data = useData()
  const { placeholder, ctaLabel, maxWidth, debounceMs, maxResults } = props

  const [term, setTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset on close so reopening starts clean.
  useEffect(() => {
    if (!open) {
      setTerm('')
      setDebouncedTerm('')
    }
  }, [open])

  // Focus the input when the overlay OPENS — not via the autoFocus
  // attribute, which fires at mount while the modal is still hidden
  // (Modal stays mounted with aria-hidden). That mount-time focus both
  // tripped Chrome's cross-origin-iframe autofocus block (red console
  // error on every page load inside the editor canvas) and parked focus
  // inside an aria-hidden subtree (WAI-ARIA violation warning).
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Debounce the input so we don't filter on every keystroke. Important when
  // the catalogue is larger and the filter becomes non-trivial.
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedTerm(term.trim()), debounceMs)
    return () => window.clearTimeout(id)
  }, [term, debounceMs])

  // Flatten products across collections + dedupe by handle. Same canonical
  // product takes its first collection appearance (matches the bootstrap
  // dedup in createMockData).
  const allProducts = useMemo(() => {
    const seen = new Set<string>()
    const out: ReturnType<typeof data.allCollections>[number]['products'] = []
    for (const c of data.allCollections()) {
      for (const p of c.products) {
        if (!seen.has(p.handle)) {
          seen.add(p.handle)
          out.push(p)
        }
      }
    }
    return out
  }, [data])

  /** What the in-memory list can answer — the fallback, and what shows while
   *  the request is in flight so the panel never flashes "no matches". */
  const localResults = useMemo(() => {
    if (!debouncedTerm) return []
    const q = debouncedTerm.toLowerCase()
    return allProducts.filter((p) => p.title.toLowerCase().includes(q)).slice(0, maxResults)
  }, [allProducts, debouncedTerm, maxResults])

  const search = data.search
  // Results carry the term they answered. Holding bare products let the
  // previous query's hits render under the new query's heading: type "shirt",
  // wait, then type "hat", and the panel showed shirts labelled "hat" while
  // the new request was still open — and `pending` was false, because `remote`
  // was not null.
  const [remote, setRemote] = useState<{ term: string; products: Product[] } | null>(null)
  const [searching, setSearching] = useState(false)
  useEffect(() => {
    if (!debouncedTerm || !search) {
      setRemote(null)
      setSearching(false)
      return
    }
    let cancelled = false
    setSearching(true)
    void search(debouncedTerm, { first: maxResults, types: ['PRODUCT'] })
      .then((r) => {
        if (!cancelled) setRemote({ term: debouncedTerm, products: r.products ?? [] })
      })
      // A failed lookup falls back to whatever is in memory rather than
      // claiming the shop has nothing.
      .catch(() => {
        if (!cancelled) setRemote(null)
      })
      .finally(() => {
        if (!cancelled) setSearching(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedTerm, search, maxResults])

  const fresh = remote && remote.term === debouncedTerm ? remote.products : null
  const results = (fresh ?? localResults).slice(0, maxResults)
  // "No matches" is only true once the lookup has finished. Saying it while a
  // request is still open is the same wrong answer, just earlier.
  const pending = searching && fresh === null && localResults.length === 0

  return (
    <Modal open={open} maxWidth={maxWidth} ariaLabel="Search">
      <div className="search-modal">
        <label className="search-modal__field">
          <span className="visually-hidden">Search</span>
          <input
            ref={inputRef}
            type="search"
            className="search-modal__input"
            placeholder={placeholder}
            value={term}
            onChange={(e) => setTerm(e.currentTarget.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {term && (
            <button
              type="button"
              className="search-modal__clear"
              aria-label="Clear search"
              onClick={() => setTerm('')}
            >
              ✕
            </button>
          )}
        </label>

        {debouncedTerm && (
          <div className="search-modal__results" role="listbox" aria-label="Search results">
            {pending ? (
              <p className="search-modal__empty u-text-muted" role="status">Searching…</p>
            ) : results.length === 0 ? (
              <p className="search-modal__empty u-text-muted">No matches for “{debouncedTerm}”.</p>
            ) : (
              <>
                <ul>
                  {results.map((p) => (
                    <li key={p.handle} role="option" aria-selected="false">
                      <a className="search-modal__hit" href={`/products/${p.handle}`}>
                        <div className="search-modal__thumb">
                          <ImageResponsive
                            src={p.featuredImage?.url}
                            alt={p.featuredImage?.altText ?? p.title}
                          />
                        </div>
                        <div className="search-modal__hit-body">
                          <strong className="search-modal__hit-title">{p.title}</strong>
                          <Money value={p.price} />
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
                <a href={`/search?q=${encodeURIComponent(debouncedTerm)}`} className="search-modal__cta">
                  {ctaLabel}
                </a>
              </>
            )}
          </div>
        )}

        {!debouncedTerm && (
          <p className="search-modal__hint u-text-muted">
            Type to search products, collections, and pages. <kbd>Esc</kbd> to close.
          </p>
        )}
      </div>
    </Modal>
  )
}

export default SearchModal
