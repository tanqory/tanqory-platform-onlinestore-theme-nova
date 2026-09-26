/**
 * The marketing-consent checkbox must be submitted with the subscription.
 *
 * It used to render immediately after `</form>` with no `form=` attribute, so
 * the browser never serialized it: a merchant enabled "Show marketing consent",
 * a shopper ticked it, and the subscription was recorded with no consent at
 * all — the opposite of what the control promises, and the one field here whose
 * absence is a compliance problem rather than a cosmetic one.
 */
import { describe, expect, it } from 'vitest'
import { Newsletter } from '../sections/Newsletter'
import { renderSection, stubData } from './helpers/render'

describe('newsletter consent', () => {
  it('is inside the form, so the browser serializes it', async () => {
    const { container, unmount } = await renderSection(
      <Newsletter attributes={{ showConsent: true, action: '/subscribe' }}/>,
      stubData({}),
    )
    const form = container.querySelector('form.newsletter__form')
    const consent = container.querySelector('input[name="marketingConsent"]')
    expect(form).not.toBeNull()
    expect(consent).not.toBeNull()
    // `form.elements` is exactly what a submission serializes.
    expect((form as HTMLFormElement).elements.namedItem('marketingConsent')).toBe(consent)
    unmount()
  })

  it('is never pre-ticked', async () => {
    const { container, unmount } = await renderSection(
      <Newsletter attributes={{ showConsent: true, action: '/subscribe' }}/>,
      stubData({}),
    )
    expect((container.querySelector('input[name="marketingConsent"]') as HTMLInputElement).checked).toBe(false)
    unmount()
  })

  it('renders no form at all without an action URL — there is no default endpoint', async () => {
    const { container, unmount } = await renderSection(
      <Newsletter attributes={{ showConsent: true }}/>,
      stubData({}),
    )
    expect(container.querySelector('form.newsletter__form')).toBeNull()
    expect(container.querySelector('h2')).not.toBeNull()
    unmount()
  })

  it('renders no consent field when the merchant has not enabled it', async () => {
    const { container, unmount } = await renderSection(
      <Newsletter attributes={{ action: '/subscribe' }}/>,
      stubData({}),
    )
    expect(container.querySelector('input[name="marketingConsent"]')).toBeNull()
    unmount()
  })
})
