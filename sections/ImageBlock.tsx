import { defineSection, type SectionProps } from '../lib/tanqory/index'

/**
 * Generic IMAGE block — a picture (optionally linked) for any container.
 *
 * Every other piece of media in the theme is bound to a ratio token: product
 * media 4:5, editorial 3:2, hero 16:9. This block was the only one left
 * unbounded (`width: 100%; height: auto`), so a 1200x800 file rendered 907px
 * tall inside a 1360px column and the section around it became mostly empty
 * space. `ratio` uses the same vocabulary as the rest of the token layer, and
 * defaults to the image's own proportions so nothing a merchant already
 * published changes shape.
 */
export function ImageBlock({ attributes }: SectionProps): JSX.Element {
  const src = attributes.image as string | undefined
  if (!src) return <></>
  const ratio = (attributes.ratio as string) ?? 'natural'
  const img = (
    <img
      className="block-image"
      src={src}
      alt={(attributes.alt as string) ?? ''}
      loading="lazy"
      decoding="async"
    />
  )
  const link = attributes.link as string | undefined
  return (
    <div
      className="block-image-wrap"
      data-ratio={ratio}
      data-rounded={attributes.rounded ? 'true' : undefined}
    >
      {link ? <a href={link}>{img}</a> : img}
    </div>
  )
}

export default defineSection({
  name: 'image',
  role: 'block',
  title: 'Image',
  description: 'One image, optionally linked.',
  category: 'block',
  icon: '▥',
  attributes: {
    image: { type: 'image', label: 'Image' },
    ratio: {
      type: 'select',
      default: 'natural',
      label: 'Shape',
      options: [
        { value: 'natural', label: "The image's own shape" },
        { value: 'square', label: 'Square' },
        { value: 'portrait', label: 'Portrait' },
        { value: 'editorial', label: 'Editorial' },
        { value: 'wide', label: 'Wide' },
      ],
    },
    alt: { type: 'text', label: 'Alt text' },
    link: { type: 'url', label: 'Link' },
    rounded: { type: 'boolean', default: true, label: 'Rounded corners' },
  },
  component: ImageBlock,
})
