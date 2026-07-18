import { jsx, Fragment } from "react/jsx-runtime";
import { renderToString } from "react-dom/server";
import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
const SettingsContext = createContext({});
const LocaleContext = createContext({});
function ThemeProvider({
  settings = {},
  locale = {},
  children
}) {
  return /* @__PURE__ */ jsx(SettingsContext.Provider, { value: settings, children: /* @__PURE__ */ jsx(LocaleContext.Provider, { value: locale, children }) });
}
function useSettings() {
  return useContext(SettingsContext);
}
function useT() {
  const locale = useContext(LocaleContext);
  return (key) => locale[key] ?? key;
}
const registry = /* @__PURE__ */ new Map();
function registerSections(defs) {
  for (const def of defs) registry.set(def.name, def);
}
function getSection(name) {
  return registry.get(name);
}
function allSections() {
  return [...registry.values()];
}
function resolveAttributes(def, settings) {
  const out = { ...settings ?? {} };
  for (const [key, spec] of Object.entries(def.attributes ?? {})) {
    if (out[key] === void 0 && spec.default !== void 0) out[key] = spec.default;
  }
  return out;
}
function normalizeBlocks(blocks, order) {
  if (Array.isArray(blocks)) return blocks;
  if (blocks && typeof blocks === "object") {
    const nodes = [];
    const byRef = /* @__PURE__ */ new Map();
    for (const [key, raw] of Object.entries(blocks)) {
      if (!raw || typeof raw !== "object" || typeof raw.type !== "string") continue;
      const node = { ...raw, id: raw.id ?? key };
      nodes.push(node);
      byRef.set(key, node);
      if (node.id) byRef.set(node.id, node);
    }
    if (Array.isArray(order) && order.length) {
      const ordered = [];
      const used = /* @__PURE__ */ new Set();
      for (const ref of order) {
        const n = byRef.get(ref);
        if (n && !used.has(n)) {
          ordered.push(n);
          used.add(n);
        }
      }
      for (const n of nodes) if (!used.has(n)) ordered.push(n);
      return ordered;
    }
    return nodes;
  }
  return [];
}
function RenderNode({
  node,
  path
}) {
  const def = getSection(node.type);
  if (!def) {
    console.warn(`[tanqory] unknown section "${node.type}"`);
    return null;
  }
  const Comp = def.component;
  const attributes = resolveAttributes(def, node.settings);
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-tq-section-id": node.id,
      "data-tq-section-type": node.type,
      "data-tq-path": path,
      style: { display: "contents" },
      children: /* @__PURE__ */ jsx(Comp, { attributes, children: normalizeBlocks(node.blocks, node.order).map(
        (child, i) => /* @__PURE__ */ jsx(RenderNode, { node: child, path: `${path}.${i}` }, child.id ?? i)
      ) })
    }
  );
}
function SectionTree({ tree }) {
  return /* @__PURE__ */ jsx(Fragment, { children: tree.map((node, i) => /* @__PURE__ */ jsx(RenderNode, { node, path: String(i) }, node.id ?? i)) });
}
const EMPTY_PAGE_INFO = {
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: null,
  endCursor: null
};
function normalizePageInfo(n) {
  if (!n) return EMPTY_PAGE_INFO;
  return {
    hasNextPage: Boolean(n.hasNextPage),
    hasPreviousPage: Boolean(n.hasPreviousPage),
    startCursor: n.startCursor ?? null,
    endCursor: n.endCursor ?? null
  };
}
function normalizeFilters(arr) {
  return (arr ?? []).map((f) => ({
    id: f.id,
    label: f.label,
    type: f.type,
    values: (f.values ?? []).map((v) => ({
      id: v.id,
      label: v.label,
      count: Number(v.count ?? 0),
      input: typeof v.input === "string" ? v.input : JSON.stringify(v.input)
    }))
  }));
}
const MENU_FIELDS = (
  /* GraphQL */
  `
  fragment MenuFields on Menu {
    id
    handle
    title
    items {
      ...MenuItemFields
      items { ...MenuItemFields items { ...MenuItemFields } }
    }
  }
  fragment MenuItemFields on MenuItem { id title url type resourceId }
`
);
const ARTICLE_FIELDS = (
  /* GraphQL */
  `
  fragment ArticleFields on Article {
    id
    handle
    title
    excerpt
    contentHtml
    image { url altText }
    author: authorV2 { name }
    publishedAt
    tags
    seo { title description keywords }
    templateSuffix
  }
`
);
const PRODUCT_CARD = (
  /* GraphQL */
  `
  fragment ProductCard on Product {
    id
    handle
    title
    availableForSale
    vendor
    productType
    tags
    featuredImage { url altText }
    priceRange { minVariantPrice { amount currencyCode } }
    compareAtPriceRange { maxVariantPrice { amount currencyCode } }
    firstAvailableVariant { id }
  }
`
);
const CUSTOMER_FIELDS = (
  /* GraphQL */
  `
  fragment AddressFields on MailingAddress {
    id firstName lastName company address1 address2 city province country zip phone
    formatted(withName: true)
  }
  fragment CustomerFields on Customer {
    id email firstName lastName displayName phone acceptsMarketing numberOfOrders
    defaultAddress { ...AddressFields }
    addresses(first: 20) { nodes { ...AddressFields } }
  }
`
);
const ORDER_FIELDS = (
  /* GraphQL */
  `
  fragment OrderFields on Order {
    id name orderNumber processedAt financialStatus fulfillmentStatus statusUrl
    currentTotalPrice { amount currencyCode }
    lineItems(first: 50) {
      nodes {
        title variantTitle quantity
        discountedTotalPrice { amount currencyCode }
        variant { image { url altText } }
      }
    }
  }
`
);
const ZERO = { amount: "0", currencyCode: "USD" };
function img(node) {
  if (!node || !node.url) return null;
  return node.altText ? { url: node.url, altText: node.altText } : { url: node.url };
}
function normalizeMenuItem(n) {
  return {
    id: n.id,
    title: n.title,
    url: n.url ?? null,
    type: n.type,
    resourceId: n.resourceId ?? null,
    items: (n.items ?? []).map(normalizeMenuItem)
  };
}
function normalizeMenu(n) {
  if (!n) return null;
  return { id: n.id, handle: n.handle, title: n.title, items: (n.items ?? []).map(normalizeMenuItem) };
}
function normalizeArticle(n, blogHandle) {
  return {
    id: n.id,
    handle: n.handle,
    title: n.title,
    excerpt: n.excerpt ?? null,
    contentHtml: n.contentHtml ?? "",
    image: img(n.image),
    author: n.author?.name ?? null,
    ...n.publishedAt ? { publishedAt: n.publishedAt } : {},
    tags: n.tags ?? [],
    ...blogHandle ? { blogHandle } : {},
    ...n.seo ? { seo: { title: n.seo.title ?? null, description: n.seo.description ?? null, keywords: n.seo.keywords ?? [] } } : {},
    ...n.templateSuffix ? { templateSuffix: n.templateSuffix } : {}
  };
}
function normalizeMetaobject(n) {
  const fields = (n.fields ?? []).map((f) => ({
    key: f.key,
    value: f.value ?? null,
    type: f.type
  }));
  const values = {};
  for (const f of fields) values[f.key] = f.value;
  return { id: n.id, handle: n.handle, type: n.type, fields, values };
}
function normalizeAddress(n) {
  return {
    id: n.id,
    firstName: n.firstName ?? null,
    lastName: n.lastName ?? null,
    company: n.company ?? null,
    address1: n.address1 ?? null,
    address2: n.address2 ?? null,
    city: n.city ?? null,
    province: n.province ?? null,
    country: n.country ?? null,
    zip: n.zip ?? null,
    phone: n.phone ?? null,
    formatted: n.formatted ?? []
  };
}
function normalizeCustomer(n) {
  return {
    id: n.id,
    email: n.email ?? null,
    firstName: n.firstName ?? null,
    lastName: n.lastName ?? null,
    displayName: n.displayName ?? "",
    phone: n.phone ?? null,
    acceptsMarketing: Boolean(n.acceptsMarketing),
    numberOfOrders: Number(n.numberOfOrders ?? 0),
    defaultAddress: n.defaultAddress ? normalizeAddress(n.defaultAddress) : null,
    addresses: (n.addresses?.nodes ?? []).map(normalizeAddress)
  };
}
function normalizeOrder(n) {
  return {
    id: n.id,
    name: n.name,
    orderNumber: Number(n.orderNumber ?? 0),
    processedAt: n.processedAt,
    financialStatus: n.financialStatus ?? null,
    fulfillmentStatus: n.fulfillmentStatus ?? "UNFULFILLED",
    totalPrice: n.currentTotalPrice ?? ZERO,
    statusUrl: n.statusUrl ?? "",
    lineItems: (n.lineItems?.nodes ?? []).map((li) => ({
      title: li.title,
      variantTitle: li.variantTitle ?? null,
      quantity: Number(li.quantity ?? 0),
      image: img(li.variant?.image),
      totalPrice: li.discountedTotalPrice ?? ZERO
    }))
  };
}
function normalizeShopPolicy(n) {
  if (!n) return null;
  return { handle: n.handle, title: n.title, url: n.url, ...n.body ? { body: n.body } : {} };
}
function normalizeShop(n) {
  if (!n) return null;
  return {
    name: n.name,
    description: n.description ?? null,
    brand: n.brand ? {
      logo: img(n.brand.logo),
      squareLogo: img(n.brand.squareLogo),
      coverImage: img(n.brand.coverImage),
      slogan: n.brand.slogan ?? null,
      shortDescription: n.brand.shortDescription ?? null,
      // Colour groups arrive as arrays and can be empty; keep the shape
      // stable so a theme can index `primary[0]` without guarding twice.
      colors: n.brand.colors ? {
        primary: n.brand.colors.primary ?? [],
        secondary: n.brand.colors.secondary ?? []
      } : null
    } : null,
    policies: {
      privacy: normalizeShopPolicy(n.privacyPolicy),
      refund: normalizeShopPolicy(n.refundPolicy),
      termsOfService: normalizeShopPolicy(n.termsOfService),
      shipping: normalizeShopPolicy(n.shippingPolicy),
      subscription: normalizeShopPolicy(n.subscriptionPolicy)
    },
    cookieBanner: n.cookieBanner ? {
      enabled: Boolean(n.cookieBanner.enabled),
      dataSharingTitle: n.cookieBanner.dataSharingTitle ?? null,
      dataSharingVisible: n.cookieBanner.dataSharingVisible !== false,
      title: n.cookieBanner.title ?? null,
      body: n.cookieBanner.body ?? null,
      acceptLabel: n.cookieBanner.acceptLabel ?? null,
      declineLabel: n.cookieBanner.declineLabel ?? null,
      manageLabel: n.cookieBanner.manageLabel ?? null,
      position: n.cookieBanner.position ?? null,
      colorTheme: n.cookieBanner.colorTheme ?? null
    } : null,
    primaryDomain: n.primaryDomain ? {
      host: n.primaryDomain.host,
      url: n.primaryDomain.url,
      sslEnabled: Boolean(n.primaryDomain.sslEnabled)
    } : null,
    paymentSettings: n.paymentSettings ? {
      acceptedCardBrands: n.paymentSettings.acceptedCardBrands ?? [],
      supportedDigitalWallets: n.paymentSettings.supportedDigitalWallets ?? [],
      currencyCode: n.paymentSettings.currencyCode ?? null
    } : null
  };
}
function errs(arr) {
  return (arr ?? []).map((e) => e?.message).filter((m) => Boolean(m));
}
const BOOTSTRAP_SHOP_MENU = (
  /* GraphQL */
  `
  shop {
    name
    description
    # Ask for the whole brand, not a third of it. Settings → Brand persists a
    # logo, a square logo and brand colours; the SDL has carried them all along
    # and this selection took only logo/slogan/shortDescription, so a merchant
    # could upload a logo and set colours and their storefront never changed.
    # Nullable throughout (BrandColorGroup.background/foreground are String),
    # so an unconfigured store returns nulls rather than failing the query.
    brand {
      logo { url altText }
      squareLogo { url altText }
      coverImage { url altText }
      slogan
      shortDescription
      colors {
        primary { background foreground }
        secondary { background foreground }
      }
    }
    privacyPolicy { handle title url }
    refundPolicy { handle title url }
    termsOfService { handle title url }
    shippingPolicy { handle title url }
    subscriptionPolicy { handle title url }
    cookieBanner { enabled dataSharingTitle dataSharingVisible title body acceptLabel declineLabel manageLabel position colorTheme }
    primaryDomain { host url sslEnabled }
    paymentSettings { acceptedCardBrands supportedDigitalWallets currencyCode }
  }
  mainMenu: menu(handle: "main-menu") { ...MenuFields }
  footerMenu: menu(handle: "footer") { ...MenuFields }
`
);
const BOOTSTRAP_SHOP_MENU_FRAGMENTS = MENU_FIELDS;
function readBootstrapShopMenu(boot) {
  const menus = /* @__PURE__ */ new Map();
  const main = normalizeMenu(boot?.mainMenu);
  if (main) menus.set("main-menu", main);
  const footer = normalizeMenu(boot?.footerMenu);
  if (footer) menus.set("footer", footer);
  return { shop: normalizeShop(boot?.shop), menus };
}
function createStorefrontMethods(graphql, helpers, menuCache) {
  const { normalizeProduct: normalizeProduct2 } = helpers;
  const fetchMenu = async (handle) => {
    const cached = menuCache.get(handle);
    if (cached) return cached;
    const res = await graphql(
      `${MENU_FIELDS}
 query Menu($handle: String!) { menu(handle: $handle) { ...MenuFields } }`,
      { handle }
    );
    const menu = normalizeMenu(res?.menu);
    if (menu) menuCache.set(handle, menu);
    return menu;
  };
  const search = async (query, opts) => {
    const res = await graphql(
      `${PRODUCT_CARD}${ARTICLE_FIELDS}
       query Search($query: String!, $first: Int!, $after: String, $types: [SearchType!]) {
         search(query: $query, first: $first, after: $after, types: $types) {
           totalCount
           productFilters { id label type values { id label count input } }
           pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
           nodes {
             __typename
             ... on Product { ...ProductCard }
             ... on Page { handle title }
             ... on Article { ...ArticleFields }
           }
         }
       }`,
      { query, first: opts?.first ?? 24, after: opts?.after ?? null, types: opts?.types ?? null }
    );
    const s = res?.search ?? {};
    const nodes = s.nodes ?? [];
    return {
      totalCount: Number(s.totalCount ?? 0),
      products: nodes.filter((n) => n.__typename === "Product").map(normalizeProduct2),
      pages: nodes.filter((n) => n.__typename === "Page").map((n) => ({ handle: n.handle, title: n.title })),
      articles: nodes.filter((n) => n.__typename === "Article").map((n) => normalizeArticle(n)),
      filters: normalizeFilters(s.productFilters),
      pageInfo: normalizePageInfo(s.pageInfo)
    };
  };
  const collectionProducts = async (handle, opts) => {
    const res = await graphql(
      `${PRODUCT_CARD}
       query CollectionProducts(
         $handle: String!, $first: Int!, $after: String,
         $sortKey: ProductCollectionSortKey, $reverse: Boolean, $filters: [ProductFilterInput!]
       ) {
         collection(handle: $handle) {
           products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, filters: $filters) {
             nodes { ...ProductCard }
             filters { id label type values { id label count input } }
             pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
           }
         }
       }`,
      {
        handle,
        first: opts?.first ?? 24,
        after: opts?.after ?? null,
        sortKey: opts?.sortKey ?? null,
        reverse: opts?.reverse ?? null,
        filters: opts?.filters ?? null
      }
    );
    const c = res?.collection?.products ?? {};
    return {
      products: (c.nodes ?? []).map(normalizeProduct2),
      filters: normalizeFilters(c.filters),
      pageInfo: normalizePageInfo(c.pageInfo)
    };
  };
  const predictiveSearch = async (query, opts) => {
    const res = await graphql(
      `${PRODUCT_CARD}${ARTICLE_FIELDS}
       query Predictive($query: String!, $limit: Int!) {
         predictiveSearch(query: $query, limit: $limit) {
           queries { text }
           products { ...ProductCard }
           collections { handle title image { url altText } }
           pages { handle title }
           articles { ...ArticleFields }
         }
       }`,
      { query, limit: opts?.limit ?? 4 }
    );
    const ps = res?.predictiveSearch ?? {};
    return {
      queries: (ps.queries ?? []).map((q) => q.text),
      products: (ps.products ?? []).map(normalizeProduct2),
      collections: (ps.collections ?? []).map((c) => ({
        handle: c.handle,
        title: c.title,
        image: img(c.image)
      })),
      pages: (ps.pages ?? []).map((p) => ({ handle: p.handle, title: p.title })),
      articles: (ps.articles ?? []).map((a) => normalizeArticle(a))
    };
  };
  const productRecommendations = async (productId) => {
    const res = await graphql(
      `${PRODUCT_CARD}
       query Recs($productId: ID!) {
         productRecommendations(productId: $productId) { ...ProductCard }
       }`,
      { productId }
    );
    return (res?.productRecommendations ?? []).map(normalizeProduct2);
  };
  const blogByHandle = async (handle, opts) => {
    const res = await graphql(
      `${ARTICLE_FIELDS}
       query Blog($handle: String!, $first: Int!) {
         blog(handle: $handle) {
           id handle title
           seo { title description keywords }
           templateSuffix
           articles(first: $first) { nodes { ...ArticleFields } }
         }
       }`,
      { handle, first: opts?.articles ?? 20 }
    );
    const b = res?.blog;
    if (!b) return null;
    return {
      id: b.id,
      handle: b.handle,
      title: b.title,
      articles: (b.articles?.nodes ?? []).map((a) => normalizeArticle(a, b.handle)),
      ...b.seo ? { seo: { title: b.seo.title ?? null, description: b.seo.description ?? null, keywords: b.seo.keywords ?? [] } } : {},
      ...b.templateSuffix ? { templateSuffix: b.templateSuffix } : {}
    };
  };
  const articleByHandle = async (blogHandle, articleHandle) => {
    const res = await graphql(
      `${ARTICLE_FIELDS}
       query Article($handle: ArticleHandleInput!) {
         article(handle: $handle) { ...ArticleFields }
       }`,
      { handle: { blogHandle, articleHandle } }
    );
    return res?.article ? normalizeArticle(res.article, blogHandle) : null;
  };
  const metaobject = async (type, handle) => {
    const res = await graphql(
      `query Metaobject($handle: MetaobjectHandleInput!) {
         metaobject(handle: $handle) { id handle type fields { key value type } }
       }`,
      { handle: { type, handle } }
    );
    return res?.metaobject ? normalizeMetaobject(res.metaobject) : null;
  };
  const metaobjects = async (type, opts) => {
    const res = await graphql(
      `query Metaobjects($type: String!, $first: Int!) {
         metaobjects(type: $type, first: $first) {
           nodes { id handle type fields { key value type } }
         }
       }`,
      { type, first: opts?.first ?? 50 }
    );
    return (res?.metaobjects?.nodes ?? []).map(normalizeMetaobject);
  };
  const customer = {
    async login(email, password) {
      const res = await graphql(
        `mutation Login($input: CustomerAccessTokenCreateInput!) {
           customerAccessTokenCreate(input: $input) {
             customerAccessToken { accessToken expiresAt }
             customerUserErrors { message }
           }
         }`,
        { input: { email, password } }
      );
      const p = res?.customerAccessTokenCreate;
      return {
        token: p?.customerAccessToken?.accessToken ?? null,
        expiresAt: p?.customerAccessToken?.expiresAt ?? null,
        errors: errs(p?.customerUserErrors)
      };
    },
    async logout(token) {
      await graphql(
        `mutation Logout($t: String!) {
           customerAccessTokenDelete(customerAccessToken: $t) { deletedAccessToken userErrors { message } }
         }`,
        { t: token }
      );
    },
    async renew(token) {
      const res = await graphql(
        `mutation Renew($t: String!) {
           customerAccessTokenRenew(customerAccessToken: $t) {
             customerAccessToken { accessToken expiresAt }
             userErrors { message }
           }
         }`,
        { t: token }
      );
      const p = res?.customerAccessTokenRenew;
      return {
        token: p?.customerAccessToken?.accessToken ?? null,
        expiresAt: p?.customerAccessToken?.expiresAt ?? null,
        errors: errs(p?.userErrors)
      };
    },
    async register(input) {
      const res = await graphql(
        `${CUSTOMER_FIELDS}
         mutation Register($input: CustomerCreateInput!) {
           customerCreate(input: $input) {
             customer { ...CustomerFields }
             customerUserErrors { message }
           }
         }`,
        { input }
      );
      const p = res?.customerCreate;
      const errors = errs(p?.customerUserErrors);
      return {
        ok: Boolean(p?.customer) && errors.length === 0,
        errors,
        ...p?.customer ? { data: normalizeCustomer(p.customer) } : {}
      };
    },
    async get(token) {
      const res = await graphql(
        `${CUSTOMER_FIELDS}
         query Me($t: String) { customer(customerAccessToken: $t) { ...CustomerFields } }`,
        { t: token }
      );
      return res?.customer ? normalizeCustomer(res.customer) : null;
    },
    async orders(token, opts) {
      const res = await graphql(
        `${ORDER_FIELDS}
         query Orders($t: String, $first: Int!) {
           customer(customerAccessToken: $t) {
             orders(first: $first, sortKey: PROCESSED_AT, reverse: true) { nodes { ...OrderFields } }
           }
         }`,
        { t: token, first: opts?.first ?? 20 }
      );
      return (res?.customer?.orders?.nodes ?? []).map(normalizeOrder);
    },
    async orderByLookup(orderNumber, email) {
      const res = await graphql(
        `${ORDER_FIELDS}
         query Lookup($n: String!, $e: String!) {
           orderByLookup(orderNumber: $n, email: $e) { ...OrderFields }
         }`,
        { n: orderNumber, e: email }
      );
      return res?.orderByLookup ? normalizeOrder(res.orderByLookup) : null;
    },
    async createAddress(token, address) {
      const res = await graphql(
        `mutation AddrCreate($t: String!, $a: MailingAddressInput!) {
           customerAddressCreate(customerAccessToken: $t, address: $a) {
             customerAddress { id }
             customerUserErrors { message }
           }
         }`,
        { t: token, a: address }
      );
      const p = res?.customerAddressCreate;
      const errors = errs(p?.customerUserErrors);
      return {
        ok: Boolean(p?.customerAddress?.id) && errors.length === 0,
        errors,
        ...p?.customerAddress?.id ? { data: { id: p.customerAddress.id } } : {}
      };
    },
    async updateAddress(token, id, address) {
      const res = await graphql(
        `mutation AddrUpdate($t: String!, $id: ID!, $a: MailingAddressInput!) {
           customerAddressUpdate(customerAccessToken: $t, id: $id, address: $a) {
             customerAddress { id }
             customerUserErrors { message }
           }
         }`,
        { t: token, id, a: address }
      );
      const errors = errs(res?.customerAddressUpdate?.customerUserErrors);
      return { ok: errors.length === 0, errors };
    },
    async deleteAddress(token, id) {
      const res = await graphql(
        `mutation AddrDelete($t: String!, $id: ID!) {
           customerAddressDelete(customerAccessToken: $t, id: $id) {
             deletedCustomerAddressId
             customerUserErrors { message }
           }
         }`,
        { t: token, id }
      );
      const errors = errs(res?.customerAddressDelete?.customerUserErrors);
      return { ok: errors.length === 0, errors };
    },
    async setDefaultAddress(token, addressId) {
      const res = await graphql(
        `mutation AddrDefault($t: String!, $id: ID!) {
           customerDefaultAddressUpdate(customerAccessToken: $t, addressId: $id) {
             customer { id }
             customerUserErrors { message }
           }
         }`,
        { t: token, id: addressId }
      );
      const errors = errs(res?.customerDefaultAddressUpdate?.customerUserErrors);
      return { ok: errors.length === 0, errors };
    }
  };
  return {
    fetchMenu,
    search,
    collectionProducts,
    predictiveSearch,
    productRecommendations,
    blogByHandle,
    articleByHandle,
    metaobject,
    metaobjects,
    customer
  };
}
const CUSTOMER_TOKEN_KEY = "tq-customer-token";
const customerTokenStore = {
  get() {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(CUSTOMER_TOKEN_KEY);
  },
  set(token) {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  },
  clear() {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  }
};
const DataContext = createContext(null);
function decodeHandle(handle) {
  if (!handle || !handle.includes("%")) return handle;
  try {
    return decodeURIComponent(handle);
  } catch {
    return handle;
  }
}
function DataProvider({ value, children }) {
  return /* @__PURE__ */ jsx(DataContext.Provider, { value, children });
}
function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within <DataProvider>");
  return ctx;
}
function createMockData(collections) {
  const productsByHandle = /* @__PURE__ */ new Map();
  const allProducts = [];
  for (const c of collections) {
    for (const p of c.products) {
      const prev = productsByHandle.get(p.handle);
      if (!prev) {
        productsByHandle.set(p.handle, p);
        allProducts.push(p);
      } else if (!prev.seo && p.seo) {
        productsByHandle.set(p.handle, p);
        const i = allProducts.indexOf(prev);
        if (i !== -1) allProducts[i] = p;
      }
    }
  }
  const mkItem = (id, title, url, type = "HTTP") => ({ id, title, url, type, items: [] });
  const mkMenu = (handle, title, items) => ({ id: `mock/menu/${handle}`, handle, title, items });
  const mainMenu = mkMenu("main-menu", "Main menu", [
    {
      ...mkItem("mm-shop", "Shop", "/collections/all", "COLLECTIONS"),
      // submenu: the store's collections, so the header dropdown is real data
      items: collections.slice(0, 6).map((c, i) => mkItem(`mm-shop-${i}`, c.title, `/collections/${c.handle}`, "COLLECTION"))
    },
    mkItem("mm-collections", "Collections", "/collections", "CATALOG"),
    mkItem("mm-about", "About", "/pages/about", "PAGE"),
    mkItem("mm-journal", "Journal", "/blogs/news", "BLOG")
  ]);
  const menus = /* @__PURE__ */ new Map([
    ["main-menu", mainMenu],
    ["footer", mkMenu("footer", "Footer", [
      mkItem("fm-privacy", "Privacy policy", "/policies/privacy-policy", "SHOP_POLICY"),
      mkItem("fm-contact", "Contact", "/pages/contact", "PAGE")
    ])],
    ["footer-shop", mkMenu("footer-shop", "Shop", [
      mkItem("fs-all", "All products", "/collections/all"),
      mkItem("fs-new", "New arrivals", "/collections/new"),
      mkItem("fs-sale", "Sale", "/collections/sale"),
      mkItem("fs-gift", "Gift cards", "/products/gift-card")
    ])],
    ["footer-help", mkMenu("footer-help", "Help", [
      mkItem("fh-contact", "Contact", "/pages/contact"),
      mkItem("fh-ship", "Shipping", "/pages/shipping"),
      mkItem("fh-returns", "Returns", "/pages/returns"),
      mkItem("fh-faq", "FAQ", "/pages/faq")
    ])],
    ["footer-company", mkMenu("footer-company", "Company", [
      mkItem("fc-about", "About", "/pages/about"),
      mkItem("fc-journal", "Journal", "/blogs/news"),
      mkItem("fc-sustain", "Sustainability", "/pages/sustainability"),
      mkItem("fc-press", "Press", "/pages/press")
    ])]
  ]);
  const articles = [
    {
      id: "mock/article/welcome",
      handle: "welcome",
      title: "Welcome to the shop",
      excerpt: "A quick hello and what to expect.",
      contentHtml: "<p>Welcome — this is mock article content for local development.</p>",
      image: null,
      author: "Studio",
      publishedAt: "2024-01-01T00:00:00.000Z",
      tags: ["news"],
      blogHandle: "news"
    },
    {
      id: "mock/article/behind-the-design",
      handle: "behind-the-design",
      title: "Behind the design",
      excerpt: "How this starter theme is built.",
      contentHtml: "<p>Built with Tanqory theme-kit sections.</p>",
      image: null,
      author: "Studio",
      publishedAt: "2024-01-02T00:00:00.000Z",
      tags: ["design"],
      blogHandle: "news"
    }
  ];
  const blog = { id: "mock/blog/news", handle: "news", title: "News", articles };
  const shop = {
    name: "nova",
    description: "A clean starter storefront powered by Tanqory.",
    brand: { logo: null, slogan: "Modern essentials", shortDescription: "Starter theme" },
    policies: {
      privacy: { handle: "privacy-policy", title: "Privacy policy", url: "/policies/privacy-policy", body: "<p>Mock privacy policy.</p>" },
      refund: { handle: "refund-policy", title: "Refund policy", url: "/policies/refund-policy", body: "<p>Mock refund policy.</p>" },
      termsOfService: { handle: "terms-of-service", title: "Terms of service", url: "/policies/terms-of-service", body: "<p>Mock terms of service.</p>" },
      shipping: { handle: "shipping-policy", title: "Shipping policy", url: "/policies/shipping-policy", body: "<p>Mock shipping policy.</p>" },
      subscription: null
    },
    cookieBanner: { enabled: true, dataSharingTitle: "Do not sell or share my personal information", dataSharingVisible: true }
  };
  const EMPTY_PI = { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null };
  const match = (q) => {
    const needle = q.trim().toLowerCase();
    return needle ? allProducts.filter((p) => p.title.toLowerCase().includes(needle)) : [];
  };
  return {
    collectionByHandle: (handle) => collections.find((c) => c.handle === handle || c.handle === decodeHandle(handle)) ?? null,
    allCollections: () => collections,
    productByHandle: (handle) => productsByHandle.get(handle) ?? productsByHandle.get(decodeHandle(handle)) ?? null,
    pageByHandle: () => null,
    // Localization mirrors what the store DASHBOARD (Markets) would publish —
    // NOT a theme config list. Countries carry their currency; languages are the
    // store's published locales. The live source fills this from store-api.
    localization: {
      country: { isoCode: "TH", name: "Thailand", currency: { isoCode: "THB", symbol: "฿" }, market: null },
      availableCountries: [
        { isoCode: "TH", name: "Thailand", currency: { isoCode: "THB", symbol: "฿" }, market: null },
        { isoCode: "US", name: "United States", currency: { isoCode: "USD", symbol: "$" }, market: null },
        { isoCode: "JP", name: "Japan", currency: { isoCode: "JPY", symbol: "¥" }, market: null },
        { isoCode: "SG", name: "Singapore", currency: { isoCode: "SGD", symbol: "S$" }, market: null },
        { isoCode: "GB", name: "United Kingdom", currency: { isoCode: "GBP", symbol: "£" }, market: null }
      ],
      language: { isoCode: "en", name: "English" },
      availableLanguages: [
        { isoCode: "en", name: "English" },
        { isoCode: "th", name: "ไทย" },
        { isoCode: "ja", name: "日本語" }
      ]
    },
    // ── Shopify-parity extensions, served offline from the fixtures above so
    //    themes built against `useData()` behave the same in mock + live. ──
    shop,
    menu: (handle) => menus.get(handle) ?? menus.get(decodeHandle(handle)) ?? null,
    fetchMenu: async (handle) => menus.get(handle) ?? menus.get(decodeHandle(handle)) ?? null,
    listMenus: async () => Array.from(menus.values()).map((m) => ({
      handle: m.handle,
      title: m.title,
      itemsCount: m.items.length
    })),
    pixels: async () => [],
    locations: async () => [],
    search: async (query, opts) => {
      const types = opts?.types ?? ["PRODUCT", "PAGE", "ARTICLE"];
      const products = types.includes("PRODUCT") ? match(query) : [];
      const arts = types.includes("ARTICLE") ? articles.filter((a) => a.title.toLowerCase().includes(query.trim().toLowerCase())) : [];
      return { totalCount: products.length + arts.length, products, pages: [], articles: arts, filters: [], pageInfo: EMPTY_PI };
    },
    predictiveSearch: async (query, opts) => {
      const products = match(query).slice(0, opts?.limit ?? 4);
      return {
        queries: products.slice(0, 3).map((p) => p.title),
        products,
        collections: collections.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 3).map((c) => ({ handle: c.handle, title: c.title, image: null })),
        pages: [],
        articles: []
      };
    },
    collectionProducts: async (handle, opts) => {
      const c = collections.find((x) => x.handle === handle);
      return { products: (c?.products ?? []).slice(0, opts?.first ?? 24), filters: [], pageInfo: EMPTY_PI };
    },
    productRecommendations: async (productId) => allProducts.filter((p) => p.id !== productId).slice(0, 4),
    blogByHandle: async (handle) => handle === blog.handle || decodeHandle(handle) === blog.handle ? blog : null,
    articleByHandle: async (blogHandle, articleHandle) => blogHandle === blog.handle || decodeHandle(blogHandle) === blog.handle ? articles.find(
      (a) => a.handle === articleHandle || a.handle === decodeHandle(articleHandle)
    ) ?? null : null,
    metaobject: async () => null,
    metaobjects: async () => [],
    customer: {
      login: async () => ({ token: null, expiresAt: null, errors: ["Customer accounts need live data (mock mode)."] }),
      logout: async () => {
      },
      renew: async () => ({ token: null, expiresAt: null, errors: ["Customer accounts need live data (mock mode)."] }),
      register: async () => ({ ok: false, errors: ["Customer accounts need live data (mock mode)."] }),
      get: async () => null,
      orders: async () => [],
      orderByLookup: async () => null,
      createAddress: async () => ({ ok: false, errors: ["mock mode"] }),
      updateAddress: async () => ({ ok: false, errors: ["mock mode"] }),
      deleteAddress: async () => ({ ok: false, errors: ["mock mode"] }),
      setDefaultAddress: async () => ({ ok: false, errors: ["mock mode"] })
    }
  };
}
const PRODUCT_CARD_FIELDS = (
  /* GraphQL */
  `
  fragment ProductCardBoot on Product {
    id
    handle
    title
    availableForSale
    vendor
    productType
    tags
    featuredImage { url altText }
    priceRange { minVariantPrice { amount currencyCode } }
    compareAtPriceRange { maxVariantPrice { amount currencyCode } }
    firstAvailableVariant { id }
    templateSuffix
  }
`
);
const COLLECTIONS_QUERY = (
  /* GraphQL */
  `
  ${BOOTSTRAP_SHOP_MENU_FRAGMENTS}
  ${PRODUCT_CARD_FIELDS}
  query NovaBootstrap($first: Int!, $productFirst: Int!, $productsTop: Int!, $pageHandle: String, $productHandle: String, $collectionHandle: String) {
    ${BOOTSTRAP_SHOP_MENU}
    page(handle: $pageHandle) {
      handle
      title
      body
      bodySummary
      author
      publishedAt
      updatedAt
      templateSuffix
      seo { title description keywords }
    }
    product(handle: $productHandle) { ...ProductCardBoot seo { title description keywords } }
    collection(handle: $collectionHandle) {
      id
      handle
      title
      image { url altText }
      productsCount { count }
      templateSuffix
      seo { title description keywords }
    }
    collections(first: $first) {
      edges {
        node {
          id
          handle
          title
          image { url altText }
          productsCount { count }
          templateSuffix
          products(first: $productFirst) {
            edges {
              node { ...ProductCardBoot }
            }
          }
        }
      }
    }
    products(first: $productsTop) {
      edges {
        node { ...ProductCardBoot }
      }
    }
    localization {
      country {
        isoCode
        name
        currency { isoCode name symbol }
        market { id handle name }
      }
      availableCountries {
        isoCode
        name
        currency { isoCode name symbol }
        market { id handle name }
      }
      language { isoCode name }
      availableLanguages { isoCode name }
    }
  }
`
);
const SAFE_COLLECTIONS_QUERY = (
  /* GraphQL */
  `
  ${BOOTSTRAP_SHOP_MENU_FRAGMENTS}
  ${PRODUCT_CARD_FIELDS}
  query NovaBootstrapSafe($first: Int!, $productsTop: Int!, $pageHandle: String, $productHandle: String, $collectionHandle: String) {
    ${BOOTSTRAP_SHOP_MENU}
    page(handle: $pageHandle) {
      handle
      title
      body
      bodySummary
      author
      publishedAt
      updatedAt
      templateSuffix
      seo { title description keywords }
    }
    product(handle: $productHandle) { ...ProductCardBoot seo { title description keywords } }
    collection(handle: $collectionHandle) {
      id
      handle
      title
      image { url altText }
      productsCount { count }
      templateSuffix
      seo { title description keywords }
    }
    collections(first: $first) {
      edges {
        node {
          id
          handle
          title
          image { url altText }
          productsCount { count }
          templateSuffix
        }
      }
    }
    products(first: $productsTop) {
      edges {
        node { ...ProductCardBoot }
      }
    }
  }
`
);
function normalizeImage$1(img2) {
  if (!img2 || !img2.url) return null;
  return {
    url: img2.url,
    ...img2.altText ? { altText: img2.altText } : {}
  };
}
function normalizeProduct(p) {
  const price = p.priceRange?.minVariantPrice ?? { amount: "0", currencyCode: "USD" };
  const compareAt = p.compareAtPriceRange?.maxVariantPrice;
  const onSale = compareAt && Number(compareAt.amount) > Number(price.amount);
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    price,
    featuredImage: normalizeImage$1(p.featuredImage),
    ...onSale ? { compareAtPrice: compareAt } : {},
    ...p.vendor ? { vendor: p.vendor } : {},
    ...p.productType ? { productType: p.productType } : {},
    ...p.tags?.length ? { tags: p.tags } : {},
    ...p.firstAvailableVariant?.id ? { variantId: p.firstAvailableVariant.id } : {},
    ...typeof p.availableForSale === "boolean" ? { availableForSale: p.availableForSale } : {},
    ...p.templateSuffix ? { templateSuffix: p.templateSuffix } : {},
    ...p.seo ? { seo: { title: p.seo.title ?? null, description: p.seo.description ?? null, keywords: p.seo.keywords ?? [] } } : {}
  };
}
function normalizeCollection(c) {
  return {
    ...c.id ? { id: c.id } : {},
    handle: c.handle,
    title: c.title,
    image: normalizeImage$1(c.image),
    ...typeof c.productsCount?.count === "number" ? { productsCount: c.productsCount.count } : {},
    // Nested products are optional — the reduced bootstrap (used when a cell
    // errors on the nested products field) omits them.
    ...c.templateSuffix ? { templateSuffix: c.templateSuffix } : {},
    ...c.seo ? { seo: { title: c.seo.title ?? null, description: c.seo.description ?? null, keywords: c.seo.keywords ?? [] } } : {},
    products: (c.products?.edges ?? []).map((e) => normalizeProduct(e.node))
  };
}
const PRODUCT_QUERY = (
  /* GraphQL */
  `
  query NovaProduct($handle: String!, $identifiers: [MetafieldIdentifier!]!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      vendor
      productType
      tags
      availableForSale
      isGiftCard
      totalInventory
      featuredImage { url altText }
      images(first: 20) { nodes { url altText } }
      media(first: 20) {
        nodes {
          __typename
          ... on MediaImage { id alt image { url altText } }
          ... on Video { id alt previewImage { url altText } sources { url mimeType format } }
          ... on Model3d { id alt previewImage { url altText } sources { url mimeType format } }
          ... on ExternalVideo { id alt host embedUrl previewImage { url altText } }
        }
      }
      priceRange { minVariantPrice { amount currencyCode } }
      compareAtPriceRange { maxVariantPrice { amount currencyCode } }
      options(first: 10) { name values }
      seo { title description keywords }
      templateSuffix
      variants(first: 50) {
        nodes {
          id
          title
          availableForSale
          sku
          barcode
          inventoryQuantity
          inventoryPolicy
          requiresShipping
          taxable
          weight { value unit }
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          image { url altText }
          selectedOptions { name value }
          unitPrice { amount currencyCode }
          unitPriceMeasurement { measuredType quantityValue quantityUnit referenceValue referenceUnit }
          quantityRule { minimum maximum increment }
          storeAvailability(first: 5) {
            nodes { available quantityAvailable pickUpTime location { id name } }
          }
        }
      }
      sellingPlanGroups(first: 5) {
        nodes {
          name
          appName
          options { name values }
          sellingPlans(first: 10) {
            nodes { id name description recurringDeliveries options { name value } }
          }
        }
      }
      metafields(identifiers: $identifiers) { namespace key value }
      firstAvailableVariant { id }
    }
  }
`
);
function normalizeProductDetail(p) {
  const base = normalizeProduct(p);
  const variants = (p.variants?.nodes ?? []).map((v) => ({
    id: v.id,
    title: v.title,
    price: v.price ?? base.price,
    ...v.compareAtPrice && Number(v.compareAtPrice.amount) > Number((v.price ?? base.price).amount) ? { compareAtPrice: v.compareAtPrice } : {},
    availableForSale: v.availableForSale,
    ...v.sku ? { sku: v.sku } : {},
    ...v.barcode ? { barcode: v.barcode } : {},
    ...typeof v.inventoryQuantity === "number" ? { inventoryQuantity: v.inventoryQuantity } : {},
    ...v.inventoryPolicy ? { inventoryPolicy: v.inventoryPolicy } : {},
    ...typeof v.requiresShipping === "boolean" ? { requiresShipping: v.requiresShipping } : {},
    ...typeof v.taxable === "boolean" ? { taxable: v.taxable } : {},
    ...v.weight ? { weight: v.weight } : {},
    ...v.selectedOptions?.length ? { selectedOptions: v.selectedOptions } : {},
    image: normalizeImage$1(v.image),
    ...v.unitPrice ? { unitPrice: v.unitPrice } : {},
    ...v.unitPriceMeasurement ? { unitPriceMeasurement: v.unitPriceMeasurement } : {},
    ...v.quantityRule ? { quantityRule: v.quantityRule } : {},
    ...v.storeAvailability?.nodes?.length ? {
      storeAvailability: v.storeAvailability.nodes.map((s) => ({
        available: s.available,
        quantityAvailable: s.quantityAvailable,
        pickUpTime: s.pickUpTime ?? null,
        location: s.location
      }))
    } : {}
  }));
  const images = (p.images?.nodes ?? []).map(normalizeImage$1).filter((i) => i !== null);
  const TYPE_MAP = {
    MediaImage: "image",
    Video: "video",
    Model3d: "model_3d",
    ExternalVideo: "external_video"
  };
  const media = (p.media?.nodes ?? []).map((m) => ({
    id: m.id,
    type: TYPE_MAP[m.__typename] ?? "image",
    alt: m.alt ?? null,
    ...m.image ? { image: normalizeImage$1(m.image) } : {},
    ...m.previewImage ? { previewImage: normalizeImage$1(m.previewImage) } : {},
    ...m.sources?.length ? { sources: m.sources } : {},
    ...m.host ? { host: m.host } : {},
    ...m.embedUrl ? { embedUrl: m.embedUrl } : {}
  }));
  const sellingPlanGroups = (p.sellingPlanGroups?.nodes ?? []).map((g) => ({
    name: g.name,
    appName: g.appName ?? null,
    options: g.options ?? [],
    sellingPlans: (g.sellingPlans?.nodes ?? []).map((sp) => ({
      id: sp.id,
      name: sp.name,
      description: sp.description ?? null,
      recurringDeliveries: sp.recurringDeliveries,
      options: sp.options ?? []
    }))
  }));
  const metafields = {};
  for (const m of p.metafields ?? []) {
    if (m) metafields[`${m.namespace}.${m.key}`] = m.value;
  }
  return {
    ...base,
    ...p.description ? { description: p.description } : {},
    ...typeof p.isGiftCard === "boolean" ? { isGiftCard: p.isGiftCard } : {},
    ...typeof p.totalInventory === "number" ? { totalInventory: p.totalInventory } : {},
    ...images.length ? { images } : {},
    ...media.length ? { media } : {},
    ...p.options?.length ? { options: p.options } : {},
    ...p.seo ? { seo: { title: p.seo.title ?? null, description: p.seo.description ?? null, keywords: p.seo.keywords ?? [] } } : {},
    ...variants.length ? { variants } : {},
    ...sellingPlanGroups.length ? { sellingPlanGroups } : {},
    ...Object.keys(metafields).length ? { metafields } : {}
  };
}
function makeGraphqlRequest(opts) {
  const maybeFetch = opts.fetcher ?? globalThis.fetch;
  if (!maybeFetch) {
    throw new Error("[theme-kit] createLiveData: fetch is not available in this environment");
  }
  const f = maybeFetch;
  const endpoint = opts.endpoint.replace(/\/$/, "");
  const url = `${endpoint}/api/v1/stores/${encodeURIComponent(opts.storeId)}/graphql`;
  return async function graphqlRequest(query, variables) {
    const res = await f(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...opts.token ? { "x-publishable-key": opts.token } : {},
        // X-Tanqory-Country triggers backend Market resolution; if the store
        // has an active Market with this country, Money.currencyCode + amount
        // come back already-converted in the target currency.
        ...opts.country ? { "x-tanqory-country": opts.country.toUpperCase() } : {},
        // X-Tanqory-Lang triggers translation overlay: product/collection/page
        // content comes back in this locale where the merchant has translations.
        ...opts.locale ? { "x-tanqory-lang": opts.locale.toLowerCase() } : {}
      },
      body: JSON.stringify({ query, variables })
    });
    if (!res.ok) {
      throw new Error(
        `[theme-kit] GraphQL HTTP ${res.status} from ${url} — ${await res.text().catch(() => "")}`
      );
    }
    const json = await res.json();
    if (json.errors?.length) {
      const msg = json.errors.map((e) => e.message).join("; ");
      if (json.data == null) {
        throw new Error(`[theme-kit] GraphQL errors: ${msg}`);
      }
      if (typeof console !== "undefined") {
        console.warn(`[theme-kit] GraphQL partial errors (using partial data): ${msg}`);
      }
    }
    return json.data;
  };
}
async function createLiveData(opts) {
  const graphqlRequest = makeGraphqlRequest(opts);
  const collectionLimit = opts.prefetch?.collectionLimit ?? 10;
  const productLimitPerCollection = opts.prefetch?.productLimitPerCollection ?? 10;
  const topProductLimit = opts.prefetch?.topProductLimit ?? 24;
  let boot;
  try {
    boot = await graphqlRequest(COLLECTIONS_QUERY, {
      first: collectionLimit,
      productFirst: productLimitPerCollection,
      productsTop: topProductLimit,
      pageHandle: opts.pageHandle ?? null,
      productHandle: opts.productHandle ?? null,
      collectionHandle: opts.collectionHandle ?? null
    });
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn(
        `[theme-kit] full bootstrap failed, retrying without optional fields: ${err.message}`
      );
    }
    boot = await graphqlRequest(SAFE_COLLECTIONS_QUERY, {
      first: collectionLimit,
      productsTop: topProductLimit,
      pageHandle: opts.pageHandle ?? null,
      productHandle: opts.productHandle ?? null,
      collectionHandle: opts.collectionHandle ?? null
    });
  }
  return buildLiveData(boot, graphqlRequest, opts);
}
function createLiveDataFromSnapshot(snapshot, opts) {
  const graphqlRequest = makeGraphqlRequest(opts);
  return buildLiveData(snapshot ?? void 0, graphqlRequest, opts);
}
function buildLiveData(boot, graphqlRequest, opts) {
  const productLimitPerCollection = opts.prefetch?.productLimitPerCollection ?? 10;
  const collections = (boot?.collections.edges ?? []).map(
    (e) => normalizeCollection(e.node)
  );
  const topProducts = (boot?.products.edges ?? []).map(
    (e) => normalizeProduct(e.node)
  );
  if (boot?.product) topProducts.push(normalizeProduct(boot.product));
  if (boot?.collection && !collections.some((c) => c.handle === boot.collection.handle)) {
    collections.push(normalizeCollection(boot.collection));
  }
  if (topProducts.length > 0 && !collections.some((c) => c.handle === "featured")) {
    collections.unshift({
      handle: "featured",
      title: "Featured",
      image: topProducts[0].featuredImage ?? null,
      products: topProducts.slice(0, productLimitPerCollection)
    });
  }
  if (topProducts.length > 0 && !collections.some((c) => c.handle === "all")) {
    collections.push({
      handle: "all",
      title: "All products",
      image: topProducts[0].featuredImage ?? null,
      products: topProducts
    });
  }
  const data = createMockData(collections);
  const pageNode = boot?.page;
  if (pageNode) {
    const page = {
      handle: pageNode.handle,
      title: pageNode.title,
      body: pageNode.body,
      ...pageNode.bodySummary ? { bodySummary: pageNode.bodySummary } : {},
      ...pageNode.author ? { author: pageNode.author } : {},
      ...pageNode.publishedAt ? { publishedAt: pageNode.publishedAt } : {},
      ...pageNode.updatedAt ? { updatedAt: pageNode.updatedAt } : {},
      ...pageNode.templateSuffix ? { templateSuffix: pageNode.templateSuffix } : {}
    };
    data.pageByHandle = (handle) => handle === page.handle || decodeHandle(handle) === page.handle ? page : null;
  }
  const loc = boot?.localization;
  if (loc) {
    data.localization = loc.availableCountries.length > 0 ? {
      country: loc.country,
      availableCountries: loc.availableCountries,
      // Published languages come straight from the store (StoreLanguage →
      // SDL `availableLanguages`); the theme just renders the picker.
      language: loc.language,
      availableLanguages: loc.availableLanguages
    } : null;
  }
  data.graphql = graphqlRequest;
  data.fetchProduct = async (handle, fpOpts) => {
    try {
      const res = await graphqlRequest(PRODUCT_QUERY, {
        handle,
        identifiers: fpOpts?.metafields ?? []
      });
      return res?.product ? normalizeProductDetail(res.product) : null;
    } catch (err) {
      if (typeof console !== "undefined") {
        console.warn(`[theme-kit] fetchProduct(${handle}) failed: ${err.message}`);
      }
      return null;
    }
  };
  const toMfMap = (arr) => {
    const out = {};
    for (const m of arr ?? []) if (m) out[`${m.namespace}.${m.key}`] = m.value;
    return out;
  };
  data.fetchShopMetafields = async (identifiers) => {
    if (!identifiers.length) return {};
    const res = await graphqlRequest(
      `query NovaShopMetafields($identifiers: [MetafieldIdentifier!]!) {
        shop { metafields(identifiers: $identifiers) { namespace key value } }
      }`,
      { identifiers }
    );
    return toMfMap(res?.shop?.metafields);
  };
  data.fetchCollectionMetafields = async (handle, identifiers) => {
    if (!identifiers.length || !handle) return {};
    const res = await graphqlRequest(
      `query NovaCollectionMetafields($handle: String!, $identifiers: [MetafieldIdentifier!]!) {
        collection(handle: $handle) { metafields(identifiers: $identifiers) { namespace key value } }
      }`,
      { handle, identifiers }
    );
    return toMfMap(res?.collection?.metafields);
  };
  const { shop, menus } = readBootstrapShopMenu(boot);
  data.shop = shop;
  data.menu = (handle) => menus.get(handle) ?? menus.get(decodeHandle(handle)) ?? null;
  Object.assign(
    data,
    createStorefrontMethods(graphqlRequest, { normalizeProduct }, menus)
  );
  data.listMenus = async () => {
    const res = await graphqlRequest(`query NovaMenus { menus { handle title itemsCount } }`);
    return res?.menus ?? [];
  };
  data.pixels = async () => {
    const res = await graphqlRequest(`query NovaPixels { customPixels { id name provider providerPixelId code } }`);
    return res?.customPixels ?? [];
  };
  data.locations = async () => {
    const res = await graphqlRequest(
      `query NovaLocations { locations { id name code address { country address city province postalCode phone } } }`
    );
    return res?.locations ?? [];
  };
  data.getSnapshot = () => boot ?? null;
  return data;
}
const CURRENCY_FORMAT = {
  THB: { symbol: "฿", decimals: 2 },
  USD: { symbol: "$", decimals: 2 },
  EUR: { symbol: "€", decimals: 2 },
  GBP: { symbol: "£", decimals: 2 },
  JPY: { symbol: "¥", decimals: 0 },
  KRW: { symbol: "₩", decimals: 0 },
  VND: { symbol: "₫", decimals: 0 },
  IDR: { symbol: "Rp", decimals: 0 },
  SGD: { symbol: "S$", decimals: 2 },
  HKD: { symbol: "HK$", decimals: 2 },
  TWD: { symbol: "NT$", decimals: 2 },
  AUD: { symbol: "A$", decimals: 2 },
  NZD: { symbol: "NZ$", decimals: 2 },
  CAD: { symbol: "CA$", decimals: 2 },
  CNY: { symbol: "CN¥", decimals: 2 },
  INR: { symbol: "₹", decimals: 2 },
  MYR: { symbol: "RM", decimals: 2 },
  PHP: { symbol: "₱", decimals: 2 }
};
function moneyDigits(money2, stripZeros = false) {
  const n = Number(money2.amount);
  if (!Number.isFinite(n)) return null;
  const info = CURRENCY_FORMAT[money2.currencyCode];
  const decimals = info?.decimals ?? 2;
  let [int, frac] = Math.abs(n).toFixed(decimals).split(".");
  if (stripZeros && frac && /^0+$/.test(frac)) frac = "";
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n < 0 ? "-" : ""}${grouped}${frac ? `.${frac}` : ""}`;
}
function formatMoney(money2) {
  const num = moneyDigits(money2);
  if (num === null) return `${money2.amount} ${money2.currencyCode}`;
  const info = CURRENCY_FORMAT[money2.currencyCode];
  return info ? `${info.symbol}${num}` : `${num} ${money2.currencyCode}`;
}
function formatMoneyWithCurrency(money2) {
  const num = moneyDigits(money2);
  if (num === null) return `${money2.amount} ${money2.currencyCode}`;
  const info = CURRENCY_FORMAT[money2.currencyCode];
  return info ? `${info.symbol}${num} ${money2.currencyCode}` : `${num} ${money2.currencyCode}`;
}
function formatMoneyWithoutCurrency(money2) {
  return moneyDigits(money2) ?? `${money2.amount}`;
}
function formatMoneyWithoutTrailingZeros(money2) {
  const num = moneyDigits(money2, true);
  if (num === null) return `${money2.amount} ${money2.currencyCode}`;
  const info = CURRENCY_FORMAT[money2.currencyCode];
  return info ? `${info.symbol}${num}` : `${num} ${money2.currencyCode}`;
}
function formatDate(input, opts = { year: "numeric", month: "short", day: "numeric" }, locale = "en-US") {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(locale, { ...opts, timeZone: "UTC" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
function formatWeight(weight) {
  if (!weight || !Number.isFinite(weight.value)) return "";
  const unit = { GRAMS: "g", KILOGRAMS: "kg", OUNCES: "oz", POUNDS: "lb" }[weight.unit] ?? weight.unit.toLowerCase();
  const n = Number.isInteger(weight.value) ? weight.value : Number(weight.value.toFixed(2));
  return `${n} ${unit}`;
}
function imageUrl(src, opts = {}) {
  if (!src) return "";
  const { width, height, crop } = opts;
  if (!width && !height && !crop) return src;
  try {
    const url = new URL(src, "https://cdn.tanqory.com");
    if (width) url.searchParams.set("width", String(width));
    if (height) url.searchParams.set("height", String(height));
    if (crop) url.searchParams.set("crop", crop);
    return /^https?:\/\//i.test(src) ? url.toString() : `${url.pathname}${url.search}`;
  } catch {
    return src;
  }
}
const STORAGE_KEY = "tq-cart-id";
const DEFAULT_CURRENCY = "USD";
const DEFAULT_VARIANT_TITLE = "Default Title";
function money(amount, currencyCode) {
  return { amount: amount.toFixed(2), currencyCode };
}
function multiply(price, qty) {
  return money(Number(price.amount) * qty, price.currencyCode);
}
function sumLines(lines) {
  const currencyCode = lines[0]?.lineSubtotal.currencyCode ?? DEFAULT_CURRENCY;
  const total = lines.reduce((acc, l) => acc + Number(l.lineSubtotal.amount), 0);
  return money(total, currencyCode);
}
function countQty(lines) {
  return lines.reduce((acc, l) => acc + l.quantity, 0);
}
const CART_FRAGMENT = (
  /* GraphQL */
  `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    note
    attributes { key value }
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
      totalTaxAmount { amount currencyCode }
      totalDutyAmount { amount currencyCode }
    }
    discountCodes { code applicable }
    discountAllocations {
      ... on CartCodeDiscountAllocation { code discountedAmount { amount currencyCode } }
      ... on CartAutomaticDiscountAllocation { title discountedAmount { amount currencyCode } }
      ... on CartCustomDiscountAllocation { title discountedAmount { amount currencyCode } }
    }
    appliedGiftCards {
      id
      lastCharacters
      amountUsed { amount currencyCode }
      balance { amount currencyCode }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          subtotalAmount { amount currencyCode }
          amountPerQuantity { amount currencyCode }
        }
        merchandise {
          ... on Variant {
            id
            title
            image { url altText }
            price { amount currencyCode }
            product { handle title featuredImage { url altText } }
          }
        }
      }
    }
  }
`
);
const CART_QUERY = (
  /* GraphQL */
  `
  query Cart($id: ID!) { cart(id: $id) { ...CartFields } }
  ${CART_FRAGMENT}
`
);
const CART_CREATE = (
  /* GraphQL */
  `
  mutation CartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) { cart { ...CartFields } userErrors { message } }
  }
  ${CART_FRAGMENT}
`
);
const CART_LINES_ADD = (
  /* GraphQL */
  `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartFields } userErrors { message } }
  }
  ${CART_FRAGMENT}
`
);
const CART_LINES_UPDATE = (
  /* GraphQL */
  `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartFields } userErrors { message } }
  }
  ${CART_FRAGMENT}
`
);
const CART_LINES_REMOVE = (
  /* GraphQL */
  `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartFields } userErrors { message } }
  }
  ${CART_FRAGMENT}
`
);
const CART_DISCOUNT_CODES = (
  /* GraphQL */
  `
  mutation CartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart { ...CartFields } userErrors { message }
    }
  }
  ${CART_FRAGMENT}
`
);
const CART_GIFTCARD_UPDATE = (
  /* GraphQL */
  `
  mutation CartGiftCardCodesUpdate($cartId: ID!, $giftCardCodes: [String!]!) {
    cartGiftCardCodesUpdate(cartId: $cartId, giftCardCodes: $giftCardCodes) {
      cart { ...CartFields } userErrors { message }
    }
  }
  ${CART_FRAGMENT}
`
);
const CART_GIFTCARD_REMOVE = (
  /* GraphQL */
  `
  mutation CartGiftCardCodesRemove($cartId: ID!, $appliedGiftCardIds: [ID!]!) {
    cartGiftCardCodesRemove(cartId: $cartId, appliedGiftCardIds: $appliedGiftCardIds) {
      cart { ...CartFields } userErrors { message }
    }
  }
  ${CART_FRAGMENT}
`
);
const CART_NOTE_UPDATE = (
  /* GraphQL */
  `
  mutation CartNoteUpdate($cartId: ID!, $note: String) {
    cartNoteUpdate(cartId: $cartId, note: $note) {
      cart { ...CartFields } userErrors { message }
    }
  }
  ${CART_FRAGMENT}
`
);
const CART_ATTRIBUTES_UPDATE = (
  /* GraphQL */
  `
  mutation CartAttributesUpdate($cartId: ID!, $attributes: [AttributeInput!]!) {
    cartAttributesUpdate(cartId: $cartId, attributes: $attributes) {
      cart { ...CartFields } userErrors { message }
    }
  }
  ${CART_FRAGMENT}
`
);
function normalizeImage(img2) {
  if (!img2 || !img2.url) return null;
  return { url: img2.url, ...img2.altText ? { altText: img2.altText } : {} };
}
function normalizeCart(c) {
  const lines = c.lines.nodes.map((n) => {
    const m = n.merchandise;
    const variantTitle = m.title && m.title !== DEFAULT_VARIANT_TITLE ? m.title : void 0;
    return {
      id: n.id,
      variantId: m.id,
      quantity: n.quantity,
      title: m.product?.title ?? m.title ?? "Item",
      ...variantTitle ? { variantTitle } : {},
      image: normalizeImage(m.image) ?? normalizeImage(m.product?.featuredImage),
      price: n.cost.amountPerQuantity ?? m.price,
      lineSubtotal: n.cost.subtotalAmount ?? multiply(m.price, n.quantity),
      ...m.product?.handle ? { productHandle: m.product.handle } : {}
    };
  });
  const subtotal = c.cost?.subtotalAmount ?? sumLines(lines);
  const allocations = c.discountAllocations ?? [];
  const discountAmount = allocations.length > 0 ? money(
    allocations.reduce((acc, a) => acc + Number(a.discountedAmount.amount), 0),
    allocations[0].discountedAmount.currencyCode
  ) : null;
  return {
    id: c.id,
    lines,
    subtotal,
    total: c.cost?.totalAmount ?? subtotal,
    tax: c.cost?.totalTaxAmount ?? null,
    duty: c.cost?.totalDutyAmount ?? null,
    note: c.note ?? null,
    attributes: (c.attributes ?? []).map((a) => ({ key: a.key, value: a.value ?? null })),
    totalQuantity: c.totalQuantity ?? countQty(lines),
    checkoutUrl: c.checkoutUrl ?? null,
    discountCodes: (c.discountCodes ?? []).map((d) => ({ code: d.code, applicable: d.applicable })),
    discountAmount,
    appliedGiftCards: (c.appliedGiftCards ?? []).map((g) => ({
      id: g.id,
      lastCharacters: g.lastCharacters,
      amountUsed: g.amountUsed,
      balance: g.balance
    }))
  };
}
const EMPTY = {
  id: null,
  lines: [],
  subtotal: { amount: "0.00", currencyCode: DEFAULT_CURRENCY },
  total: { amount: "0.00", currencyCode: DEFAULT_CURRENCY },
  totalQuantity: 0,
  checkoutUrl: null,
  discountCodes: [],
  discountAmount: null,
  appliedGiftCards: [],
  loading: false,
  ready: false,
  error: null
};
const CartContext = createContext(null);
function readStoredCartId() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function writeStoredCartId(id) {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
  }
}
function CartProvider({ children }) {
  const data = useData();
  const gql = data.graphql;
  const isLive = typeof gql === "function";
  const [state, setState] = useState(EMPTY);
  const ref = useRef(state);
  ref.current = state;
  const applyCart = useCallback((c) => {
    const next = normalizeCart(c);
    writeStoredCartId(next.id);
    setState((s) => ({ ...s, ...next, loading: false, error: null }));
  }, []);
  const setLocal = useCallback((lines) => {
    setState((s) => ({
      ...s,
      lines,
      subtotal: sumLines(lines),
      total: sumLines(lines),
      totalQuantity: countQty(lines),
      loading: false,
      error: null
    }));
  }, []);
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const id = readStoredCartId();
      if (isLive && gql && id) {
        try {
          const res = await gql(CART_QUERY, { id });
          if (cancelled) return;
          if (res.cart) {
            const next = normalizeCart(res.cart);
            setState((s) => ({ ...s, ...next, ready: true }));
            return;
          }
          writeStoredCartId(null);
        } catch {
        }
      }
      if (!cancelled) setState((s) => ({ ...s, ready: true }));
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [isLive, gql]);
  const add = useCallback(
    async (input) => {
      const quantity = input.quantity ?? 1;
      if (quantity < 1) return;
      if (isLive && gql) {
        setState((s) => ({ ...s, loading: true }));
        try {
          const lines2 = [{ merchandiseId: input.variantId, quantity }];
          if (!ref.current.id) {
            const res = await gql(CART_CREATE, { lines: lines2 });
            const payload = res.cartCreate;
            if (payload.cart) applyCart(payload.cart);
            else throw new Error(payload.userErrors[0]?.message ?? "Could not create cart");
          } else {
            const res = await gql(CART_LINES_ADD, {
              cartId: ref.current.id,
              lines: lines2
            });
            const payload = res.cartLinesAdd;
            if (payload.cart) applyCart(payload.cart);
            else throw new Error(payload.userErrors[0]?.message ?? "Could not add to cart");
          }
        } catch (e) {
          setState((s) => ({ ...s, loading: false, error: e.message }));
        }
        return;
      }
      const p = input.product;
      if (!p) return;
      const existing = ref.current.lines.find((l) => l.variantId === input.variantId);
      let lines;
      if (existing) {
        lines = ref.current.lines.map(
          (l) => l.variantId === input.variantId ? { ...l, quantity: l.quantity + quantity, lineSubtotal: multiply(l.price, l.quantity + quantity) } : l
        );
      } else {
        lines = [
          ...ref.current.lines,
          {
            id: `mock-${input.variantId}`,
            variantId: input.variantId,
            quantity,
            title: p.title,
            ...p.variantTitle ? { variantTitle: p.variantTitle } : {},
            image: p.image ?? null,
            price: p.price,
            lineSubtotal: multiply(p.price, quantity),
            ...p.handle ? { productHandle: p.handle } : {}
          }
        ];
      }
      setLocal(lines);
    },
    [isLive, gql, applyCart, setLocal]
  );
  const remove = useCallback(
    async (lineId) => {
      const optimistic = ref.current.lines.filter((l) => l.id !== lineId);
      setLocal(optimistic);
      if (isLive && gql && ref.current.id) {
        try {
          const res = await gql(CART_LINES_REMOVE, {
            cartId: ref.current.id,
            lineIds: [lineId]
          });
          if (res.cartLinesRemove.cart) applyCart(res.cartLinesRemove.cart);
        } catch (e) {
          setState((s) => ({ ...s, error: e.message }));
        }
      }
    },
    [isLive, gql, applyCart, setLocal]
  );
  const updateQuantity = useCallback(
    async (lineId, quantity) => {
      if (quantity <= 0) {
        await remove(lineId);
        return;
      }
      const optimistic = ref.current.lines.map(
        (l) => l.id === lineId ? { ...l, quantity, lineSubtotal: multiply(l.price, quantity) } : l
      );
      setLocal(optimistic);
      if (isLive && gql && ref.current.id) {
        try {
          const res = await gql(CART_LINES_UPDATE, {
            cartId: ref.current.id,
            lines: [{ id: lineId, quantity }]
          });
          if (res.cartLinesUpdate.cart) applyCart(res.cartLinesUpdate.cart);
        } catch (e) {
          setState((s) => ({ ...s, error: e.message }));
        }
      }
    },
    [isLive, gql, applyCart, setLocal, remove]
  );
  const clear = useCallback(async () => {
    const ids = ref.current.lines.map((l) => l.id);
    setLocal([]);
    if (isLive && gql && ref.current.id && ids.length > 0) {
      try {
        const res = await gql(CART_LINES_REMOVE, {
          cartId: ref.current.id,
          lineIds: ids
        });
        if (res.cartLinesRemove.cart) applyCart(res.cartLinesRemove.cart);
      } catch (e) {
        setState((s) => ({ ...s, error: e.message }));
      }
    }
  }, [isLive, gql, applyCart, setLocal]);
  const runCartMutation = useCallback(
    async (query, field, variables) => {
      if (!isLive || !gql || !ref.current.id) return;
      setState((s) => ({ ...s, loading: true }));
      try {
        const res = await gql(query, {
          cartId: ref.current.id,
          ...variables
        });
        const payload = res[field];
        if (payload?.cart) applyCart(payload.cart);
        else throw new Error(payload?.userErrors[0]?.message ?? "Cart update failed");
      } catch (e) {
        setState((s) => ({ ...s, loading: false, error: e.message }));
      }
    },
    [isLive, gql, applyCart]
  );
  const applyDiscountCodes = useCallback(
    (codes) => runCartMutation(CART_DISCOUNT_CODES, "cartDiscountCodesUpdate", { discountCodes: codes }),
    [runCartMutation]
  );
  const applyGiftCardCodes = useCallback(
    (codes) => runCartMutation(CART_GIFTCARD_UPDATE, "cartGiftCardCodesUpdate", { giftCardCodes: codes }),
    [runCartMutation]
  );
  const removeGiftCards = useCallback(
    (ids) => runCartMutation(CART_GIFTCARD_REMOVE, "cartGiftCardCodesRemove", { appliedGiftCardIds: ids }),
    [runCartMutation]
  );
  const updateNote = useCallback(
    (note) => runCartMutation(CART_NOTE_UPDATE, "cartNoteUpdate", { note }),
    [runCartMutation]
  );
  const updateAttributes = useCallback(
    (attributes) => runCartMutation(CART_ATTRIBUTES_UPDATE, "cartAttributesUpdate", { attributes }),
    [runCartMutation]
  );
  const value = {
    ...state,
    add,
    updateQuantity,
    remove,
    clear,
    applyDiscountCodes,
    applyGiftCardCodes,
    removeGiftCards,
    updateNote,
    updateAttributes
  };
  return /* @__PURE__ */ jsx(CartContext.Provider, { value, children });
}
function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
function defaultsOf(map) {
  return Object.values(map).map((m) => m.default);
}
function pickByName(map, name) {
  const hit = Object.entries(map).find(
    ([key]) => key.endsWith(`/${name}.json`) || key.endsWith(`/${name}.tsx`)
  );
  return hit ? hit[1].default : void 0;
}
function renderStorefrontHTML(opts) {
  registerSections(defaultsOf(opts.sections));
  const shells = opts.shell ? defaultsOf(opts.shell) : [];
  const Shell = shells[0] ?? (({ children }) => /* @__PURE__ */ jsx(Fragment, { children }));
  const pageDoc = pickByName(opts.pages, opts.page ?? "index") ?? { sections: [] };
  return renderToString(
    /* @__PURE__ */ jsx(DataProvider, { value: opts.data, children: /* @__PURE__ */ jsx(ThemeProvider, { settings: opts.settings, locale: opts.locale, children: /* @__PURE__ */ jsx(CartProvider, { children: /* @__PURE__ */ jsx(Shell, { children: /* @__PURE__ */ jsx(SectionTree, { tree: pageDoc.sections }) }) }) }) })
  );
}
function renderSectionPreviewHTML(opts, type, settingsOverride) {
  const defs = defaultsOf(opts.sections);
  registerSections(defs);
  const def = defs.find((d) => d.name === type);
  const presetBlocks = def?.presets?.[0]?.blocks ?? [];
  const node = {
    type,
    id: "preview",
    settings: settingsOverride ?? {},
    blocks: presetBlocks.map((b, i) => ({
      type: b.type,
      id: `preview-${i}`,
      settings: b.settings ?? {}
    }))
  };
  return renderToString(
    /* @__PURE__ */ jsx(DataProvider, { value: opts.data, children: /* @__PURE__ */ jsx(ThemeProvider, { settings: opts.settings, locale: opts.locale, children: /* @__PURE__ */ jsx(CartProvider, { children: /* @__PURE__ */ jsx(SectionTree, { tree: [node] }) }) }) })
  );
}
export {
  CartProvider as C,
  DataProvider as D,
  SectionTree as S,
  ThemeProvider as T,
  allSections as a,
  createLiveDataFromSnapshot as b,
  createLiveData as c,
  createMockData as d,
  customerTokenStore as e,
  formatDate as f,
  formatMoney as g,
  formatMoneyWithCurrency as h,
  formatMoneyWithoutCurrency as i,
  formatMoneyWithoutTrailingZeros as j,
  formatWeight as k,
  getSection as l,
  imageUrl as m,
  renderSectionPreviewHTML as n,
  renderStorefrontHTML as o,
  useData as p,
  useSettings as q,
  registerSections as r,
  useT as s,
  useCart as u
};
//# sourceMappingURL=ssg-BLhqpVq0.js.map
