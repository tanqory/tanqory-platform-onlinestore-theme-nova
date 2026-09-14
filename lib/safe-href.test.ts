// Run: npm test  (node --test --experimental-strip-types)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseAccountLinks, safeHref } from './safe-href.ts'

test('script and data URLs are refused, including the spellings browsers still navigate', () => {
  for (const bad of [
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    '\u0001javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox',
    'blob:https://x/y',
    '',
    '   ',
    null,
    42,
    { href: '/account' },
  ]) {
    assert.equal(safeHref(bad), null, JSON.stringify(bad))
  }
})

test('relative, http(s), mailto and tel links pass unchanged', () => {
  for (const ok of [
    '/account/orders',
    '?tab=orders',
    '#faq',
    'pages/about',
    '//cdn.example.com/x',
    'https://example.com/a?b=c',
    'http://example.com',
    'mailto:help@example.com',
    'tel:+6612345678',
  ]) {
    assert.equal(safeHref(ok), ok)
  }
})

test('account extra links drop unsafe entries in both formats and never throw on bad input', () => {
  assert.deepEqual(parseAccountLinks('Orders|/account/orders\nPwn|javascript:alert(1)\nHelp|mailto:help@example.com'), [
    { label: 'Orders', href: '/account/orders' },
    { label: 'Help', href: 'mailto:help@example.com' },
  ])
  assert.deepEqual(
    parseAccountLinks('[{"label":"Wishlist","href":"/wishlist"},{"label":"X","href":"data:text/html,x"},{"label":1,"href":"/y"},null]'),
    [{ label: 'Wishlist', href: '/wishlist' }],
  )
  assert.deepEqual(parseAccountLinks(7), [])
  assert.deepEqual(parseAccountLinks('{"not":"a list"}'), [])
  assert.deepEqual(parseAccountLinks('[not json'), [])
})
