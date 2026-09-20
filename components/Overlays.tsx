/**
 * Tooltip, Popover and Toast — the three transient overlays the theme had none
 * of. Grouped because they share the dismissal contract: Escape closes, focus
 * is handled explicitly, and nothing appears on hover alone.
 */
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'

/* ── Tooltip ──────────────────────────────────────────────────────────── */

/**
 * Appears on hover AND on focus. Hover-only tooltips are invisible to keyboard
 * users, which is why the design states both triggers.
 *
 * The tooltip is descriptive, never the only source of a control's name — an
 * icon button still needs its own `aria-label`.
 */
export function Tooltip({
  text,
  children,
  placement = 'top',
}: {
  text: string
  children: ReactNode
  placement?: 'top' | 'bottom'
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <span
      className={`tooltip tooltip--${placement}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      <span className="tooltip__bubble" role="tooltip" id={id} hidden={!open}>
        {text}
      </span>
    </span>
  )
}

/* ── Popover ──────────────────────────────────────────────────────────── */

/** Anchored, 8px offset, closes on Escape and outside click; focus moves inside. */
export function Popover({
  trigger,
  children,
  align = 'start',
  label,
}: {
  trigger: (p: { open: boolean; toggle: () => void; props: Record<string, unknown> }) => ReactNode
  /** A function child receives `close`, for panels that dismiss on choice. */
  children: ReactNode | ((p: { close: () => void }) => ReactNode)
  align?: 'start' | 'end'
  label: string
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()

  /** The element focus came FROM, so it can be given back on close. */
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    returnTo.current = document.activeElement as HTMLElement | null
    // Focus the panel so the next Tab lands inside it, not back in the page.
    panel.current?.focus()
    const onDown = (e: MouseEvent): void => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      /**
       * Give focus back to the trigger.
       *
       * The panel took focus on open and nothing returned it: pressing Escape
       * dropped focus to `<body>`, so the next Tab restarted at the top of the
       * page — while `Select`'s own header claimed "focus return" that did not
       * exist. Only restore when focus is still inside the popover, so a click
       * that moved focus somewhere deliberate is not yanked back.
       */
      const active = document.activeElement
      if (!active || active === document.body || root.current?.contains(active)) {
        returnTo.current?.focus?.()
      }
    }
  }, [open])

  const toggle = useCallback(() => setOpen((v) => !v), [])

  return (
    <div className="popover" ref={root}>
      {trigger({
        open,
        toggle,
        props: { 'aria-expanded': open, 'aria-haspopup': 'dialog', 'aria-controls': id, onClick: toggle },
      })}
      {open && (
        <div
          className={`popover__panel popover__panel--${align}`}
          id={id}
          ref={panel}
          role="dialog"
          aria-label={label}
          tabIndex={-1}
        >
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  )
}

/* ── Toast ────────────────────────────────────────────────────────────── */

export interface Toast {
  id: number
  message: string
  tone?: 'default' | 'error'
  /** e.g. an Undo action after removing a cart line. */
  action?: { label: string; onClick: () => void }
}

let nextId = 1
const listeners = new Set<(t: Toast | null) => void>()
let current: Toast | null = null

/**
 * Show a toast. Only ONE is visible at a time and a newer one replaces the
 * older, per the design — a stack of toasts covers the very content the
 * shopper is trying to act on.
 */
export function showToast(message: string, opts: Omit<Toast, 'id' | 'message'> = {}): number {
  const id = nextId
  nextId += 1
  current = { id, message, ...opts }
  listeners.forEach((l) => l(current))
  return id
}

export function dismissToast(): void {
  current = null
  listeners.forEach((l) => l(null))
}

/** Mount once, in the layout. `role=status` so it is announced, not focused. */
export function ToastHost(): JSX.Element | null {
  const [toast, setToast] = useState<Toast | null>(current)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    listeners.add(setToast)
    return () => {
      listeners.delete(setToast)
    }
  }, [])

  /**
   * Un-pause whenever a different toast takes over.
   *
   * `paused` is set on hover and cleared on mouse-leave — but if the shopper
   * hovers a toast and then clicks its × or Undo, the node unmounts and
   * `onMouseLeave`/`onBlur` never fire. `paused` latched true for the rest of
   * the session, so every later toast skipped `setTimeout` entirely and stayed
   * on screen forever.
   */
  useEffect(() => {
    setPaused(false)
  }, [toast?.id])

  useEffect(() => {
    if (!toast || paused) return
    // 5s, and the timer restarts when the shopper stops hovering — otherwise a
    // toast they paused to read vanishes the instant they move the mouse.
    const t = window.setTimeout(dismissToast, 5000)
    return () => window.clearTimeout(t)
  }, [toast, paused])

  if (!toast) return null
  return (
    <div className="toast-host">
      <div
        className={`toast toast--${toast.tone ?? 'default'}`}
        role="status"
        aria-live="polite"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <span className="toast__msg">{toast.message}</span>
        {toast.action && (
          <button
            type="button"
            className="toast__action"
            onClick={() => {
              toast.action?.onClick()
              dismissToast()
            }}
          >
            {toast.action.label}
          </button>
        )}
        <button type="button" className="toast__close" aria-label="Dismiss" onClick={dismissToast}>
          ×
        </button>
      </div>
    </div>
  )
}
