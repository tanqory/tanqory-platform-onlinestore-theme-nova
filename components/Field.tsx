/**
 * Field — the shared form-control shell: label above, control, helper or error
 * below. One implementation so every form in the theme reports errors the same
 * way.
 *
 * The design: "label above, 13/500 · helper 13 Text Secondary · error 13
 * Critical with icon". The error also replaces the helper rather than stacking
 * under it, and is wired with `aria-describedby` + `aria-invalid` so a screen
 * reader hears it — the old inputs rendered error text as a loose sibling that
 * assistive tech never associated with the field.
 */
import { useId, type ReactNode } from 'react'
import { Select as SelectControl } from './Select'

export interface FieldShellProps {
  label?: string
  helper?: string
  error?: string
  required?: boolean
  /** Hide the label visually but keep it for assistive tech. */
  labelHidden?: boolean
  children: (props: {
    id: string
    'aria-describedby': string | undefined
    'aria-invalid': true | undefined
    'aria-required': true | undefined
  }) => ReactNode
}

export function Field({
  label,
  helper,
  error,
  required,
  labelHidden,
  children,
}: FieldShellProps): JSX.Element {
  const id = useId()
  const msgId = `${id}-msg`
  const message = error ?? helper
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      {label && (
        <label className={`field__label${labelHidden ? ' u-visually-hidden' : ''}`} htmlFor={id}>
          {label}
          {required && (
            <span className="field__required" aria-hidden>
              {' '}
              *
            </span>
          )}
        </label>
      )}
      {children({
        id,
        'aria-describedby': message ? msgId : undefined,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
      })}
      {message && (
        <p className={`field__msg${error ? ' field__msg--error' : ''}`} id={msgId} {...(error ? { role: 'alert' } : {})}>
          {error && (
            <span className="field__msg-icon" aria-hidden>
              !
            </span>
          )}
          {message}
        </p>
      )}
    </div>
  )
}

type InputOwnProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'>

export function Input({
  label,
  helper,
  error,
  required,
  labelHidden,
  ...rest
}: FieldOuter & InputOwnProps): JSX.Element {
  return (
    <Field label={label} helper={helper} error={error} required={required} labelHidden={labelHidden}>
      {(a) => <input className="field__input" {...a} {...rest} />}
    </Field>
  )
}

export function Textarea({
  label,
  helper,
  error,
  required,
  labelHidden,
  rows = 3,
  maxLength,
  value,
  showCount,
  ...rest
}: FieldOuter &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
    /** Character count bottom-right; needs `maxLength` to be meaningful. */
    showCount?: boolean
  }): JSX.Element {
  const used = typeof value === 'string' ? value.length : 0
  return (
    <Field label={label} helper={helper} error={error} required={required} labelHidden={labelHidden}>
      {(a) => (
        <span className="field__wrap">
          {/* Vertical resize only: horizontal resize breaks every layout it
              sits in, and the design pins it. */}
          <textarea className="field__input field__textarea" rows={rows} maxLength={maxLength} value={value} {...a} {...rest} />
          {showCount && maxLength && (
            <span className="field__count" aria-hidden>
              {used}/{maxLength}
            </span>
          )}
        </span>
      )}
    </Field>
  )
}

/**
 * Field-shell Select — label, helper and error around the design system's
 * Select. The body used to be a native `<select>` with a chevron painted over
 * it, which cannot draw the open panel the style system specifies. Nothing
 * consumed this, so the swap is safe.
 */
export function Select({
  label,
  helper,
  error,
  required,
  labelHidden,
  options,
  value,
  onChange,
}: FieldOuter & {
  options: { value: string; label: string; note?: string }[]
  value: string
  onChange: (value: string) => void
}): JSX.Element {
  return (
    <Field label={label} helper={helper} error={error} required={required} labelHidden={labelHidden}>
      {(a) => (
        <SelectControl
          id={typeof a.id === 'string' ? a.id : undefined}
          label={label ?? 'Select'}
          value={value}
          onChange={onChange}
          options={options}
          {...(typeof a['aria-describedby'] === 'string'
            ? { describedBy: a['aria-describedby'] }
            : {})}
          {...(a['aria-invalid'] ? { invalid: true } : {})}
        />
      )}
    </Field>
  )
}

interface FieldOuter {
  label?: string
  helper?: string
  error?: string
  required?: boolean
  labelHidden?: boolean
}

/** Checkbox and Radio share a shell: control first, label after, whole row clickable. */
function Choice({
  type,
  label,
  description,
  ...rest
}: { type: 'checkbox' | 'radio'; label: string; description?: string } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
>): JSX.Element {
  const id = useId()
  return (
    <div className={`choice choice--${type}${description ? ' choice--card' : ''}`}>
      <input className="choice__input" id={id} type={type} {...rest} />
      <label className="choice__label" htmlFor={id}>
        <span className="choice__text">{label}</span>
        {description && <span className="choice__desc">{description}</span>}
      </label>
    </div>
  )
}

export function Checkbox(props: Omit<Parameters<typeof Choice>[0], 'type'>): JSX.Element {
  return <Choice type="checkbox" {...props} />
}
export function Radio(props: Omit<Parameters<typeof Choice>[0], 'type'>): JSX.Element {
  return <Choice type="radio" {...props} />
}

/**
 * Toggle — applies immediately, no save step, per the design. Label sits on the
 * left and the state is announced as On/Off rather than relying on the visual
 * position of the knob.
 */
export function Toggle({
  label,
  checked,
  onChange,
  disabled,
  describedBy,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  describedBy?: string
}): JSX.Element {
  return (
    <div className="toggle">
      <span className="toggle__label" id={`${label}-lbl`}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${label}-lbl`}
        aria-describedby={describedBy}
        className="toggle__track"
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle__knob" aria-hidden />
        <span className="u-visually-hidden">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  )
}
