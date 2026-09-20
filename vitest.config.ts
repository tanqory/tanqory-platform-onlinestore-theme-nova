import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Tests run under the same Vite pipeline the theme builds with, so
 * `import.meta.glob`, JSON imports and JSX resolve exactly as they do in the
 * app. `jsdom` gives the sections a `window.location` to route against.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
})
