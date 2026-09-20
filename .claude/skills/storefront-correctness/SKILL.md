---
name: storefront-correctness
description: The recurring bug classes in the Nova storefront — SPA soft-navigation state, async races and cancellation, the bootstrap cache vs live data, money precision, and the accessibility traps. Load this before writing any section that fetches, any component with async state, or any interactive primitive.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Storefront correctness

Every pattern here comes from a defect that shipped past `typecheck` and a
passing test suite. They cluster into five shapes; learn the shape and you stop
writing the whole family.

The always-loaded invariants are in `.claude/rules/theme-standards.md`.

## 1. SPA soft navigation reuses the component

Soft nav is **on by default** (`layouts/layout.tsx`). Two collection URLs share
one template, so React keeps the same instance and your state survives a
navigation it should not have survived. This produced six separate findings.

### ❌ State that settles once and never resets

```tsx
const [resolved, setResolved] = useState({ settled: false, failed: false, count: 0 })
const notFound = !cached && resolved.settled && !resolved.failed && resolved.count === 0
```

Visit a collection that is legitimately empty, click to one that is not in the
bootstrap cache, and `notFound` is true on the first render — so the body never
mounts, never reports, and the page is stuck on "Collection not found" forever.

### ✅ Key the resolution to what produced it

```tsx
// sections/MainCollection.tsx:54
const [resolved, setResolved] = useState({ handle, settled: false, failed: false, count: 0 })
const settledForThisHandle = resolved.handle === handle
const notFound = !cached && settledForThisHandle && resolved.settled && resolved.count === 0
```

### ✅ Or clear before the new request

```tsx
// sections/ArticleBody.tsx — a soft-nav between two articles reuses the instance
setArticle(null)
setLoaded(false)
```

Without it the previous article's title, hero image, tags and
`dangerouslySetInnerHTML` body render under the new URL until the second
response lands — a visibly wrong article, not a loading state, and permanent if
the fetch fails.

### ✅ The router tracks pathname AND search

`useSoftRoute` holds `pathname + search`. Tracking the pathname alone meant
`/search?q=shirt` → `/search?q=hat` pushed the URL and re-rendered nothing.
`lib/head.ts` and `emitRoute` take the bare pathname; split once, at the top.

### ✅ The head must CLEAR, not skip

```tsx
// lib/head.ts:162 — a tag the new page has no value for is removed
if (!content) {
  if (existing && existing.getAttribute('data-tq-head') === 'true') existing.remove()
  return
}
```

Skipping empty values left a product's `og:image` and `og:description` on the
next page, so sharing that URL previewed the product you had just left.

## 2. Async results must carry what they answered

### ❌ Bare results

```tsx
const [remote, setRemote] = useState<Product[] | null>(null)
const results = remote ?? localResults          // whose results are these?
```

Type "shirt", wait, type "hat": shirts render under the "hat" heading while the
new request is open, and `pending` is false because `remote` is not null.

### ✅ Tag them

```tsx
// overlays/SearchModal.tsx:122
const [remote, setRemote] = useState<{ term: string; products: Product[] } | null>(null)
const fresh = remote && remote.term === debouncedTerm ? remote.products : null
const pending = searching && fresh === null && localResults.length === 0
```

Same shape at `sections/SearchResults.tsx:83`, keyed on `q`.

### ✅ A generation counter for overlapping loads

```tsx
// components/CollectionBody.tsx:84
const requestId = useRef(0)
const load = useCallback(async (after: string | null) => {
  const id = ++requestId.current
  try {
    const res = await collectionProducts(handle, { first: productsPerPage, sortKey, reverse })
    if (id !== requestId.current) return        // a newer request won
    setPages((prev) => (after ? [...prev, cards] : [cards]))
  } catch (err) {
    if (id !== requestId.current) return
    setFailed(true)
  } finally {
    if (id === requestId.current) setLoading(false)
  }
}, [collectionProducts, handle, productsPerPage, sort])
```

A `cancelled` boolean per effect is not enough when the same function is called
again from a click: whichever response lands last wins, corrupting `cursor` and
`hasNext` so every later page comes from the wrong place.

### ✅ Guard every path that triggers a load

The "Load more" button had `disabled={loading}`; the pagination control did not,
so a double click fired two requests on the **same cursor** and appended the
identical slice twice — duplicate products, duplicate React keys, a phantom
page.

### ✅ One in-flight slot per thing, not per component

```tsx
// sections/CartItems.tsx:74
const [busy, setBusy] = useState<ReadonlySet<string>>(() => new Set())
// …updating={busy.has(l.id)}
```

A single `string | null` cleared in `finally` released line B while B's request
was still open, because A's response happened to land second.

## 3. The bootstrap cache is not live data

It is baked at **build time**. A collection whose products were assigned after
the last build sits in it as an empty shell.

```tsx
// sections/FeaturedCollection.tsx:57
const cacheUsable = Boolean(cached && cachedProducts.length > 0)
// cache hit WITH products → instant paint; empty or missing → live fetch
```

❌ And a failed fetch must not fall back to it:

```tsx
const fetched = loaded.length > 0 ? loaded : seed        // hides the failure
```

✅ `components/CollectionBody.tsx`:

```tsx
const fetched = loaded.length > 0 ? loaded : failed ? [] : seed
```

The seed is right for first paint while the request is open. After a failure it
shows stale products with a wrong count, reports `count > 0` upward, and makes
the error branch unreachable for any collection the bootstrap knew.

## 4. Money and formatting

❌ `toFixed(2)` on a currency amount. JPY and KRW have zero decimals, KWD and
BHD have three — a struck-through `¥5000.00` beside a correct `¥4500`, or a
silently rounded figure whose "savings" no longer match the allocations.

✅ Keep the source's own precision:

```tsx
const decimals = (line.lineSubtotal.amount.split('.')[1] ?? '').length
return { amount: (Number(line.lineSubtotal.amount) + off).toFixed(decimals), … }
```

Prefer the kit's `formatMoney` / `formatMoneyWithCurrency` where you are
rendering, not computing.

## 5. Accessibility traps

| ❌ | ✅ | Why |
|---|---|---|
| `visibility: hidden` on a button's label while loading | `opacity: 0` | `visibility: hidden` removes the node from the accessibility tree, leaving the button with **no accessible name** |
| `role="region"` on every accordion panel | opt in per accordion (`landmarks` prop) | The filters render the same facets twice (sidebar + drawer), so each became two identically-named landmarks. APG advises against landmark proliferation |
| Arrow keys moving a highlight index only | move real DOM focus too | Focus ring and screen-reader cursor stayed on the old row while Enter picked a different one |
| A popover that focuses its panel and never gives focus back | restore to the trigger on close | Escape dropped focus to `<body>`, so the next Tab restarted at the top of the page |
| Error text rendered beside a control with no `aria-describedby` / `aria-invalid` | forward both through the field shell | `.field--error .field__input` does not match `.select__control` |
| A loading region with no `aria-busy` | set it | Assistive tech reads a half-built list as the finished one |
| Reading `window.location` during render | resolve in an effect after mount | SSG has no `window`, so the element TYPE differed between passes — a hydration mismatch on the page's `h1` |

## 6. Hover-pause is not the pause button

```tsx
// sections/Slideshow.tsx — two flags, not one
const [stopped, setStopped] = useState(false)   // the explicit control
const [hovered, setHovered] = useState(false)   // pointer is over the section
const paused = stopped || hovered
```

Sharing one flag meant the control lived inside the hovered region, so it always
read "Resume" and clicking it **started** autoplay — a WCAG 2.2.2 control that
does not hold.

Same shape for a toast: reset `paused` when a new toast arrives. Hovering a
toast then clicking its × unmounts the node, so `onMouseLeave` never fires and
the flag latches true for the rest of the session.

## 7. Route context is declared, not assumed

A section that reads the current product, collection, article, blog, page, cart
or search query must say so in its schema:

```tsx
export default defineSection({ name: 'product-details', role: 'section', requiresContext: ['product'], … })
```

The route table (`lib/routes.ts`) decides which template a URL gets; the
template's slug decides which context exists (`product`, `product.bundle` →
`product`; `collection.featured` → `collection`). A unit whose
`requiresContext` the template cannot satisfy is hidden from the editor's
picker there and refused on save (`missing_context`) — so a section that reads
route data **without** declaring it is the one that ends up rendering an empty
state on the wrong page. Guard the data anyway (`if (!product) return <StateBlock …/>`):
an offline or editor payload may still not have it.

The header and footer are resolved per page from `groups/` (or a template's
override) by the kit — a layout component must not assume it is the same node
on every route, and must not cache per-node state across a soft navigation
(see §1).

## Verifying

```bash
pnpm verify        # static gates
pnpm dev &
pnpm verify:live   # a11y (10 routes, two scans) + layout (4 routes × 4 widths)
```

Neither `typecheck` nor the test suite catches a collapsed field or a lost
accessible name — both shipped green and were caught only by `verify:live`.
When you change structure, run it.
