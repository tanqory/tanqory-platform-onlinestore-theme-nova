/**
 * A region that stays mounted while hidden must be inert, not merely
 * aria-hidden. Before this, the closed search overlay kept its input in the tab
 * order: keyboard users could Tab into an invisible dialog with no focus ring
 * anywhere on screen — which is how a real accessibility pass found it.
 */
import { describe, expect, it } from 'vitest'
import { Modal } from '../components/Modal'
import { Drawer } from '../components/Drawer'
import { inertWhenClosed } from '../components/inert'
import { renderSection, stubData } from './helpers/render'

describe('hidden regions are inert, not merely aria-hidden', () => {
  it('omits the attribute entirely when open', () => {
    // `inert="false"` would still be inert — the attribute is presence-based,
    // so the only safe "open" value is no attribute at all.
    expect(inertWhenClosed(true)).toEqual({})
    expect(inertWhenClosed(false)).toEqual({ inert: '' })
  })

  it('keeps a closed modal out of the tab order', async () => {
    const h = await renderSection(
      <Modal open={false} onClose={() => {}} title="Search">
        <input aria-label="Search the store" />
      </Modal>,
      stubData(),
    )
    const overlay = h.container.querySelector('.overlay')
    expect(overlay?.hasAttribute('inert')).toBe(true)
    // NOT aria-hidden as well. Inert content is already hidden from assistive
    // technology, and `aria-hidden` on a subtree holding links and buttons is
    // its own violation — an audit reported that pairing 145 times before it
    // was removed.
    expect(overlay?.getAttribute('aria-hidden')).toBeNull()
    h.unmount()
  })

  it('drops the attribute once the modal opens', async () => {
    const h = await renderSection(
      <Modal open onClose={() => {}} title="Search">
        <input aria-label="Search the store" />
      </Modal>,
      stubData(),
    )
    expect(h.container.querySelector('.overlay')?.hasAttribute('inert')).toBe(false)
    h.unmount()
  })

  it('keeps a closed drawer out of the tab order', async () => {
    const h = await renderSection(
      <Drawer open={false} onClose={() => {}} ariaLabel="Cart">
        <button type="button">Checkout</button>
      </Drawer>,
      stubData(),
    )
    expect(h.container.querySelector('.overlay')?.hasAttribute('inert')).toBe(true)
    h.unmount()
  })
})
