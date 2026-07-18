import { useEffect, useState } from 'react'
import { defineSection, useData, type SectionProps } from '@tanqory/theme-kit'
import { Container } from '../components/Container'
import { Link } from '../components/Link'

interface Order {
  id: string
  name?: string
  financialStatus?: string
  processedAt?: string
}
interface Me {
  firstName?: string
  email?: string
}

/**
 * Customer account — shows the signed-in customer + their orders, or a sign-in
 * prompt when logged out. A menu item of type "Customer account" links here
 * (/account). Customer data comes from the storefront customer API (live);
 * mock mode shows the signed-out state.
 */
export function AccountPage(_props: SectionProps): JSX.Element {
  const { customer } = useData()
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<Me | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    let alive = true
    void (async () => {
      const who = (await customer?.get?.().catch(() => null)) as Me | null
      const list = who ? ((await customer?.orders?.().catch(() => [])) as Order[]) : []
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
    <section className="section account">
      <Container className="account__inner">
        {loading ? (
          <p className="u-text-muted">Loading your account…</p>
        ) : !me ? (
          <div className="stack stack--sm">
            <h1>Account</h1>
            <p className="lede u-text-muted">Sign in to see your orders and saved addresses.</p>
            <Link href="/account/login" className="btn btn--primary">
              Sign in
            </Link>
          </div>
        ) : (
          <div className="stack">
            <h1>Hi {me.firstName ?? 'there'}</h1>
            <section className="account__orders stack stack--sm">
              <h2>Orders</h2>
              {orders.length === 0 ? (
                <p className="u-text-muted">You haven’t placed any orders yet.</p>
              ) : (
                <ul className="account__order-list">
                  {orders.map((o) => (
                    <li key={o.id} className="account__order">
                      <span>{o.name ?? o.id}</span>
                      {o.financialStatus && (
                        <span className="u-text-muted"> · {o.financialStatus}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Container>
    </section>
  )
}

export default defineSection({
  name: 'account',
  title: 'Account',
  category: 'commerce',
  icon: 'user',
  attributes: {},
  component: AccountPage,
})
