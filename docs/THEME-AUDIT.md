# Nova — Default Theme Readiness Review

วันที่ตรวจ: 16 กันยายน 2026

**ข้อสรุป: เหมาะเป็นฐานพัฒนาต่อและ internal beta แต่ยังไม่ควรเป็น production default ของทุกร้าน**

ธีมมีโครงสร้างที่ดี: React sections, JSON composition, block constraints/presets, shared product context และ semantic CSS tokens แต่ยังมีข้อผิดพลาดเรื่องความถูกต้องของสินค้า/หมวดหมู่ และ developer contract ที่ควรแก้ก่อนเพิ่มฟีเจอร์หรือปรับหน้าตา

## ขอบเขตและผลตรวจ

- อ่าน source, template, settings, manifest, build configuration และ dependency metadata ใน checkout นี้
- เปิด storefront แบบ mock ใน browser: desktop 1440×900 และ mobile 390×844
- ยืนยันการเลือกไซซ์ M → add to cart → เพิ่มจำนวนจาก 1 เป็น 2 → subtotal จาก $99 เป็น $198
- ยืนยัน URL สินค้าที่ไม่มีอยู่ยังแสดง Example product และปุ่มซื้อ
- ยืนยันหน้า /collections/sale แสดงรายการจาก all ตาม template
- เปิดภาษาไทย: footer labels แปลได้ แต่ search/system strings หลายส่วนยังเป็นอังกฤษ
- `npm run typecheck`: ไม่ผ่าน 36 errors — 34 จุดเกี่ยวกับ AttrSpec.group และ 2 จุดเกี่ยวกับ Shop.brand.fonts
- `npm run manifest:check`: ไม่ผ่าน (manifest stale) ยืนยันซ้ำหลังรันนอก sandbox แล้ว
- `vite build --outDir /private/tmp/nova-theme-audit-build`: ผ่าน ใช้ dependency ที่ติดตั้งอยู่แล้ว; JS 443.98 kB / gzip 128.13 kB, CSS 45.33 kB / gzip 8.70 kB
- ทดสอบ Vite bundling โดยตรง ไม่ได้รัน npm prebuild ที่จะเขียน manifest/README ใหม่
- ไม่มีการแก้ application code ระหว่างตรวจ

ข้อจำกัด: ไม่ได้ทดสอบ backend จริง, payment, Studio editor จริง, publish pipeline, fresh dependency installation, Safari/Firefox, screen reader หรือ Lighthouse/CWV จึงไม่ใช่การรับรอง production readiness หรือ accessibility compliance

---

## สถานะ Phase 1 — อัปเดต 16 กันยายน 2026

แก้ตามลำดับที่กำหนด (dependency → commerce → routing → content) พร้อม regression tests
สถานะแต่ละ finding อยู่ในตารางด้านล่าง หลักฐานคือคำสั่งที่รันจริงและไฟล์ที่แก้

**สรุป: P1 ทั้ง 7 ข้อปิดในระดับ mock/unit แล้ว — ยังไม่ใช่ production-ready เพราะยังไม่ได้ทดสอบกับ backend จริง**
(ดู "สิ่งที่ยังไม่ยืนยัน" ท้ายหัวข้อนี้)

### ผลการรันจริง

| คำสั่ง | ก่อน | หลัง |
|---|---|---|
| `pnpm install --frozen-lockfile` (clean copy, ไม่มี node_modules/tgz) | ล้มเหลว — npm lock ชี้ `file:./theme-kit` ที่ไม่มีอยู่ | ✅ ผ่าน — `@tanqory/theme-kit@0.1.3` จาก registry |
| `pnpm typecheck` | ❌ 36 errors (และซ่อนอีก 24 เพราะ `sections/` ไม่อยู่ใน tsconfig) | ✅ 0 errors โดย `sections/` `overlays/` `lib/` `scripts/` `tests/` อยู่ใน scope แล้ว |
| `pnpm manifest:check` | ❌ stale | ✅ ผ่าน + ตรวจ template drift เพิ่ม (fail CI) |
| `pnpm test` | ไม่มี | ✅ 103 tests / 5 files |
| `pnpm build` | ✅ | ✅ JS 449.9 kB / gzip 130.7 kB |
| Browser (desktop 1440×900 + mobile 390×844, mock data) | — | ✅ 20/20 checks, console ไม่มี error |

### สถานะราย finding

| # | Finding | สถานะ | หลักฐาน |
|---|---|---|---|
| P1-1 | Product URL ที่ไม่มีอยู่แสดงสินค้าอื่น | **fixed** | ลบ fallback `collectionByHandle('all').products[0]`; URL เป็น canonical, `attributes.product` ใช้ได้เฉพาะ editor; แยก loading / not-found. `sections/ProductDetails.tsx`. Tests: `tests/product-details.test.tsx` (4 เคส) + browser: `/products/audit-missing-product` → "Product not found", ไม่มีปุ่มซื้อ |
| P1-2 | Collection page ไม่ผูกกับ resource ใน URL | **fixed** | เพิ่ม `sections/MainCollection.tsx` อ่าน handle จาก route ผ่าน `collectionProducts` (pagination + not-found); `templates/collection.json` + `collection.featured.json` ชี้มาที่ section ใหม่. Tests: `tests/main-collection.test.tsx` (8 เคส) |
| P1-3 | Live-data failure กลายเป็น mock storefront | **fixed** | `main.tsx` คืน `{error}` แทน mock เมื่อ build ถูก configure; `entry-server.tsx` ให้ build ล้มเหลวแทนการ prerender จาก fixtures; เส้นแบ่งอยู่ที่ `lib/runtime.ts`. Tests: `tests/runtime-and-head.test.ts` |
| P1-4 | Invalid variant combination อาจซื้อ default variant | **fixed** | ตัด fallback `product.variantId` เมื่อสินค้ามี options; เพิ่ม state `pending / unavailable / ready`; ปุ่มซื้อ gate ที่ `ready` เท่านั้น. Tests: 3 เคสใน `tests/product-details.test.tsx` |
| P1-5 | Router และ template selection มีหลายแหล่ง | **fixed** | รวมเป็น `lib/routes.ts` แหล่งเดียว; `lookupTemplate` คืน `null` แทน `[]` (ของเดิม truthy ทำให้ `children` ไม่เคยถูก render); SPA ใช้ `resolvePageTemplate` จึงรักษา `templateSuffix`; head + route analytics ย้ายไป `lib/head.ts` / `lib/route-analytics.ts` และทำงานทุกครั้งที่เปลี่ยน route โดยไม่ส่งซ้ำ. Tests: 12 route + 12 head/analytics เคส; browser: SPA nav เปลี่ยน title + canonical, back/forward คืนค่าถูก |
| P1-6 | Dependency และ schema contract ยังไม่ reproducible | **fixed** | pnpm เป็น package manager เดียว (ลบ `package-lock.json`, เพิ่ม `packageManager` + `engines`); pin `@tanqory/theme-kit@^0.1.3` ซึ่ง publish แล้วจริง; ลบ `config/settings.ts` ที่ไม่มีใคร import (`settings.schema.ts` เป็น source เดียว); `tanqory.config.ts` tokens ชี้ `./assets/tokens.css`; tsconfig ครอบคลุมทุกไฟล์ที่ธีมส่งจริง |
| P1-7 | Demo content และคำกล่าวอ้างติดไปกับร้านจริง | **fixed** | ลบ "100% organic cotton" / "Free shipping on orders over $50" / "30-day returns" / "Ships in 24h" ออกจาก PDP — ใช้ metafield `custom.materials` / `custom.shipping` ของ merchant แทน; ลบ default claim ของ `announcement-bar` และ `feature-highlights`; แก้ starter content ใน `index.json` (USP columns + collection refs ที่ไม่มีจริง); `collection-item` แสดง placeholder เฉพาะใน editor. Test: `tests/theme-integrity.test.ts` กันไม่ให้กลับมา |

### แก้ที่เจ้าของ logic (theme-kit) ไม่ใช่ workaround ในธีม

ข้อความ typecheck 36 ข้อไม่ใช่ความผิดของธีม — เป็น type ของ kit ที่ประกาศไม่ครบ ตรวจแล้วพบว่า runtime
ของ kit เองใช้ field เหล่านี้อยู่ จึงแก้ที่ `tanqory-platform-onlinestore-kit` (ยังไม่ commit/publish):

| แก้อะไร | หลักฐานว่าเป็น contract จริง |
|---|---|
| `AttrSpec.group`, `AttrSpec.dynamic` | `scripts/manifest-entry.ts` จัดกลุ่ม editor panel ด้วย `group`; `dynamic-source.tsx` คือ UI ของ `dynamic` |
| `SectionDef.presets` + `SectionPreset` | `kit src/ssg.tsx` อ่าน `presets[0].blocks` อยู่แล้ว โดย cast ข้าม type |
| `'link_list'` ใน `AttrSpec['type']` | `studio-app/src/fields.tsx:113-114` รองรับทั้ง `'menu'` และ `'link_list'` |
| `Shop.brand.fonts` + `coverImage` (type + query + normalizer) | `store-api .../schema/shop.graphql:81,85` มี `coverImage` และ `fonts: [String!]!` แต่ bootstrap ของ kit ไม่ได้ select — `applyBrandFonts` จึงไม่เคยทำงานบนร้านจริง |
| `Product.descriptionHtml` ใน `PRODUCT_QUERY` | `product.graphql:26` มี `descriptionHtml @cost(value: 0)`; ธีมต้องยิง request ที่สองเพราะ kit ไม่ select |

ระหว่างที่ kit ยังไม่ release มีไฟล์ชั่วคราว `types/theme-kit-contract.d.ts` ประกาศเฉพาะ 3 member นี้
(type-only, ไม่มี `any`, ไม่ปิด check) พร้อมเงื่อนไขการลบเขียนไว้ในไฟล์

### สิ่งที่ยังไม่ยืนยัน / ยังติดขัด

1. **ยังไม่ได้ทดสอบกับ backend จริงเลย** ทุกอย่างข้างบนยืนยันด้วย mock fixtures + unit tests
   ข้อที่ต้อง verify กับร้านจริงก่อนเรียก production default:
   - P1-3: ทำให้ cell ตอบ error จริงแล้วดูว่าได้หน้า error ไม่ใช่ mock
   - P1-4: สินค้าที่มี option combination ไม่ครบ + stock เปลี่ยนระหว่างซื้อ
   - P1-5: สินค้าที่ merchant assign `templateSuffix` จริง (mock ไม่มี field นี้)
   - P1-7: metafield `custom.materials` / `custom.shipping` ของร้านจริง
   - Brand fonts / coverImage: ต้องรอ kit release ก่อนจึงจะเห็นผล
2. **`@tanqory/theme-kit@0.2.0` ไม่ได้ publish** registry มีถึง `0.1.3` เท่านั้น ของที่ติดตั้งอยู่เดิม
   มาจาก `tanqory-theme-kit-0.2.0.tgz` ที่ไม่ได้ commit จึง pin ที่ `^0.1.3` เพื่อให้ clean install ทำได้
   → เมื่อ branch `refactor/theme-kit-app-extraction` merge + publish แล้วค่อย bump
3. **แก้ใน kit ยังไม่ได้ commit และยังไม่ได้ publish** (ตามคำสั่ง ไม่ push/publish) ธีมจึงยังใช้ 0.1.3
   และยังคงยิง request `descriptionHtml` เพิ่ม 1 ครั้งต่อ PDP — โค้ดเตรียมไว้ให้หยุดยิงเองเมื่อ kit ใหม่มาถึง
4. **ยังไม่ได้ทดสอบ Studio editor จริง** (save/publish/undo), payment, Safari/Firefox, screen reader,
   Lighthouse/CWV — ข้อจำกัดเดิมของรายงานนี้ยังอยู่
5. **P2 / accessibility / performance ยังไม่แตะ** ยกเว้นที่พ่วงมากับ P1
   (gallery ยังซ้ำรูปเดียว 4 ครั้ง, thumbnail ยังไม่มี accessible name, search ยัง bootstrap-only,
   หน้า `/search` ยังไม่มี per-route title)
6. `vite.config.ts` editor save endpoint ยังไม่มี allowlist/auth — ยังเปิดอยู่ตามรายงานเดิม

## สิ่งที่ทำได้ดี

1. `.tsx` สำหรับ implementation และ `.json` สำหรับ merchant content แยกความรับผิดชอบได้เข้าใจง่าย
2. มี 61 section definitions (รวม 28 blocks), 18 templates, 34 settings ตาม catalog ไม่ใช่ 61 page sections อิสระทั้งหมด
3. `allowedBlocks` และ `presets` มีฐานรองรับ nested composition; ProductProvider แชร์ variant/quantity ระหว่าง PDP blocks
4. Design tokens ครอบคลุม color, typography, spacing, motion และ layering เหมาะกับการสร้าง preset ใหม่
5. Header, cart drawer และ primary CTA มีภาพรวมเรียบและอ่านง่าย; mobile cart วางยอดกับ checkout ไว้ด้านล่างชัดเจน
6. Drawer/Modal มี focus management, Escape และ scroll lock; tokens มี reduced-motion CSS
7. มี manifest generator และ check command ซึ่งเป็นฐานที่ดีสำหรับ tooling ของ editor/AI

## P1 — ต้องแก้ก่อนเป็น default

### 1. Product URL ที่ไม่มีอยู่กลับแสดงสินค้าอื่น

หลักฐาน: `sections/ProductDetails.tsx:50` เลือก attribute ก่อน URL และ fallback ไปสินค้าตัวแรกใน all ที่บรรทัด 51–54

ยืนยันใน browser ด้วย `/products/audit-missing-product`: แสดง Example product $99 พร้อมปุ่ม Add to cart แทน not-found

ผลกระทบ: ลูกค้าอาจเห็นและซื้อสินค้าคนละตัวกับลิงก์; preview override ยังขัดกับ schema label ที่บอกว่า URL canonical

แก้: ให้ URL เป็น canonical บน storefront; อนุญาต placeholder/override เฉพาะ editor; แยก loading, unavailable, not-found; จัด HTTP status ที่ hosting layer

ผ่านเมื่อ: valid/missing/deleted handle แสดงสถานะถูกต้อง และ product A → B ไม่มี state ของ A ค้าง

### 2. Collection page ไม่ผูกกับ resource ใน URL

หลักฐาน: `templates/collection.json:14` กำหนด collection เป็น all; `sections/FeaturedCollection.tsx` ใช้ attributes.collection โดยไม่ resolve pathname

ผลกระทบ: ทุก URL ที่ใช้ default collection template แสดงหมวด all; ไม่มี filter/sort/pagination ในหน้ารายการหลัก และ limit 24 ทำให้สินค้าส่วนเกินไม่มีเส้นทางเปิดต่อในหน้านี้

แก้: ทำ MainCollection ที่อ่าน route resource และรองรับ pagination/filter/sort; แยกจาก FeaturedCollection สำหรับ curated row

ผ่านเมื่อ: collection A/B ได้สินค้าและ heading ของตัวเอง; เปิดสินค้าหน้าที่สองได้; filter state อยู่ใน URL และ back/forward ทำงาน

### 3. Live-data failure กลายเป็น mock storefront

หลักฐาน: `main.tsx:459` และ `entry-server.tsx` catch live fetch failure แล้วใช้ createMockData

ผลกระทบ: API error สามารถแสดงสินค้า/ราคาตัวอย่างบนร้านจริงหรือฝังใน build ได้ ไม่ใช่แค่หน้าจอ error

แก้: explicit mock mode เฉพาะ dev/editor; production ใช้ error/retry หรือ last-known-good data ของร้านเดียวกัน; build ที่ต้องใช้ live data ต้อง fail เมื่อไม่มีข้อมูลที่เชื่อถือได้

ผ่านเมื่อ: API timeout/401/500 ไม่แสดง mock product ใน production

### 4. Invalid variant combination อาจซื้อ default variant

หลักฐาน: `ProductDetails.tsx:147` fallback selectedVariant.id ไป product.variantId; soldOut ใช้ product availability เมื่อหา selectedVariant ไม่เจอ

ผลกระทบ: สินค้าที่มี option combinations ไม่ครบอาจกดซื้อ variant ที่ไม่ตรงกับตัวเลือกบนจอได้ ข้อนี้เป็น source finding; mock ที่ทดสอบไม่มี fixture ครบสำหรับ reproduce sparse combinations

แก้: เมื่อมี options ต้องมี selectedVariant ที่ตรงและขายได้ก่อนเปิดปุ่ม; ระหว่างโหลด variants ให้แสดง pending; ไม่ fallback เป็น variant อื่น

ผ่านเมื่อ: ชุดทดสอบหลาย options มี available, sold-out และ nonexistent combinations และส่ง variantId ตรงทุกกรณี

### 5. Router และ template selection มีหลายแหล่ง

หลักฐาน: route maps อยู่ใน `tanqory.config.ts`, `main.tsx`, `layouts/layout.tsx:42`; `main.tsx` resolve templateSuffix แต่ `layout.tsx:814` โหลด base template ใหม่และ render แทน children ที่บรรทัด 864 เมื่อเปิด SPA ซึ่งเป็นค่าเริ่มต้น

ผลกระทบ: template เฉพาะ resource มีเส้นทางถูกแทนที่ด้วย base template; applyHead และ route analytics ใน main ทำงานตอน boot แต่ไม่มี route-change hook ในโค้ดธีมที่ตรวจ

แก้: ใช้ route/resource/template resolver กลาง รับผิดชอบ data loading, templateSuffix, metadata, focus และ analytics; ทดสอบทั้ง direct navigation และ SPA

ผ่านเมื่อ: direct, click, back/forward ได้ template, title, canonical และ resource เดียวกัน; query-only search navigation เปลี่ยนผลจริง

### 6. Dependency และ schema contract ยังไม่ reproducible

หลักฐาน:

- `package.json:17`: theme-kit ^0.1.1
- pnpm lock: 0.1.1
- npm lock: file:./theme-kit ซึ่งไม่มี directory นี้ใน checkout
- installed package: 0.2.0
- typecheck และ manifest check ไม่ผ่าน
- `config/settings.ts` กับ `config/settings.schema.ts` มี definitions ซ้ำ; generator ใช้ settings.schema
- `tanqory.config.ts` ชี้ tokens ไป ./src/theme/tokens.css แต่ไฟล์จริงอยู่ assets/tokens.css

แก้: เลือก package manager เดียว, pin supported kit contract, ทำ clean install ใน CI, ให้ settings schema มี source of truth เดียว และ validate template setting keys/allowedBlocks ด้วย

ผ่านเมื่อ: clone ใหม่ → frozen install → typecheck → manifest check → build สำเร็จโดยไม่พึ่งไฟล์ local ที่ไม่ได้ commit

### 7. Demo content และคำกล่าวอ้างติดไปกับร้านจริง

หลักฐาน: `templates/index.json:132` เป็นต้นไปอ้าง test-collection, blazer, christmas-collection ที่ mock ไม่มี; แสดง not found ให้ลูกค้าเห็น ส่วน `ProductDetails.tsx:244`, `:309`, `:327` hardcode ships in 24h, organic cotton, free shipping/returns

ผลกระทบ: ข้อมูลสินค้าและนโยบายอาจไม่ตรงกับร้าน โดยเฉพาะร้านที่ไม่ใช่เสื้อผ้า

แก้: starter content ที่เป็นกลาง; policy/materials จาก merchant data/dynamic sources; section ที่ไม่มี resource ให้มี editor placeholder แต่ซ่อนหรือใช้ shopper empty state ที่เหมาะสมบน storefront

## P2 — UX/UI และความครบของสินค้า

| ประเด็น | หลักฐาน/ผลกระทบ | แนวทาง |
|---|---|---|
| Gallery ไม่ใช่รูปจริงหลายรูป | ProductDetails:139 สร้าง array จาก variantImage เดียวซ้ำ 4 ครั้ง; browser เห็น thumbnails ซ้ำ | อ่าน product media, variant association, zoom และ video ตาม contract |
| Mobile buy flow ยาว | ที่ 390×844 ภาพและ thumbnails ใช้พื้นที่จน title/price อยู่ล่างจอแรก ปุ่มซื้ออยู่ถัดลงไป | ลด gallery footprint; เอา thumbnails ซ้ำออก; พิจารณา sticky buy bar พร้อม variant/price |
| Home เน้น hero ก่อนสินค้า | desktop 1440×900 เห็น hero และ trust section ก่อน product grid | ลด hero height หรือทำ compact preset; นำสินค้า/หมวดให้ถึงผู้ซื้อเร็วขึ้น |
| Search ครอบคลุมแค่ bootstrap | SearchResults และ SearchModal filter title จาก collection all; modal กลับบอกว่าค้น products, collections, pages | ใช้ search API ร่วมกัน พร้อม loading/error/empty; ข้อความตรงกับสิ่งที่ค้นได้จริง |
| Cart error UX ไม่ชัด | ProductDetails add ใช้ try/finally ไม่มี catch/error UI; quantity/remove callbacks ไม่มี pending/error UI ใน theme | แสดง inline error/live announcement และ retry; ป้องกัน duplicate/racing updates โดยร่วมกับ kit |
| หน้าสินค้า default ยังไม่ใช้ blocks | templates/product.json ไม่ใส่ blocks จึงใช้ hardcoded fallback UI | ส่ง default template ที่ประกอบ title/price/options/quantity/add/description เป็น blocks จริง |
| i18n ไม่ทั่วถึง | AddToCart, ContactForm, FeaturedCollection, overlays มี system strings อังกฤษ; html lang เริ่ม en และไม่พบตัวอัปเดตใน theme | แยก system translation ออกจาก merchant content; sync lang/dir และ locale; แสดงเฉพาะภาษาที่รองรับ |
| Market label ไม่ตรงราคาใน mock | หน้าแสดง Thailand/THB แต่สินค้า $99; ไม่ใช่หลักฐานว่า live currency ผิด | ทำ mock localization ที่สอดคล้อง และทดสอบ live currency แยก; fallback fetch ของ FeaturedCollection ต้องส่ง country/locale เหมือน data layer |
| Form integration ยังไม่ยืนยัน | ContactForm/Newsletter POST ไป /_api/contact และ /_api/newsletter; repo ไม่มี handler หรือ success/error flow | กำหนด platform contract และทดสอบกับ ingress/API จริงก่อนเปิดใช้ |

## Accessibility และ performance

- Product thumbnail buttons ไม่มี accessible name (ยืนยันจาก browser AX tree); ใส่ชื่อรูป/ลำดับและสถานะ selected
- Slideshow auto-advance หยุดเฉพาะ mouse hover; ไม่มี pause control/focus pause/reduced-motion logic ฝั่ง timer และ slide นอกจอยังมี link ใน tree
- หน้าแรก default ไม่มี h1; ไม่พบ skip link; ทดสอบ keyboard focus หลัง SPA navigation เพิ่ม
- มี focus trap และ reduced-motion CSS อยู่แล้ว แต่ยังไม่ควรเรียกว่า WCAG ผ่าน เพราะไม่ได้ตรวจเต็มรูปแบบ
- ImageResponsive ยังไม่มี srcset; width/height optional และ PDP hero ใช้ default lazy loading ควรให้ภาพหลัก eager/high priority พร้อม responsive sizing
- sections ทั้งหมด import eager และรวมเป็น JS bundle เดียวใน build ที่ตรวจ; จัด performance budget และวัดบน production data ก่อนเลือกรูปแบบ splitting
- build ปกติที่ตรวจสร้าง index.html โดย root ว่าง; มี entry-server.tsx แต่ Vite build config นี้ไม่ได้เรียก prerender จึงต้องตรวจ external publish pipeline ก่อนสรุปว่าร้านจริงมี SSR/SSG ครบ
- ไม่พบ Product/Breadcrumb structured data ใน theme source ที่ตรวจ; metadata client-only ไม่พอสำหรับ social crawlers ทุกตัว ควรทดสอบ HTML response ของ product/collection/article จริง
- ไม่ได้วัด Lighthouse หรือ Core Web Vitals จึงไม่ให้คะแนน performance จากขนาด bundle เพียงอย่างเดียว

## Theme developer experience ที่ควรทำต่อ

แนวทางควรเป็น: platform kit ดูแล runtime/commerce; theme developer ดูแล presentation/schema/composition

1. ย้าย router, bootstrap, localization, metadata, analytics, consent integration และ editor transport เข้าชั้น runtime ของ theme-kit พร้อม public APIs ที่เสถียร ปัจจุบัน main.tsx 611 บรรทัดและ layout.tsx 1,094 บรรทัด ทำให้ผู้ fork ธีมรับภาระ platform code มาก
2. รวม GraphQL/data access ผ่าน kit แทน section ทำ fetch พร้อม header เอง เพื่อให้ country/locale/token/cache/error semantics เหมือนกัน
3. สร้าง reusable ProductCard, ProductGallery, VariantPicker และ commerce feedback primitives ลด behavior ที่แตกต่างกันข้าม sections
4. Expose design settings ที่ใช้งานจริง: typography, color schemes, container width, spacing density, button/card style และ mobile options; tokens อย่างเดียวไม่เท่ากับ merchant ปรับผ่าน editor ได้
5. ทำ typed attributes/schema inference, default normalization และ template validator ที่จับ unknown settings เช่น columns ใน FeaturedCollection
6. กำหนด schema/content version, migration และวิธี merge theme updates โดยรักษา merchant customizations พร้อม compatibility matrix ของ theme-kit
7. เพิ่ม developer guide แบบทำตามได้: สร้าง section, nested blocks, dynamic source, localization, media, async data, preview, publish และ upgrade; มี fixtures สำหรับ empty/large catalog, Thai/long text, variants และ network error
8. วาง CI gate สำหรับ clean install, typecheck, manifest consistency และ focused integration/E2E tests ของ purchase flow, routing และ editor save/publish

### Editor save boundary ที่ต้องตรวจเพิ่มเติมก่อนเปิด remote preview

`vite.config.ts:18` รับ page/doc แล้วเขียน `join(cwd, 'templates', page + '.json')` โดยไม่มี allowlist/path containment หรือ authentication check ใน middleware นี้; allowedHosts เป็น true

มีความเสี่ยงต่อ path traversal และ unauthorized writes หาก endpoint เข้าถึงได้โดยไม่มี gateway authorization ต้อง validate page/doc, จำกัด body size และตรวจ authentication/origin ตาม deployment contract ย้ายส่วนนี้ไป trusted tooling service ได้

นี่เป็นข้อสังเกตจาก source ไม่ได้ทดสอบโจมตีหรือยืนยันว่า production endpoint เปิดสาธารณะ

## เกณฑ์ออก default release

1. P1 ทั้งหมดปิดพร้อม regression tests ของ missing product, correct collection, invalid variants, API failure และ template suffix
2. Fresh install + CI ผ่านด้วย dependency set เดียวกัน
3. ซื้อสินค้าทดสอบบน staging ได้ครบ product → cart → checkout โดยราคา/variant/currency ตรงกัน รวม sold-out และ stock เปลี่ยนระหว่างซื้อ
4. Studio editor เพิ่ม/ย้าย/ลบ block, undo/redo, save, reload, publish แล้วผลตรงกัน และ upgrade ยังรักษา merchant content
5. ทดสอบ mobile 320/390/768 และ desktop, long Thai content, keyboard-only, zoom และ reduced motion
6. ตรวจ server HTML/status/SEO ของ home, product, collection, article, missing resource รวม canonical/social metadata
7. วัด production build กับ real assets/API; ไม่มี high-impact accessibility failures และผ่าน performance budget ที่ทีมกำหนด

ลำดับทำงานที่แนะนำ: commerce correctness + reproducibility → runtime/template consolidation → merchant UX + accessibility → performance + presets → controlled merchant beta

## เทียบแนวคิด Horizon

Nova มีพื้นฐาน blocks/composition อยู่ในทิศทางที่เหมาะสม สิ่งที่ควรยึดจาก Horizon คือความน่าเชื่อถือของ runtime, server-rendered content, progressive enhancement และ automated checks มากกว่าจำนวน sections หรือหน้าตาคล้ายกัน ดู [Horizon official README](https://github.com/Shopify/horizon/blob/main/README.md)

ใช้ [Shopify Theme Store requirements](https://shopify.dev/docs/storefronts/themes/store/requirements) เป็น benchmark เรื่อง shopping UX/accessibility/customization และ [block best practices](https://shopify.dev/docs/storefronts/themes/architecture/blocks/best-practices) เป็นแนวทาง composition; ไม่ใช่ข้อบังคับว่าระบบ Tanqory ต้องใช้ Liquid หรือทำเหมือน Shopify ทุกอย่าง
