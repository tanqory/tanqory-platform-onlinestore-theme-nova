import { useEffect, useRef, type ReactNode } from 'react'
import { closeOverlay } from './useOverlayChannel'
import { inertWhenClosed } from './inert'

/**
 * Centered modal surface used by `<SearchModal>`. Same focus/scroll/ESC
 * semantics as `<Drawer>` but anchored to the viewport centre and capped at
 * `maxWidth` instead of stretching to a side.
 *
 * The shared dim+blur backdrop comes from the `.overlay` class — overlay
 * tokens (z-index, transition timing) live in one place in styles.css.
 */
const SIZES = { sm: '480px', md: '640px', lg: '800px' } as const

export function Modal({
  open,
  maxWidth,
  size = 'md',
  ariaLabel,
  title,
  footer,
  onClose,
  children,
}: {
  open: boolean
  /** Escape hatch; prefer `size`, which carries the design's three widths. */
  maxWidth?: string
  /** 480 / 640 / 800, per the design. */
  size?: 'sm' | 'md' | 'lg'
  /** Required unless `title` is given — a dialog must have an accessible name. */
  ariaLabel?: string
  /** Renders a sticky header with a close button; also names the dialog. */
  title?: string
  /** Sticky footer (actions); the body between header and footer scrolls. */
  footer?: ReactNode
  /** Defaults to the global overlay channel, which is what SearchModal uses. */
  onClose?: () => void
  children: ReactNode
}): JSX.Element {
  const close = onClose ?? closeOverlay
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null
      const id = window.requestAnimationFrame(() => {
        const first = panelRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        first?.focus()
      })
      return () => window.cancelAnimationFrame(id)
    }
    previouslyFocused.current?.focus?.()
    return undefined
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <div
      className={`overlay overlay--center ${open ? 'overlay--open' : ''}`}
      {...inertWhenClosed(open)}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div
        ref={panelRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        style={{ maxWidth: maxWidth ?? SIZES[size] }}
      >
        {/* Drag handle — purely a bottom-sheet affordance on mobile; hidden
            above 768 where the panel is a centred dialog. */}
        <span className="modal__handle" aria-hidden />
        {title && (
          <header className="modal__header">
            <h2 className="modal__title">{title}</h2>
            <button type="button" className="modal__close" aria-label="Close" onClick={close}>
              ×
            </button>
          </header>
        )}
        {/* Only the body scrolls; header and footer stay put. */}
        {/* The body scrolls, so it needs to be reachable by keyboard: someone
            who cannot drag still has to get to the bottom of a long panel or a
            zoomed photograph. The arrow keys scroll it once focus lands. */}
        <div
          className={title || footer ? 'modal__body' : undefined}
          tabIndex={0}
          role="group"
          aria-label={ariaLabel ?? title ?? 'Dialog content'}
        >
          {children}
        </div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  )
}
