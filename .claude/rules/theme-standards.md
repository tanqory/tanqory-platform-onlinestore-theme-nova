# Nova theme standards

**Always loaded.** The invariants that have each been broken at least once and
cost real time. Each links to the skill that carries the ✅/❌ patterns.

## The invariants

| # | Invariant | Rule |
|---|-----------|------|
| 1 | **A declared setting is a promise** | Every key in a section's `attributes` must be read by that section (or its own imports). `pnpm check:inert` enforces it. A control the editor shows that changes nothing is worse than no control. |
| 2 | **`.tsx` = code, `.json` = data** | Never hand-edit `theme.manifest.json` — regenerate with `pnpm manifest`. `templates/*.json` is merchant starter content, not code. |
| 3 | **The design package is the source of truth** | `design/` is authoritative; `design/spec/*.json` is generated from it by `scripts/extract-design-spec.mjs`. Never hand-edit a spec file. Deviating is allowed — recording it in `docs/DESIGN-GAPS.md` is not optional. |
| 4 | **Semantic, never raw** | A merchant picks `buttonRadius: 'pill'`, never `19px`. `lib/theme-settings.ts` is the ONE place a semantic choice becomes a token. No raw hex or magic numbers in `styles.css`. |
| 5 | **Renaming orphans merchant content** | A key OR value rename needs an entry in `scripts/migrate-content.mjs` (`RENAMES` / `VALUE_RENAMES`), which are append-only. A value no longer in a select silently falls back to the default. |
| 6 | **SPA soft-nav reuses the component** | Reset or key every piece of fetched state to the route it came from. This is the single largest bug class in this theme. |
| 7 | **Starter content ships to every store** | Only `all` is guaranteed to exist. Never state a policy on the merchant's behalf — no shipping, returns or materials claims in defaults, presets or templates. |
| 8 | **A green gate is not proof** | When a gate is green and the behaviour is wrong, suspect the gate. Three dead controls shipped behind a passing `check:inert`. |
| 9 | **The header and footer live once** | `groups/header.json` / `groups/footer.json` are the source of truth; templates bind them or carry an explicit `override`. Pages resolve ONLY through the kit's `resolvePageSections` / `resolvePage` — runtime, studio-api, editor and AI share it. A section's `role` / `area` / `requiresContext` is its placement contract; `category` is not. |

## Before you finish

```bash
pnpm verify        # every static gate
pnpm verify:live   # a11y + layout, needs `pnpm dev` running
```

`verify` passing says nothing about whether a field collapsed to 34px or a
button lost its accessible name. Both have happened; both were caught only by
`verify:live`.

## Skills

- Building or changing a section → `theme-section`
- Working against `design/` → `design-fidelity`
- Data, routing, async, a11y → `storefront-correctness`
