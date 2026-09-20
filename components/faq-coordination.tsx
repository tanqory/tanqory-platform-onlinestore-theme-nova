/**
 * Lets an FAQ section coordinate the question blocks inside it.
 *
 * A `faq-item` block renders its own expander and cannot see its siblings, so
 * "only one answer open at a time" and "open the first answer" had no effect
 * whenever the section used blocks — which is what the section's own preset
 * ships, so the two settings did nothing for essentially every merchant.
 *
 * The section owns the open state and hands each block its position plus the
 * open/toggle pair. A block rendered outside an FAQ falls back to behaving on
 * its own, so it still works if someone places one loose.
 */
import { createContext, useContext, type ReactNode } from 'react'

export interface FaqCoordination {
  /** -1 when the block is not inside a coordinating FAQ section. */
  index: number
  isOpen: (index: number) => boolean
  toggle: (index: number) => void
  /** False when the section is not coordinating; the block then self-manages. */
  coordinated: boolean
}

const Ctx = createContext<FaqCoordination>({
  index: -1,
  isOpen: () => false,
  toggle: () => {},
  coordinated: false,
})

export function FaqCoordinationProvider({
  value,
  children,
}: {
  value: FaqCoordination
  children: ReactNode
}): JSX.Element {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useFaqCoordination(): FaqCoordination {
  return useContext(Ctx)
}
