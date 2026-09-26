import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// SSR entry for the Tanqory runtime (spec v1): dist/ssr/entry.mjs, one file,
// everything bundled — the isolate has no node_modules and no Node built-ins.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  ssr: { noExternal: true, target: 'webworker' },
  resolve: { conditions: ['workerd', 'worker', 'browser', 'module', 'import', 'default'] },
  build: {
    ssr: 'entry.ts',
    outDir: 'dist/ssr',
    emptyOutDir: true,
    target: 'es2022',
    minify: false,
    sourcemap: false,
    rollupOptions: { output: { entryFileNames: 'entry.mjs', format: 'es', inlineDynamicImports: true } },
  },
})
