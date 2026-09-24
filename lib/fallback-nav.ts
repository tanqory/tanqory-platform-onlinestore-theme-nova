/**
 * The header/drawer navigation a store shows before its main menu is set up.
 *
 * Only `/collections/all` is guaranteed to exist on every store (see
 * CLAUDE.md, "Starter content ships to every store"), and `/collections` is a
 * route of this theme — so those are the only two fallback destinations. The
 * earlier list also linked `/pages/about` and `/pages/journal`, which a new
 * store does not have: two of the four header links 404ed until the merchant
 * created a menu. Shared by layouts/layout.tsx and overlays/MobileNavDrawer.tsx
 * so the two cannot drift.
 */
export interface NavItem {
  title: string
  url: string
}

export function fallbackNav(t: (key: string, fallback?: string) => string): NavItem[] {
  return [
    { title: t('nav.shop', 'Shop'), url: '/collections/all' },
    { title: t('nav.collections', 'Collections'), url: '/collections' },
  ]
}
