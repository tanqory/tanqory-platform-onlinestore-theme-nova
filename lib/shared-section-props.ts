/**
 * Shared section props — Level 3 of the approved configuration API.
 *
 * `06 Configuration System` defines eleven props and says: "Every section
 * exposes these (unless marked n/a in 05)." They were declared on 0–6 of the
 * theme's sections, and `spacingTop`, `spacingBottom`, `headerSize`,
 * `hideOnMobile` and `anchorId` on none at all — so a merchant could not set a
 * section's own spacing anywhere in the theme, although the token ladder for it
 * has been correct since the conversion.
 *
 * Declared once here so the vocabulary has a single definition. `05` overrides
 * `06` where a section's default differs, so a section's own declaration always
 * wins over the shared one.
 */

import type { AttrSpec } from '@tanqory/theme-kit'

const SPACING = [
  { value: 'none', label: 'None' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xl', label: 'Extra large' },
]

/** The design's eleven, expanded to thirteen: `heading / eyebrow / description`
 *  is one row describing three separate SectionHeader slots. */
export const SHARED_ATTRIBUTES: Record<string, AttrSpec> = {
  sectionWidth: {
    type: 'select',
    group: 'Layout',
    label: 'Section width',
    default: 'wide',
    options: [
      { value: 'standard', label: 'Standard (1200)' },
      { value: 'wide', label: 'Wide (1440)' },
      { value: 'full', label: 'Full width' },
    ],
  },
  contentWidth: {
    type: 'select',
    group: 'Layout',
    label: 'Content width',
    default: 'content',
    options: [
      { value: 'narrow', label: 'Narrow (560)' },
      { value: 'content', label: 'Content (840)' },
      { value: 'standard', label: 'Standard (1200)' },
    ],
  },
  contentAlignment: {
    type: 'select',
    group: 'Layout',
    label: 'Content alignment',
    default: 'left',
    options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
    ],
  },
  spacingTop: {
    type: 'select',
    group: 'Spacing',
    label: 'Spacing above',
    default: 'medium',
    options: SPACING,
    info: 'Medium is 64 desktop / 48 tablet / 40 mobile.',
  },
  spacingBottom: {
    type: 'select',
    group: 'Spacing',
    label: 'Spacing below',
    default: 'medium',
    options: SPACING,
  },
  background: {
    type: 'select',
    group: 'Appearance',
    label: 'Background',
    default: 'surface',
    options: [
      { value: 'surface', label: 'Surface' },
      { value: 'surface-secondary', label: 'Surface secondary' },
      { value: 'primary', label: 'Primary' },
    ],
  },
  heading: { type: 'text', group: 'Content', label: 'Heading' },
  eyebrow: { type: 'text', group: 'Content', label: 'Eyebrow' },
  description: { type: 'textarea', group: 'Content', label: 'Description' },
  headerSize: {
    type: 'select',
    group: 'Appearance',
    label: 'Heading size',
    default: 'medium',
    options: [
      { value: 'small', label: 'Small (H3)' },
      { value: 'medium', label: 'Medium (H2)' },
      { value: 'large', label: 'Large (H1)' },
    ],
  },
  mobileContentAlignment: {
    type: 'select',
    group: 'Mobile',
    label: 'Mobile alignment',
    default: 'inherit',
    options: [
      { value: 'inherit', label: 'Same as desktop' },
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
    ],
  },
  hideOnMobile: {
    type: 'boolean',
    group: 'Mobile',
    label: 'Hide on mobile',
    default: false,
    info: 'Suppresses the section below 768px.',
  },
  anchorId: {
    type: 'text',
    group: 'Advanced',
    label: 'Anchor ID',
    info: 'Makes the section an in-page link target, e.g. #shipping.',
  },
}

/**
 * The three SectionHeader content slots. They are shared vocabulary, but a
 * section that renders no header must not declare them: a declared setting
 * that nothing reads is exactly what `check-inert-settings` exists to stop, so
 * blanket-adding them would trade one broken promise for another. Sections
 * that render a `SectionHead` declare them explicitly.
 */
export const CONTENT_SLOTS = ['heading', 'eyebrow', 'description'] as const

/**
 * Merge the shared vocabulary into a section's own attributes.
 *
 * `own` wins: `05 Handoff Notes` restates a shared prop exactly when the
 * section's default differs from the shared one, and that restatement is the
 * authority. `omit` covers the design's "unless marked n/a in 05".
 */
export function withShared(
  own: Record<string, AttrSpec>,
  omit: readonly string[] = [],
): Record<string, AttrSpec> {
  const out: Record<string, AttrSpec> = {}
  for (const [key, spec] of Object.entries(SHARED_ATTRIBUTES)) {
    if (omit.includes(key)) continue
    if ((CONTENT_SLOTS as readonly string[]).includes(key)) continue
    out[key] = spec
  }
  return { ...out, ...own }
}

const one = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(v as string) ? (v as T) : fallback

/**
 * The root-element props a section needs to honour the shared vocabulary.
 * Spread onto the section's own `<section className="section">`; CSS in
 * `assets/styles.css` turns each attribute into the token it selects.
 */
export function sharedRootProps(attributes: Record<string, unknown>): Record<string, unknown> {
  const anchor = typeof attributes.anchorId === 'string' ? attributes.anchorId.trim() : ''
  const props: Record<string, unknown> = {
    'data-section-width': one(attributes.sectionWidth, ['standard', 'wide', 'full'], 'wide'),
    'data-content-width': one(attributes.contentWidth, ['narrow', 'content', 'standard'], 'content'),
    'data-content-align': one(attributes.contentAlignment, ['left', 'center'], 'left'),
    'data-space-top': one(attributes.spacingTop, ['none', 'small', 'medium', 'large', 'xl'], 'medium'),
    'data-space-bottom': one(attributes.spacingBottom, ['none', 'small', 'medium', 'large', 'xl'], 'medium'),
    'data-header-size': one(attributes.headerSize, ['small', 'medium', 'large'], 'medium'),
    'data-mobile-align': one(attributes.mobileContentAlignment, ['inherit', 'left', 'center'], 'inherit'),
  }
  // Only emitted when set, so a section that never sets them keeps today's
  // markup byte-for-byte.
  const background = attributes.background
  if (typeof background === 'string' && background) props['data-background'] = background
  if (attributes.hideOnMobile === true) props['data-hide-mobile'] = 'true'
  // The anchor must be a valid fragment target; a merchant may type "# Ship It".
  if (anchor) props.id = anchor.replace(/^#/, '').trim().replace(/\s+/g, '-')
  return props
}
