import { defineSection, type SectionProps } from '@tanqory/theme-kit'

/** Generic VIDEO block — embeds a YouTube/Vimeo URL, or plays a video file. */
export function VideoBlock({ attributes }: SectionProps): JSX.Element {
  const url = attributes.url as string | undefined
  if (!url) return <></>
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)?.[1]
  const vimeo = url.match(/vimeo\.com\/(\d+)/)?.[1]
  const embed = yt
    ? `https://www.youtube.com/embed/${yt}`
    : vimeo
      ? `https://player.vimeo.com/video/${vimeo}`
      : null
  const autoplay = attributes.autoplay === true
  return (
    <div className="block-video">
      {embed ? (
        <iframe
          src={embed}
          title="Video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <video
          src={url}
          poster={attributes.poster as string | undefined}
          controls={attributes.controls !== false}
          autoPlay={autoplay}
          muted={autoplay}
          loop={attributes.loop === true}
          playsInline
        />
      )}
    </div>
  )
}

export default defineSection({
  name: 'video',
  title: 'Video',
  category: 'block',
  icon: '▷',
  attributes: {
    url: { type: 'url', label: 'Video URL (YouTube / Vimeo / file)' },
    poster: { type: 'image', label: 'Poster image (file only)' },
    autoplay: { type: 'boolean', default: false, label: 'Autoplay (muted)' },
    loop: { type: 'boolean', default: false, label: 'Loop' },
    controls: { type: 'boolean', default: true, label: 'Show controls' },
  },
  component: VideoBlock,
})
