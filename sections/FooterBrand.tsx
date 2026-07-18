import { defineSection, useBoundText, useData, useSettings, type SectionProps } from '@tanqory/theme-kit'

/**
 * Footer BLOCK — brand column (logo/name + tagline). Data-driven: name falls
 * back to the store name, tagline to the merchant's brand slogan (Settings →
 * Brand) and then the store description, so an empty block still renders the
 * real brand. Both fields accept a DYNAMIC SOURCE (⛁) — e.g. bind the tagline to
 * shop.metafields.custom.tagline.
 */
export function FooterBrand({ attributes }: SectionProps): JSX.Element {
  const data = useData()
  const settings = useSettings()
  const boundTitle = useBoundText(attributes.title)
  const boundTagline = useBoundText(attributes.tagline)
  const name =
    (boundTitle || (settings.shopName as string) || '').trim() ||
    data.shop?.name?.trim() ||
    'Your store'
  // Precedence: an explicit block tagline, then the brand slogan the merchant
  // set in Settings → Brand (it reaches the SDL but nothing rendered it — a
  // SAVED_ONLY the brand audit flagged, store#510), then the store description.
  const tagline =
    boundTagline ||
    (data.shop?.brand?.slogan as string | undefined) ||
    (data.shop?.description as string) ||
    ''
  // Merchant contact from Settings → General (store#513) — shown when set so the
  // footer carries a real support email/phone, not a hardcoded one.
  const email = (data.shop?.email as string | undefined)?.trim()
  const phone = (data.shop?.phone as string | undefined)?.trim()
  return (
    <div className="site-footer__brand">
      <h2>{name}</h2>
      {tagline && <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '36ch' }}>{tagline}</p>}
      {(email || phone) && (
        <p className="site-footer__contact" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {email && (
            <a href={`mailto:${email}`} style={{ color: 'inherit' }}>
              {email}
            </a>
          )}
          {email && phone && <span aria-hidden> · </span>}
          {phone && (
            <a href={`tel:${phone}`} style={{ color: 'inherit' }}>
              {phone}
            </a>
          )}
        </p>
      )}
    </div>
  )
}

export default defineSection({
  name: 'footer-brand',
  title: 'Brand information',
  category: 'block',
  icon: '◈',
  attributes: {
    title: { type: 'text', label: 'Brand name (blank = store name)', dynamic: true },
    tagline: { type: 'textarea', label: 'Tagline (blank = store description)', dynamic: true },
  },
  component: FooterBrand,
})
