import { defineTheme } from '@tanqory/theme-kit'

/**
 * Single typed config for the theme. `data.mode: 'mock'` lets the theme run
 * fully offline against ./src/fixtures (no backend). Switch to 'live' + a
 * storefront token to fetch real data.
 */
export default defineTheme({
  name: 'nova',
  routes: {
    '/': 'index',
    '/products/:handle': 'product',
    '/collections': 'list-collections',
    '/collections/:handle': 'collection',
    '/cart': 'cart',
    '/search': 'search',
    '/contact': 'contact',
    '/pages/:handle': 'page',
    '/blogs/:handle': 'blog',
    '/blogs/:blog/:article': 'article',
    '/404': '404',
  },
  data: {
    mode: 'mock',
    endpoint: import.meta.env.TANQORY_BACKEND,
    token: import.meta.env.TANQORY_STOREFRONT_TOKEN,
  },
  tokens: './assets/tokens.css',
})
