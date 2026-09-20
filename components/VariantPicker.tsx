/**
 * VariantPicker + Swatches + InventoryStatus — the purchase-column controls.
 *
 * The three states the design distinguishes, and that the theme conflated:
 *   selected   — Primary fill
 *   sold out   — strikethrough + muted, STILL SELECTABLE so the shopper can
 *                reach "Notify me"
 *   unavailable— dashed border: this combination does not exist at all
 *
 * Conflating the last two is why a shopper could pick a size that was merely
 * out of stock and get the same dead end as one that was never made.
 */
import { Select } from './Select'

export type OptionValueState = 'available' | 'sold-out' | 'unavailable'

export interface OptionValue {
  value: string
  state?: OptionValueState
  /** Hex or image url — turns the control into a swatch. */
  swatch?: string
}

export interface ProductOption {
  name: string
  values: OptionValue[]
  /** `buttons` | `swatches` | `select`; colour defaults to swatches. */
  style?: 'buttons' | 'swatches' | 'select'
}

/** ≥14 values is unreadable as buttons — the design switches to a Select. */
const SELECT_THRESHOLD = 14

export function VariantPicker({
  options,
  selected,
  onSelect,
  sizeGuideHref,
}: {
  options: ProductOption[]
  selected: Record<string, string>
  onSelect: (optionName: string, value: string) => void
  sizeGuideHref?: string
}): JSX.Element | null {
  if (options.length === 0) return null
  return (
    <div className="variants">
      {options.map((opt) => {
        const chosen = selected[opt.name]
        const auto = opt.values.some((v) => v.swatch) ? 'swatches' : 'buttons'
        const style =
          opt.style ?? (opt.values.length >= SELECT_THRESHOLD ? 'select' : auto)
        const isSize = /size/i.test(opt.name)

        return (
          <div className="variants__group" key={opt.name}>
            <div className="variants__head">
              <span className="variants__label">
                {opt.name}
                {chosen && <span className="variants__chosen"> — {chosen}</span>}
              </span>
              {isSize && sizeGuideHref && (
                <a className="variants__guide" href={sizeGuideHref}>
                  Size guide
                </a>
              )}
            </div>

            {style === 'select' ? (
              <Select
                label={opt.name}
                value={chosen ?? ''}
                onChange={(value) => onSelect(opt.name, value)}
                options={opt.values.map((v) => ({
                  value: v.value,
                  label: v.value,
                  note:
                    v.state === 'sold-out'
                      ? 'sold out'
                      : v.state === 'unavailable'
                        ? 'unavailable'
                        : undefined,
                }))}
              />
            ) : (
              <div
                className={`variants__values variants__values--${style}`}
                role="radiogroup"
                aria-label={opt.name}
              >
                {opt.values.map((v) => {
                  const state = v.state ?? 'available'
                  const active = chosen === v.value
                  return (
                    <button
                      key={v.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      /*
                       * NOTHING here is `disabled`. The design says "focus ring
                       * on all", and disabling the impossible combinations
                       * dead-ends a two-option product: from Red/S you could
                       * never reach Black/XL, because both Black/S and Red/XL
                       * are marked unavailable on the way. Selecting an
                       * unavailable value re-resolves the other options and the
                       * buy button reports "Unavailable" — which is the state
                       * the shopper needs to see, not a button they cannot press.
                       */
                      aria-label={
                        state === 'sold-out'
                          ? `${v.value} — sold out`
                          : state === 'unavailable'
                            ? `${v.value} — unavailable`
                            : v.value
                      }
                      className={`variant${active ? ' is-active' : ''} variant--${state}`}
                      data-style={style}
                      onClick={() => onSelect(opt.name, v.value)}
                    >
                      {style === 'swatches' && v.swatch ? (
                        <span
                          className="variant__swatch"
                          style={
                            v.swatch.startsWith('http') || v.swatch.startsWith('/')
                              ? { backgroundImage: `url(${v.swatch})` }
                              : { background: v.swatch }
                          }
                          aria-hidden
                        />
                      ) : (
                        v.value
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * InventoryStatus — "In stock" / "Low stock — 3 left" / "Sold out".
 * `low-only` is the default because a permanent "In stock" line is noise.
 */
export function InventoryStatus({
  available,
  quantity,
  threshold = 5,
  show = 'low-only',
}: {
  available: boolean
  /** Undefined when the shop does not track inventory. */
  quantity?: number
  threshold?: number
  show?: 'always' | 'low-only' | 'never'
}): JSX.Element | null {
  if (show === 'never') return null
  if (!available) {
    return (
      <p className="inventory inventory--out" role="status">
        Sold out
      </p>
    )
  }
  const low = quantity !== undefined && quantity > 0 && quantity <= threshold
  if (!low && show === 'low-only') return null
  return (
    <p className={`inventory inventory--${low ? 'low' : 'in'}`} role="status">
      {low ? `Low stock — ${quantity} left` : 'In stock'}
    </p>
  )
}
