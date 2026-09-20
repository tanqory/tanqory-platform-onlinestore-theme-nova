// Run: npm test  (node --test --experimental-strip-types)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { documentTitle, shopNameOf } from './head.ts'

// Production build 7270019a (2026-09-15): the header said ผ้าเก่าเล่าเรื่อง, the
// tab said "การจัดส่งและการคืนสินค้า — Demo-2".
test("the tab names the shop the theme names, then the store's own name", () => {
  assert.equal(shopNameOf('ผ้าเก่าเล่าเรื่อง', 'Demo-2'), 'ผ้าเก่าเล่าเรื่อง')
  assert.equal(shopNameOf('', 'Demo-2'), 'Demo-2')
  assert.equal(shopNameOf('   ', ' Demo-2 '), 'Demo-2')
  assert.equal(shopNameOf(undefined, undefined), 'Store')
  assert.equal(shopNameOf(42, null), 'Store')
})

test('a page title is its SEO title, else "<page> — <shop>", else the shop', () => {
  const shopName = shopNameOf('ผ้าเก่าเล่าเรื่อง', 'Demo-2')
  assert.equal(
    documentTitle({ resourceTitle: 'การจัดส่งและการคืนสินค้า', shopName }),
    'การจัดส่งและการคืนสินค้า — ผ้าเก่าเล่าเรื่อง',
  )
  assert.equal(
    documentTitle({ seoTitle: ' ติดต่อเรา | ร้าน ', resourceTitle: 'ติดต่อเรา', shopName }),
    'ติดต่อเรา | ร้าน',
  )
  assert.equal(documentTitle({ seoTitle: '  ', resourceTitle: null, shopName }), shopName)
})

test('every place that writes a title goes through the one rule', () => {
  // The precedence used to be an inline expression in three places; a fourth
  // copy is how one template ends up naming the store account instead.
  for (const file of ['../main.tsx', '../entry-server.tsx']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /shopName\s*\|\|\s*shop\??\.name/, `${file} inlines the shop-name precedence`)
    assert.match(source, /shopNameOf\(/, `${file} does not use shopNameOf`)
  }
})
