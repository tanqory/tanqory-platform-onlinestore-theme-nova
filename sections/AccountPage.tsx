import { defineSection, type SectionProps } from '@tanqory/theme-kit'
import { useCustomerAccount } from '@tanqory/theme-kit/app'
import { Container } from '../components/Container'
import { Link } from '../components/Link'

/**
 * Customer account — MARKUP ONLY.
 *
 * `useCustomerAccount()` (@tanqory/theme-kit/app) reads the storefront access
 * token from `customerTokenStore` and passes it to `customer.get(token)` /
 * `customer.orders(token)` — the storefront customer API is token-scoped, and
 * calling it without one always returned null, which is why no theme's account
 * page ever showed an order. "No token" resolves to signed-out with no request
 * and no error, so mock/editor mode paints the sign-in prompt as before.
 */
export function AccountPage(_props: SectionProps): JSX.Element {
  const account = useCustomerAccount()

  return (
    <section className="section account">
      <Container className="account__inner">
        {account.loading ? (
          <p className="u-text-muted">Loading your account…</p>
        ) : !account.signedIn ? (
          <div className="stack stack--sm">
            <h1>Account</h1>
            <p className="lede u-text-muted">
              {account.status === 'error'
                ? 'We couldn’t load your account. Please sign in again.'
                : 'Sign in to see your orders and saved addresses.'}
            </p>
            <Link href={account.loginHref} className="btn btn--primary">
              Sign in
            </Link>
          </div>
        ) : (
          <div className="stack">
            <h1>Hi {account.customer?.firstName ?? 'there'}</h1>
            <section className="account__orders stack stack--sm">
              <h2>Orders</h2>
              {account.orders.length === 0 ? (
                <p className="u-text-muted">You haven’t placed any orders yet.</p>
              ) : (
                <ul className="account__order-list">
                  {account.orders.map((o) => (
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
