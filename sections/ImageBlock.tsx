import { defineSection, type SectionProps } from '@tanqory/theme-kit'

/** Generic IMAGE block — a picture (optionally linked) for any container. */
export function ImageBlock({ attributes }: SectionProps): JSX.Element {
  const src = attributes.image as string | undefined
  if (!src) return <></>
  const img = (
    <img
      className="block-image"
      src={src}
      alt={(attributes.alt as string) ?? ''}
      loading="lazy"
      decoding="async"
      style={{ borderRadius: attributes.rounded ? 'var(--radius-md, 10px)' : undefined }}
    />
  )
  const link = attributes.link as string | undefined
  return <div className="block-image-wrap">{link ? <a href={link}>{img}</a> : img}</div>
}

export default defineSection({
  name: 'image',
  title: 'Image',
  category: 'block',
  icon: '▥',
  attributes: {
    image: { type: 'image', label: 'Image' },
    alt: { type: 'text', label: 'Alt text' },
    link: { type: 'url', label: 'Link' },
    rounded: { type: 'boolean', default: true, label: 'Rounded corners' },
  },
  component: ImageBlock,
})
