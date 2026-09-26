import { defineSection, type SectionProps } from '../lib/tanqory/index'

/** Generic VIDEO block — embeds a YouTube/Vimeo URL, or plays a video file. */
export function VideoBlock({ attributes }: SectionProps): JSX.Element {
  const url = attributes.url as string | undefined
  const captions = attributes.captions as string | undefined
  const captionsLang = (attributes.captionsLang as string) ?? 'en'
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
        >
          {/* WCAG 1.2.2 is Level A: a video carrying speech needs captions, and
              the block offered no way to attach them. A merchant who has a
              caption file points at it here; one who has not gets a video that
              still tells the truth about what it lacks. */}
          {captions && <track kind="captions" src={captions} srcLang={captionsLang} label="Captions" default />}
        </video>
      )}
    </div>
  )
}

export default defineSection({
  name: 'video',
  role: 'block',
  title: 'Video',
  description: 'An embedded or uploaded video.',
  category: 'block',
  icon: '▷',
  attributes: {
    url: { type: 'url', label: 'Video URL (YouTube / Vimeo / file)' },
    captions: { type: 'url', label: 'Captions file (.vtt)' },
    captionsLang: { type: 'text', default: 'en', label: 'Captions language' },
    poster: { type: 'image', label: 'Poster image (file only)' },
    autoplay: { type: 'boolean', default: false, label: 'Autoplay (muted)' },
    loop: { type: 'boolean', default: false, label: 'Loop' },
    controls: { type: 'boolean', default: true, label: 'Show controls' },
  },
  component: VideoBlock,
})
