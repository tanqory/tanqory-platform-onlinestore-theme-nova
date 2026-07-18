import { defineSection, useData, type SectionProps } from '@tanqory/theme-kit'

/** SDL enum value → display label for a payment badge. */
const LABELS: Record<string, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  AMERICAN_EXPRESS: 'Amex',
  DISCOVER: 'Discover',
  DINERS_CLUB: 'Diners',
  JCB: 'JCB',
  ELO: 'Elo',
  PAYPAL: 'PayPal',
  APPLE_PAY: 'Apple Pay',
  GOOGLE_PAY: 'Google Pay',
  ANDROID_PAY: 'Google Pay',
  SHOPIFY_PAY: 'Shop Pay',
}

/**
 * PAYMENT ICONS block — accepted-payment badges (trust signal).
 *
 * When the merchant hasn't overridden `methods`, the list is derived from what
 * the store ACTUALLY accepts (`shop.paymentSettings`, from Settings → Payments)
 * — a PromptPay-only store shows no card badges instead of a hardcoded default
 * that would falsely promise Visa/Mastercard. Typing a `methods` string still
 * wins, for full control.
 */
export function PaymentIcons({ attributes }: SectionProps): JSX.Element {
  const data = useData()
  const override = ((attributes.methods as string) || '').trim()

  let list: string[]
  if (override) {
    list = override
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  } else {
    const pay = data.shop?.paymentSettings
    const codes = [...(pay?.acceptedCardBrands ?? []), ...(pay?.supportedDigitalWallets ?? [])]
    // De-dupe by display label (ANDROID_PAY + GOOGLE_PAY both → "Google Pay").
    list = [...new Set(codes.map((c) => LABELS[c] ?? c))]
  }

  if (list.length === 0) return <></>
  return (
    <div className="payment-icons" aria-label="Accepted payment methods">
      {list.map((m) => (
        <span key={m} className="payment-icon">
          {m}
        </span>
      ))}
    </div>
  )
}

export default defineSection({
  name: 'payment-icons',
  title: 'Payment icons',
  category: 'block',
  icon: '▭',
  attributes: {
    methods: {
      type: 'text',
      label: 'Methods (comma-separated — blank = what the store accepts)',
    },
  },
  component: PaymentIcons,
})
