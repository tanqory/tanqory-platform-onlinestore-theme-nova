import { useEffect, useState } from 'react'
import { customerTokenStore, defineSection, formatMoney, useData, type SectionProps } from '@tanqory/theme-kit'
import { Container } from '../components/Container'
import { Link } from '../components/Link'
import { Pagination } from '../components/Disclosure'
import { StateBlock } from '../components/StateBlock'
import { withShared, sharedRootProps } from '../lib/shared-section-props'

/**
 * The real contracts, not narrowed guesses. `Order` carries the order number,
 * both statuses, the money total and a link to the order's status page — the
 * local shape this file used to declare left most of that on the floor and a
 * cast invented `totalPrice`.
 */
type Order = import('@tanqory/theme-kit').Order
type Me = import('@tanqory/theme-kit').Customer

/**
 * Customer account — shows the signed-in customer + their orders, or a sign-in
 * prompt when logged out. A menu item of type "Customer account" links here
 * (/account). Customer data comes from the storefront customer API (live);
 * mock mode shows the signed-out state.
 */
export function AccountPage({ attributes }: SectionProps): JSX.Element {
  const { customer } = useData()
  const showOrderHistory = attributes.showOrderHistory !== false
  const ordersPerPage = Number(attributes.ordersPerPage ?? 10) === 20 ? 20 : 10
  const loginLayout = (attributes.loginLayout as string) ?? 'split'
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<Me | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    let alive = true
    void (async () => {
      // `customer.get`/`customer.orders` are token-scoped (commerce-standard):
      // the customer access token is persisted by the login flow and replayed
      // here. Calling them with no argument — which this section used to do —
      // rejects on every load, and the `.catch` turned that into a permanent
      // signed-out page for customers who WERE signed in.
      const token = customerTokenStore.get()
      const who = token ? ((await customer?.get(token).catch(() => null)) as Me | null) : null
      const list =
        token && who ? ((await customer?.orders(token).catch(() => [])) as Order[]) : []
      if (alive) {
        setMe(who)
        setOrders(Array.isArray(list) ? list : [])
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [customer])

  return (
    <section {...sharedRootProps(attributes)} className="section account">
      <Container className="account__inner">
        {loading ? (
          <p className="u-text-muted">Loading your account…</p>
        ) : !me ? (
          <div className="account__login" data-layout={loginLayout}>
            <div className="stack stack--sm">
              <h1>Account</h1>
              <p className="lede u-text-muted">Sign in to see your orders and saved addresses.</p>
              <Link href="/account/login" className="btn btn--primary">
                Sign in
              </Link>
            </div>
            <div className="stack stack--sm account__login-aside">
              <h2>New here?</h2>
              <p className="u-text-muted">Sign in with your email — an account is created the first time you do.</p>
              <Link href="/account/login" className="btn btn--secondary">
                Sign in
              </Link>
            </div>
          </div>
        ) : (
          <div className="account__panel">
            {/* Side nav beside a content panel, per the design — the page was a
                bare list with no way to reach addresses or details. Below 1024
                it becomes a scrollable row of tabs. */}
            <nav className="account__nav" aria-label="Account">
              <h1 className="account__title">Account</h1>
              <ul>
                <li><a className="is-current" aria-current="page" href="/account">Orders</a></li>
                <li><a href="/account/addresses">Addresses</a></li>
              </ul>
              <a className="account__signout" href="/account/logout">Sign out</a>
            </nav>

            <div className="account__content stack">
            <h2 className="account__greeting">Hi {me.firstName ?? 'there'}</h2>
            {showOrderHistory && (
              <section className="account__orders stack stack--sm">
                <h2>Orders</h2>
                {orders.length === 0 ? (
                  <StateBlock
                    title="No orders yet"
                    body="Your orders will appear here once you place one."
                    ctaLabel="Start shopping"
                    ctaHref="/collections/all"
                  />
                ) : (
                  <>
                    {/* An order table: number, date, status with a dot, total.
                        It becomes stacked cards below 768. */}
                    <table className="account__orders-table">
                      <thead>
                        <tr>
                          <th scope="col">Order</th>
                          <th scope="col">Date</th>
                          <th scope="col">Status</th>
                          <th scope="col">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders
                          .slice((page - 1) * ordersPerPage, page * ordersPerPage)
                          .map((o) => (
                            <tr key={o.id}>
                              <td data-label="Order">
                                {o.statusUrl ? (
                                  <a href={o.statusUrl}>{o.name}</a>
                                ) : (
                                  o.name
                                )}
                              </td>
                              <td data-label="Date">
                                {o.processedAt
                                  ? new Date(o.processedAt).toLocaleDateString(undefined, {
                                      year: 'numeric', month: 'short', day: 'numeric',
                                    })
                                  : '—'}
                              </td>
                              <td data-label="Status">
                                {/* The design's column reads "Delivered" /
                                    "Shipped" — that is the FULFILMENT status.
                                    The financial status ("paid") is a different
                                    fact and was the wrong one to show here. */}
                                <span
                                  className="account__status"
                                  data-status={(o.fulfillmentStatus || 'unfulfilled').toLowerCase()}
                                >
                                  {o.cancelled ? 'Cancelled' : o.fulfillmentStatus || 'Unfulfilled'}
                                </span>
                              </td>
                              <td data-label="Total">{formatMoney(o.totalPrice)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    <Pagination
                      page={page}
                      pageCount={Math.ceil(orders.length / ordersPerPage)}
                      onChange={setPage}
                    />
                  </>
                )}
              </section>
            )}
            </div>
          </div>
        )}
      </Container>
    </section>
  )
}

export default defineSection({
  name: 'account',
  role: 'section',
  title: 'Account',
  category: 'commerce',
  icon: 'user',
  attributes: withShared({
    showOrderHistory: { type: 'boolean', default: true, label: 'Show order history' },
    ordersPerPage: {
      type: 'select',
      default: '10',
      label: 'Orders per page',
      visible_if: '{{ section.settings.showOrderHistory == true }}',
      options: [
        { value: '10', label: '10' },
        { value: '20', label: '20' },
      ],
    },
    loginLayout: {
      type: 'select',
      default: 'split',
      label: 'Sign-in layout',
      options: [
        { value: 'split', label: 'Split' },
        { value: 'stacked', label: 'Stacked' },
      ],
    },
  }),
  component: AccountPage,
})
