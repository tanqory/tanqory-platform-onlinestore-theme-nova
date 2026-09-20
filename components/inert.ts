/**
 * `inert` for a region that stays mounted while hidden.
 *
 * `aria-hidden` alone hides a region from assistive technology but leaves its
 * buttons, links and inputs in the tab order — so keyboard users land inside a
 * closed drawer, modal or menu with nothing visible to show where focus went.
 * `inert` is what actually removes them.
 *
 * It is a *presence-based* attribute: `inert="false"` still makes the subtree
 * inert. React 18 does not type or special-case it, so it is emitted only when
 * the region is closed and omitted entirely when it is open — never rendered
 * with a falsy value.
 *
 * `aria-hidden` is NOT set alongside it. Inert content is already hidden from
 * assistive technology, so the pair is redundant, and `aria-hidden` on a
 * subtree that contains links and buttons is itself a violation — an audit
 * reported it 145 times across ten routes before this.
 */
export function inertWhenClosed(open: boolean): Record<string, unknown> {
  return open ? {} : { inert: '' }
}
