import { defineSection, type SectionProps } from '@tanqory/theme-kit'

/**
 * Divider — a visual break, or pure space.
 *
 * Every control is a semantic preset. It used to take a raw pixel height and a
 * free-form colour, which is exactly the "raw values as merchant settings"
 * pattern the design forbids: a merchant could set 137px and a colour that
 * exists nowhere else in the theme.
 */
export function Divider({ attributes }: SectionProps): JSX.Element {
  const style = (attributes.style as string) ?? 'line-subtle'
  const width = (attributes.width as string) ?? 'wide'
  const spacing = (attributes.spacing as string) ?? 'md'
  return (
    <div className="divider" data-style={style} data-width={width} data-spacing={spacing}>
      {style !== 'space' && <hr className="divider__line" />}
    </div>
  )
}

export default defineSection({
  name: 'divider',
  role: 'section',
  title: 'Divider',
  category: 'layout',
  icon: '—',
  attributes: {
    style: {
      type: 'select',
      default: 'line-subtle',
      label: 'Style',
      options: [
        { value: 'line-subtle', label: 'Subtle line' },
        { value: 'line-strong', label: 'Strong line' },
        { value: 'space', label: 'Space only' },
      ],
    },
    width: {
      type: 'select',
      default: 'wide',
      label: 'Line width',
      visible_if: "{{ section.settings.style != 'space' }}",
      options: [
        { value: 'standard', label: 'Standard' },
        { value: 'wide', label: 'Wide' },
        { value: 'full', label: 'Full bleed' },
      ],
    },
    spacing: {
      type: 'select',
      default: 'md',
      label: 'Spacing',
      options: [
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
        { value: 'xl', label: 'Extra large' },
      ],
    },
  },
  component: Divider,
})
