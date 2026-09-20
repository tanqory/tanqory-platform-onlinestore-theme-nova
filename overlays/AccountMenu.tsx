import { useEffect, useRef, useState } from 'react'
import { closeOverlay, useOverlay } from '../components/useOverlayChannel'
import { inertWhenClosed } from '../components/inert'
import { Button } from '../components/Button'

interface AccountLink {
  label: string
  href: string
}

interface AccountMenuProps {
  loggedIn: boolean
  heading?: string
  subtext?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  links?: string
}

interface AccountSession {
  signedIn: boolean
  email?: string
  firstName?: string
}

/**
 * Header account menu — dropdown anchored to the 👤 icon. Different shape
 * from the drawer/modal pair: it's positioned (not full-overlay), doesn't
 * scroll-lock the body, and stays open until the user clicks outside or
 * presses ESC.
 *
 * Sign-in state comes from the REAL session: the customer cookie is
 * HttpOnly, so we probe the same-origin account portal at
 * `/account/session` (the router mounts it on every storefront domain).
 * The `loggedIn` setting remains only as the editor-preview default —
 * the probe always wins on a live storefront.
 *
 * Logged-out: single "Sign in" CTA carrying ?return_to=<current page> so
 *             the OTP flow lands the customer back where they started
 *             (passwordless — there is no separate Create account door).
 * Logged-in:  greeting + View orders / Sign out (+ merchant extras).
 */
export function AccountMenu(props: AccountMenuProps): JSX.Element {
  const open = useOverlay('account')
  const ref = useRef<HTMLDivElement>(null)
  const [session, setSession] = useState<AccountSession | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/account/session', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: AccountSession | null) => {
        if (!cancelled && j && typeof j.signedIn === 'boolean') setSession(j)
      })
      .catch(() => {
        // Editor preview / dev server has no account portal — fall back to
        // the merchant's preview toggle below.
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Click-outside to close. We listen on capture so a click on the trigger
  // icon — which is what opened us — registers BEFORE the outside-click
  // listener fires, otherwise we'd close immediately on open.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (target && ref.current && !ref.current.contains(target)) {
        // Don't close if the user clicked the same trigger again — let the
        // trigger's toggle logic handle it.
        const trigger = (target as HTMLElement).closest('[data-overlay-trigger="account"]')
        if (!trigger) closeOverlay()
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeOverlay()
    }
    window.addEventListener('click', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Live session wins; the merchant's preview toggle is only the fallback
  // while the probe is in flight (or in the editor canvas where the portal
  // doesn't exist).
  const loggedIn = session ? session.signedIn : Boolean(props.loggedIn)

  // Send the customer back to THIS page after the OTP round trip.
  const here =
    typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : '/'
  const loginHref = `/account/login?return_to=${encodeURIComponent(here)}`

  const who = session?.firstName || session?.email || ''
  const heading = props.heading || (loggedIn ? 'My account' : 'Welcome')
  const subtext =
    props.subtext ||
    (loggedIn
      ? who
        ? `Signed in as ${who}`
        : 'Manage orders and details.'
      : 'Sign in for faster checkout.')
  const primaryLabel = props.primaryLabel || (loggedIn ? 'View orders' : 'Sign in')
  const primaryHref = props.primaryHref || (loggedIn ? '/account' : loginHref)
  // Passwordless storefront: no Create account door. Logged-out shows the
  // single Sign in CTA unless the merchant explicitly configured a
  // secondary link; logged-in keeps Sign out.
  const secondaryLabel = props.secondaryLabel || (loggedIn ? 'Sign out' : '')
  const secondaryHref = props.secondaryHref || (loggedIn ? '/account/logout' : '')

  const extras = parseLinks(props.links)

  return (
    <div
      ref={ref}
      className={`account-menu ${open ? 'account-menu--open' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label="Account menu"
      {...inertWhenClosed(open)}
    >
      <div className="account-menu__head">
        <strong>{heading}</strong>
        <p className="u-text-muted">{subtext}</p>
      </div>
      {/* The design system's Button, not a link painted to look like one. Both
          of these carried their own background, padding and hover rules, so a
          change to the Button never reached them. */}
      <Button
        label={primaryLabel}
        link={primaryHref}
        variant="primary"
        fullWidth
        className="account-menu__primary"
      />
      {secondaryLabel && secondaryHref && (
        <Button
          label={secondaryLabel}
          link={secondaryHref}
          variant="secondary"
          fullWidth
          className="account-menu__secondary"
        />
      )}
      {extras.length > 0 && (
        <ul className="account-menu__list">
          {extras.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function parseLinks(raw: string | undefined): AccountLink[] {
  if (!raw) return []
  const trimmed = raw.trim()
  if (!trimmed) return []
  // JSON form: [{"label":"Wishlist","href":"/account/wishlist"}, ...]
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as Array<{ label?: string; href?: string }>
      return parsed
        .filter((l): l is { label: string; href: string } => Boolean(l.label && l.href))
        .map((l) => ({ label: l.label, href: l.href }))
    } catch {
      return []
    }
  }
  // Compact form: "Wishlist|/account/wishlist, Orders|/account/orders"
  return trimmed
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [label, href] = entry.split('|').map((s) => s.trim())
      return label && href ? { label, href } : null
    })
    .filter((l): l is AccountLink => l !== null)
}

export default AccountMenu
