/**
 * QuantityStepper — the one quantity control.
 *
 * Three copies of this existed with three different class names
 * (`.quantity` on the PDP block, `.cart__qty` on the cart page, `.drawer__qty`
 * in the cart drawer) and three different behaviours: only one of them stopped
 * at the minimum, and only one announced the new value. They also disagreed on
 * hit area — the design requires 44px on every icon-only control.
 *
 * `min` defaults to 1 so the stepper can never reach 0; removing a line is a
 * separate, explicit action, not something a shopper falls into by holding the
 * minus button.
 */
export interface QuantityStepperProps {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  /** Accessible group label — say what is being counted where it isn't obvious. */
  label?: string
  size?: 'sm' | 'md'
  disabled?: boolean
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  label = 'Quantity',
  size = 'md',
  disabled = false,
}: QuantityStepperProps): JSX.Element {
  const atMin = value <= min
  const atMax = max !== undefined && value >= max

  return (
    <div className={`qty qty--${size}`} role="group" aria-label={label}>
      <button
        type="button"
        className="qty__btn"
        aria-label="Decrease quantity"
        disabled={disabled || atMin}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      {/* aria-live so the change is announced: the buttons keep focus, so a
          screen reader would otherwise never hear the number move. */}
      <span className="qty__value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="qty__btn"
        aria-label="Increase quantity"
        disabled={disabled || atMax}
        onClick={() => onChange(max === undefined ? value + 1 : Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  )
}
