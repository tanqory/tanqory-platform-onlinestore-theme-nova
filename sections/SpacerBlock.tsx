import { defineSection, type SectionProps } from '@tanqory/theme-kit'

/** Generic SPACER block — vertical whitespace inside a container. */
export function SpacerBlock({ attributes }: SectionProps): JSX.Element {
  return <div className="block-spacer" style={{ height: (attributes.height as number) ?? 24 }} aria-hidden />
}

export default defineSection({
  name: 'spacer',
  title: 'Spacer',
  category: 'block',
  icon: '↕',
  attributes: {
    height: { type: 'range', default: 24, min: 4, max: 120, step: 4, label: 'Height (px)' },
  },
  component: SpacerBlock,
})
