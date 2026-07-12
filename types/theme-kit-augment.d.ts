// Local type augmentation for @tanqory/theme-kit fields that ship in the theme
// runtime (baked theme-kit) ahead of the published npm package. The runtime's
// DataApi already returns these; this keeps nova's local typecheck honest until
// the package is republished, after which this file can be deleted.
import type { ImageRef } from '@tanqory/theme-kit'

/** A product media node — image, video, 3D model, or external (YouTube/Vimeo) video. */
export interface NovaProductMedia {
  id: string
  type: 'image' | 'video' | 'model_3d' | 'external_video'
  alt?: string | null
  image?: ImageRef | null
  previewImage?: ImageRef | null
  sources?: { url: string; mimeType?: string | null; format?: string | null }[]
  host?: string | null
  embedUrl?: string | null
}

declare module '@tanqory/theme-kit' {
  interface Product {
    media?: NovaProductMedia[]
    isGiftCard?: boolean
    totalInventory?: number | null
  }
  interface ProductVariant {
    inventoryQuantity?: number | null
    inventoryPolicy?: 'DENY' | 'CONTINUE' | null
    barcode?: string | null
    requiresShipping?: boolean | null
    taxable?: boolean | null
    weight?: { value: number; unit: string } | null
  }
}
