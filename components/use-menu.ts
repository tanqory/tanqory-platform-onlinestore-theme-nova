import { useEffect, useState } from 'react'
import { useData, type Menu } from '@tanqory/theme-kit'

/**
 * Resolve a single menu by handle for the footer/header blocks. Seeds
 * synchronously from the data source's prefetched/mock menus (works offline +
 * in the editor) then upgrades from the live store via `fetchMenu` when a
 * backend is wired. Returns null while unresolved.
 */
export function useMenu(handle: string): Menu | null {
  const data = useData()
  const [menu, setMenu] = useState<Menu | null>(() => (handle ? data.menu?.(handle) ?? null : null))
  useEffect(() => {
    let cancelled = false
    setMenu(handle ? data.menu?.(handle) ?? null : null)
    if (handle && data.fetchMenu) {
      void data.fetchMenu(handle).then((m) => {
        if (!cancelled && m) setMenu(m)
      })
    }
    return () => {
      cancelled = true
    }
  }, [data, handle])
  return menu
}
