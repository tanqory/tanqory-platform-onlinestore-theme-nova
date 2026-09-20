/**
 * Chip — interactive, unlike Badge. Filters and applied facets.
 *
 * A removable chip's × carries its own 44px hit area on touch: the design
 * calls this out because a 16px glyph inside a 28px chip is the classic
 * accidental-dismiss bug on mobile.
 */
export function Chip({
  label,
  selected = false,
  onSelect,
  onRemove,
  removeLabel,
}: {
  label: string
  selected?: boolean
  onSelect?: () => void
  /** When given, the chip renders a × that removes it. */
  onRemove?: () => void
  /** Accessible name for the ×; defaults to `Remove <label>`. */
  removeLabel?: string
}): JSX.Element {
  const Tag = onSelect ? 'button' : 'span'
  return (
    <span className={`chip${selected ? ' chip--selected' : ''}`}>
      <Tag
        {...(onSelect ? { type: 'button' as const, onClick: onSelect, 'aria-pressed': selected } : {})}
        className="chip__label"
      >
        {label}
      </Tag>
      {onRemove && (
        <button
          type="button"
          className="chip__remove"
          aria-label={removeLabel ?? `Remove ${label}`}
          onClick={onRemove}
        >
          <span aria-hidden>×</span>
        </button>
      )}
    </span>
  )
}
