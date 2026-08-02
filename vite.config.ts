import { defineConfig } from 'vite'
import { tanqoryThemeConfig } from '@tanqory/theme-kit/vite-preset'

// The theme dev/build config is shared by every Tanqory theme — the editor
// "Save" middleware, the "Add section" SSR preview endpoint, the storefront API
// proxy and the ingress host allow-lists all live in the kit's preset. Pass a
// second argument to shallow-merge theme-specific overrides.
export default defineConfig((ctx) => tanqoryThemeConfig(ctx))
