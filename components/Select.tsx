import { useEffect, useState } from 'react'
import { Popover } from './Overlays'

/**
 * The design system's Select — a control plus a panel it draws itself.
 *
 * The theme had no such thing. `Field.Select` and the locale switcher were
 * native `<select>` elements with a chevron painted over them, which cannot
 * render the "Select open" state the style system specifies: a panel with its
 * own border, radius and shadow, options at 10/12px, and the current value
 * marked with a tick on a Surface Secondary row.
 *
 * Built on the existing Popover, so outside-click, Escape and focus return are
 * the same behaviour the sort menu already uses rather than a second copy.
 */
/** Move DOM focus to the nth option inside a listbox. */
function focusOption(list: HTMLElement, index: number): void {
  const rows = list.querySelectorAll<HTMLButtonElement>('.select__option')
  rows[index]?.focus()
}

export interface SelectOption {
  value: string
  label: string
  /** Optional trailing note — a currency code, a count. */
  note?: string
}

export function Select({
  options,
  value,
  onChange,
  label,
  id,
  align = 'start',
  describedBy,
  invalid,
  disabled,
}: {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  /** Accessible name. Rendered by the caller when it wants a visible label. */
  label: string
  id?: string
  align?: 'start' | 'end'
  /** Wiring from a field shell: the helper/error text that describes this control. */
  describedBy?: string
  /** Marks the control invalid so assistive tech announces the error. */
  invalid?: boolean
  disabled?: boolean
}): JSX.Element {
  const current = options.find((o) => o.value === value) ?? options[0]
  const [active, setActive] = useState(() => Math.max(0, options.findIndex((o) => o.value === value)))

  // Keep the highlighted row in step when the value changes from elsewhere —
  // the country switcher also writes it from the URL and localStorage.
  useEffect(() => {
    const i = options.findIndex((o) => o.value === value)
    if (i >= 0) setActive(i)
  }, [value, options])

  /**
   * Put focus on the selected row, not on the panel.
   *
   * The popover focuses its own panel so the next Tab lands inside it. On a
   * listbox that draws the focus ring around the whole box, which reads as a
   * heavy black outline rather than a menu.
   *
   * A callback ref, not an effect: the list only exists while the panel is
   * open, and an effect keyed on props would not re-run when it opens. The
   * frame delay lets the popover finish focusing the panel first, otherwise it
   * takes focus straight back.
   */
  const attachList = (node: HTMLDivElement | null): void => {
    if (!node) return
    requestAnimationFrame(() => {
      const rows = node.querySelectorAll<HTMLElement>('[role="option"]')
      rows[Math.max(0, options.findIndex((o) => o.value === value))]?.focus()
    })
  }

  return (
    <Popover
      align={align}
      label={label}
      trigger={({ open, toggle, props }) => (
        <button
          type="button"
          id={id}
          className="select__control"
          /* The name has to CONTAIN the visible text (WCAG 2.5.3, "Label in
             Name"). `aria-label={label}` announced "Language" over a control
             reading "English", so anyone using voice control could not say
             what they saw. */
          aria-label={current ? `${label}: ${current.label}${current.note ? ' ' + current.note : ''}` : label}
          aria-haspopup="listbox"
          aria-expanded={open}
          {...(describedBy ? { 'aria-describedby': describedBy } : {})}
          {...(invalid ? { 'aria-invalid': true } : {})}
          data-open={open || undefined}
          disabled={disabled}
          onClick={toggle}
          onKeyDown={(e) => {
            // Opening with the keyboard is how a native select behaves, and
            // losing it was the main risk in replacing one.
            if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              toggle()
            }
          }}
          {...props}
        >
          <span className="select__value">
            {current?.label}
            {current?.note && <span className="select__note"> · {current.note}</span>}
          </span>
          <span className="select__chevron" aria-hidden />
        </button>
      )}
    >
      {({ close }) => (
        <div
          className="select__list"
          role="listbox"
          aria-label={label}
          ref={attachList}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              const next = (active + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
              setActive(next)
              // Move real focus, not just the highlight. Arrow keys used to
              // change only `active` while the focus ring and the screen
              // reader's cursor stayed on the original row, so Enter appeared
              // to pick a different option than the one in focus.
              focusOption(e.currentTarget, next)
            } else if (e.key === 'Enter' || e.key === ' ') {
              // The focused option's own button handles activation; let it.
              return
            }
          }}
        >
          {options.map((o, i) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className="select__option"
              data-active={i === active || undefined}
              // Hover highlights, but no longer re-targets what Enter picks:
              // the keyboard follows focus, and focus follows the arrow keys.
              onMouseEnter={() => setActive(i)}
              onClick={() => {
                onChange(o.value)
                // The panel used to stay open over the results with
                // `aria-expanded="true"` after a choice was made.
                close()
              }}
            >
              <span>
                {o.label}
                {o.note && <span className="select__note"> · {o.note}</span>}
              </span>
              {o.value === value && <span className="select__tick" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </Popover>
  )
}
