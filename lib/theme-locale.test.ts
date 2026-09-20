// Run: npm test  (node --test --experimental-strip-types)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  accountLinkLabel,
  localeStrings,
  localizedCopy,
  policyTitle,
  stockCopy,
  themeLocaleOf,
} from './theme-locale.ts'

const en = JSON.parse(readFileSync(new URL('../locales/en.json', import.meta.url), 'utf8'))
const th = JSON.parse(readFileSync(new URL('../locales/th.json', import.meta.url), 'utf8'))
const maps = { en, th }
const tFor = (code: string) => {
  const strings = localeStrings(code, maps)
  return (key: string) => strings[key] ?? key
}

test("a theme's locale setting picks a bundled string map, and anything else is English", () => {
  assert.equal(themeLocaleOf('th', ['en', 'th']), 'th')
  assert.equal(themeLocaleOf(' TH ', ['en', 'th']), 'th')
  assert.equal(themeLocaleOf('th-TH', ['en', 'th']), 'th')
  assert.equal(themeLocaleOf('', ['en', 'th']), 'en')
  assert.equal(themeLocaleOf('ja', ['en', 'th']), 'en')
  assert.equal(themeLocaleOf('Thai', ['en', 'th']), 'en')
  assert.equal(themeLocaleOf(undefined, ['en', 'th']), 'en')
  assert.equal(themeLocaleOf(7, ['en', 'th']), 'en')
})

test('a partly translated locale shows English, never a raw key', () => {
  const strings = localeStrings('th', { en: { a: 'A', b: 'B' }, th: { a: 'ก' } })
  assert.deepEqual(strings, { a: 'ก', b: 'B' })
  assert.deepEqual(localeStrings('en', { en: { a: 'A' }, th: { a: 'ก' } }), { a: 'A' })
})

test('every key the English map has, the Thai map has too, and in Thai', () => {
  for (const key of Object.keys(en)) {
    assert.ok(typeof th[key] === 'string' && th[key].length > 0, `th.json lacks "${key}"`)
    assert.match(th[key], /[฀-๿]/, `th.json "${key}" is not Thai: ${th[key]}`)
  }
})

// Production build 7270019a (2026-09-15): a Thai site's every page carried these.
test('the account menu and contact form of a Thai theme say nothing in English', () => {
  const t = tFor('th')
  assert.equal(localizedCopy('', 'Welcome', 'account.welcome', t), th['account.welcome'])
  assert.equal(
    localizedCopy(undefined, 'Sign in for faster checkout.', 'account.signInPrompt', t),
    th['account.signInPrompt'],
  )
  // The template still carries nova's English default: it is translated, not shown.
  assert.equal(stockCopy('We read every note.', CONTACT, undefined, t), th['contact.subheading'])
  assert.equal(stockCopy('Send us a message', CONTACT, 'Get in touch', t), th['contact.heading'])
  assert.equal(stockCopy(undefined, CONTACT, 'Send message', t), th['contact.send'])
})

const CONTACT = {
  'Send us a message': 'contact.heading',
  'Get in touch': 'contact.getInTouch',
  'We read every note.': 'contact.subheading',
  'Send message': 'contact.send',
}

test('a section setting keeps each English default itself on an English theme, and a cleared one hidden', () => {
  const tEn = tFor('en')
  assert.equal(stockCopy('Send us a message', CONTACT, 'Get in touch', tEn), 'Send us a message')
  assert.equal(stockCopy(undefined, CONTACT, 'Get in touch', tEn), 'Get in touch')
  assert.equal(stockCopy(undefined, CONTACT, undefined, tEn), undefined)
  assert.equal(stockCopy('', CONTACT, 'Get in touch', tFor('th')), '')
  assert.equal(stockCopy('ส่งข้อความหาเรา', CONTACT, 'Get in touch', tFor('th')), 'ส่งข้อความหาเรา')
})

test("a merchant's own words are kept in any theme language, and an English theme is unchanged", () => {
  const t = tFor('th')
  assert.equal(localizedCopy('ทักเราได้เลย', 'Send us a message', 'contact.heading', t), 'ทักเราได้เลย')
  assert.equal(localizedCopy('Write to us', 'Send us a message', 'contact.heading', t), 'Write to us')
  const tEn = tFor('en')
  assert.equal(localizedCopy('Send us a message', 'Send us a message', 'contact.heading', tEn), 'Send us a message')
  assert.equal(localizedCopy('', 'Checkout', 'cart.checkout', tEn), 'Checkout')
  // A key no map has: the stock English, not the key.
  assert.equal(localizedCopy('', 'Checkout', 'no.such.key', tEn), 'Checkout')
})

test("a policy heading is store-api's English stock title only on an English theme", () => {
  assert.equal(policyTitle('refund-policy', 'Refund Policy', tFor('th')), th['policy.refund-policy'])
  assert.equal(policyTitle('refund-policy', 'Refund Policy', tFor('en')), 'Refund Policy')
  // A title that is not the stock one is the store's, and an unknown handle keeps its title.
  assert.equal(policyTitle('refund-policy', 'คืนสินค้า', tFor('th')), 'คืนสินค้า')
  assert.equal(policyTitle('custom', 'Custom', tFor('th')), 'Custom')
})

test("nova's default account links follow the theme language; a merchant's own label does not", () => {
  assert.equal(accountLinkLabel('Orders', tFor('th')), th['account.orders'])
  assert.equal(accountLinkLabel('Addresses', tFor('th')), th['account.addresses'])
  assert.equal(accountLinkLabel('Orders', tFor('en')), 'Orders')
  assert.equal(accountLinkLabel('Wishlist', tFor('th')), 'Wishlist')
})
