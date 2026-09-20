/**
 * Money — alias of `Price`, kept so existing imports keep working.
 *
 * The two were functionally identical apart from nullability and a default
 * class name, and neither class had any CSS. `Price` is now the one
 * implementation; prefer importing it directly in new code.
 */
export { Price as Money } from './Price'
export type { PriceProps as MoneyProps } from './Price'
