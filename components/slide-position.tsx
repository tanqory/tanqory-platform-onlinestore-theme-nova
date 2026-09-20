/**
 * Where a slide sits inside its slideshow.
 *
 * A `slide` block renders itself and cannot know whether it is the first one,
 * but the heading level depends on exactly that: the first slide is the page's
 * `h1` and the rest are `h2`. Making every slide an `h2` avoided competing
 * `h1`s but left the home page with no top-level heading at all, which is what
 * a screen reader and a search engine both look for first.
 *
 * `index` is -1 for a slide rendered outside a slideshow, which then stays an
 * `h2` rather than claiming a page heading it does not own.
 *
 * `active` is which slide is currently showing. Pinning the `h1` to slide ONE
 * looked right until the carousel advanced: inactive slides are hidden with
 * `visibility: hidden`, which takes them out of the accessibility tree too, so
 * six seconds after load the page had no top-level heading at all. The heading
 * travels with whichever slide is on screen.
 */
import { createContext, useContext, type ReactNode } from 'react'

const SlidePosition = createContext<{ index: number; active: number }>({ index: -1, active: -1 })

export function SlidePositionProvider({
  value,
  children,
}: {
  value: { index: number; active: number }
  children: ReactNode
}): JSX.Element {
  return <SlidePosition.Provider value={value}>{children}</SlidePosition.Provider>
}

export function useSlidePosition(): { index: number; active: number } {
  return useContext(SlidePosition)
}
