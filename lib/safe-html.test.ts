import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeSettingHtml } from './safe-html.ts'

test('keeps formatting the starter templates use', () => {
  const input = '<p>No articles yet. Add one from <strong>Online store → Blog posts</strong>.</p>'
  assert.equal(sanitizeSettingHtml(input), input)
  assert.equal(sanitizeSettingHtml('<ul><li>a</li><li>b</li></ul><br>'), '<ul><li>a</li><li>b</li></ul><br>')
})

test('drops tags outside the allow-list but keeps their text', () => {
  assert.equal(sanitizeSettingHtml('<div class="x"><script>alert(1)</script>hi</div>'), 'alert(1)hi')
  assert.equal(sanitizeSettingHtml('<img src=x onerror=alert(1)>text'), 'text')
  assert.equal(sanitizeSettingHtml('<svg><style>*{}</style></svg>ok'), '*{}ok')
  assert.equal(sanitizeSettingHtml('<iframe src="https://evil.test"></iframe>'), '')
})

test('strips every attribute from allowed tags', () => {
  assert.equal(sanitizeSettingHtml('<p onclick="x()" style="color:red">t</p>'), '<p>t</p>')
  assert.equal(sanitizeSettingHtml('<span data-a="1"\nonmouseover=alert(1)>t</span>'), '<span>t</span>')
})

test('links keep only a safe href', () => {
  assert.equal(
    sanitizeSettingHtml('<a href="/pages/about" target="_blank" onclick="x()">About</a>'),
    '<a href="/pages/about" rel="noopener">About</a>',
  )
  assert.equal(sanitizeSettingHtml('<a href="javascript:alert(1)">x</a>'), '<a>x</a>')
  assert.equal(sanitizeSettingHtml("<a href='java\tscript:alert(1)'>x</a>"), '<a>x</a>')
  assert.equal(sanitizeSettingHtml('<a href="https://a.test/?q=1&r=2">x</a>'), '<a href="https://a.test/?q=1&amp;r=2" rel="noopener">x</a>')
  assert.equal(sanitizeSettingHtml('<a href=mailto:hi@a.test>x</a>'), '<a href="mailto:hi@a.test" rel="noopener">x</a>')
})

test('removes comments, doctype and processing instructions', () => {
  assert.equal(sanitizeSettingHtml('<!-- c --><!doctype html><?xml v?>t'), 't')
  // An abruptly closed comment (`<!-->`) must not let a script through; the
  // greedy comment strip swallows the whole run, which is the safe outcome.
  assert.equal(sanitizeSettingHtml('<!--><script>alert(1)</script>-->'), '')
  assert.equal(sanitizeSettingHtml('<!--><script>alert(1)</script>'), 'alert(1)')
})

test('non-strings and empty values render nothing', () => {
  assert.equal(sanitizeSettingHtml(undefined), '')
  assert.equal(sanitizeSettingHtml(null), '')
  assert.equal(sanitizeSettingHtml(12), '')
  assert.equal(sanitizeSettingHtml(''), '')
})

test('a stray angle bracket that is not a tag is left as text', () => {
  assert.equal(sanitizeSettingHtml('1 < 2 and 3 > 2'), '1 < 2 and 3 > 2')
})
