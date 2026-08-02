import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import { defineSection, useCart, useT, getAnalytics, useData, useBoundText, useSettings } from "@tanqory/theme-kit";
import { useCustomerAccount, Container, Link, useProductContext, Button, decodeHandle, apiBase, ImageResponsive, Money, useChrome, usePersistedChoice, LOCALE_KEY, COUNTRY_KEY, openOverlay, closeOverlay, AccountMenu, useMenu, useProductPage, ProductProvider, Price } from "@tanqory/theme-kit/app";
import { useState, useEffect, Children } from "react";
import { createSectionPreview } from "@tanqory/theme-kit/app/ssg";
function AccordionBlock({ attributes }) {
  const heading = attributes.heading;
  const body = attributes.body;
  if (!heading) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsxs("details", { className: "block-accordion", open: attributes.open === true, children: [
    /* @__PURE__ */ jsxs("summary", { className: "block-accordion__summary", children: [
      /* @__PURE__ */ jsx("span", { children: heading }),
      /* @__PURE__ */ jsx("span", { className: "block-accordion__icon", "aria-hidden": true, children: "+" })
    ] }),
    body && /* @__PURE__ */ jsx("div", { className: "block-accordion__body", dangerouslySetInnerHTML: { __html: body } })
  ] });
}
const AccordionBlock_default = defineSection({
  name: "accordion",
  title: "Accordion",
  category: "block",
  icon: "▽",
  attributes: {
    heading: { type: "text", default: "Question", label: "Heading" },
    body: { type: "richtext", default: "Answer goes here.", label: "Body" },
    open: { type: "boolean", default: false, label: "Open by default" }
  },
  component: AccordionBlock
});
const __vite_glob_0_0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AccordionBlock,
  default: AccordionBlock_default
}, Symbol.toStringTag, { value: "Module" }));
function AccountPage(_props) {
  var _a;
  const account = useCustomerAccount();
  return /* @__PURE__ */ jsx("section", { className: "section account", children: /* @__PURE__ */ jsx(Container, { className: "account__inner", children: account.loading ? /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: "Loading your account…" }) : !account.signedIn ? /* @__PURE__ */ jsxs("div", { className: "stack stack--sm", children: [
    /* @__PURE__ */ jsx("h1", { children: "Account" }),
    /* @__PURE__ */ jsx("p", { className: "lede u-text-muted", children: account.status === "error" ? "We couldn’t load your account. Please sign in again." : "Sign in to see your orders and saved addresses." }),
    /* @__PURE__ */ jsx(Link, { href: account.loginHref, className: "btn btn--primary", children: "Sign in" })
  ] }) : /* @__PURE__ */ jsxs("div", { className: "stack", children: [
    /* @__PURE__ */ jsxs("h1", { children: [
      "Hi ",
      ((_a = account.customer) == null ? void 0 : _a.firstName) ?? "there"
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "account__orders stack stack--sm", children: [
      /* @__PURE__ */ jsx("h2", { children: "Orders" }),
      account.orders.length === 0 ? /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: "You haven’t placed any orders yet." }) : /* @__PURE__ */ jsx("ul", { className: "account__order-list", children: account.orders.map((o) => /* @__PURE__ */ jsxs("li", { className: "account__order", children: [
        /* @__PURE__ */ jsx("span", { children: o.name ?? o.id }),
        o.financialStatus && /* @__PURE__ */ jsxs("span", { className: "u-text-muted", children: [
          " · ",
          o.financialStatus
        ] })
      ] }, o.id)) })
    ] })
  ] }) }) });
}
const AccountPage_default = defineSection({
  name: "account",
  title: "Account",
  category: "commerce",
  icon: "user",
  attributes: {},
  component: AccountPage
});
const __vite_glob_0_1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AccountPage,
  default: AccountPage_default
}, Symbol.toStringTag, { value: "Module" }));
function AddToCart({ attributes }) {
  const ctx = useProductContext();
  if (!ctx) return /* @__PURE__ */ jsx(Fragment, {});
  const label = attributes.label || "Add to cart";
  return /* @__PURE__ */ jsx("div", { className: "cluster", style: { marginTop: "var(--space-3)" }, children: /* @__PURE__ */ jsx(
    Button,
    {
      label: ctx.soldOut ? "Sold out" : ctx.adding ? "Adding…" : label,
      onClick: () => void ctx.add(),
      disabled: ctx.soldOut || ctx.adding,
      variant: "primary",
      size: "lg",
      fullWidth: true
    }
  ) });
}
const AddToCart_default = defineSection({
  name: "add-to-cart",
  title: "Add to cart",
  category: "block",
  icon: "+",
  attributes: {
    label: { type: "text", default: "Add to cart", label: "Label" }
  },
  component: AddToCart
});
const __vite_glob_0_2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AddToCart,
  default: AddToCart_default
}, Symbol.toStringTag, { value: "Module" }));
function AnnouncementBar({ attributes }) {
  const text = attributes.text;
  const link = attributes.link;
  if (!text) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "announcement-bar",
      style: { background: attributes.bg, color: attributes.fg },
      children: /* @__PURE__ */ jsx("div", { className: "container", children: link ? /* @__PURE__ */ jsx("a", { className: "announcement-bar__text", href: link, style: { color: "inherit" }, children: text }) : /* @__PURE__ */ jsx("p", { className: "announcement-bar__text", children: text }) })
    }
  );
}
const AnnouncementBar_default = defineSection({
  name: "announcement-bar",
  title: "Announcement bar",
  category: "layout",
  icon: "▔",
  attributes: {
    text: { type: "text", default: "Free shipping on orders over $50", label: "Text" },
    link: { type: "url", label: "Link (optional)" },
    bg: { type: "color", default: "#0a0a0a", label: "Background" },
    fg: { type: "color", default: "#ffffff", label: "Text color" }
  },
  component: AnnouncementBar
});
const __vite_glob_0_3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AnnouncementBar,
  default: AnnouncementBar_default
}, Symbol.toStringTag, { value: "Module" }));
const __vite_import_meta_env__$4 = {};
function ArticleBody({ attributes }) {
  var _a;
  const { fallbackTitle, fallbackBody } = attributes;
  const handles = typeof window !== "undefined" ? window.location.pathname.match(/^\/blogs\/([^/]+)\/([^/]+)\/?$/) : null;
  const blogHandle = decodeHandle(handles == null ? void 0 : handles[1]);
  const articleHandle = decodeHandle(handles == null ? void 0 : handles[2]);
  const [article, setArticle] = useState(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!blogHandle || !articleHandle) {
      setLoaded(true);
      return;
    }
    const env = __vite_import_meta_env__$4;
    if (!env.VITE_TANQORY_BACKEND || !env.VITE_TANQORY_STORE_ID) {
      setLoaded(true);
      return;
    }
    const url = `${apiBase(env.VITE_TANQORY_BACKEND)}/api/v1/stores/${encodeURIComponent(
      env.VITE_TANQORY_STORE_ID
    )}/graphql`;
    let cancelled = false;
    fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...env.VITE_TANQORY_STOREFRONT_TOKEN ? { "x-publishable-key": env.VITE_TANQORY_STOREFRONT_TOKEN } : {}
      },
      body: JSON.stringify({
        // Use the nested Blog.articleByHandle resolver: the root-level
        // article(handle: ArticleHandleInput) endpoint has a known store-api
        // bug (passes the whole input object where the data layer expects a
        // string handle, throws internal_error). Nested form works end-to-end
        // and gives us the same article shape; switching back is a one-line
        // change once the resolver is patched.
        query: `query A($blogHandle: String!, $articleHandle: String!) {
          blog(handle: $blogHandle) {
            handle
            title
            articleByHandle(handle: $articleHandle) {
              title
              contentHtml
              publishedAt
              author { name }
              image { url altText }
            }
          }
        }`,
        variables: { blogHandle, articleHandle }
      })
    }).then((r) => r.json()).then((j) => {
      var _a2;
      if (cancelled) return;
      const blog = (_a2 = j.data) == null ? void 0 : _a2.blog;
      const a = blog == null ? void 0 : blog.articleByHandle;
      if (a) {
        setArticle({
          ...a,
          blog: blog ? { handle: blog.handle, title: blog.title } : null
        });
      } else {
        setArticle(null);
      }
      setLoaded(true);
    }).catch(() => {
      if (!cancelled) setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [blogHandle, articleHandle]);
  const title = (article == null ? void 0 : article.title) ?? (loaded ? fallbackTitle ?? "" : "");
  const body = (article == null ? void 0 : article.contentHtml) ?? (loaded ? fallbackBody ?? "" : "");
  return /* @__PURE__ */ jsx("article", { className: "article-body", children: /* @__PURE__ */ jsxs(Container, { className: "article-body__inner", children: [
    (article == null ? void 0 : article.blog) && /* @__PURE__ */ jsx("p", { className: "article-body__crumbs", children: /* @__PURE__ */ jsx("a", { href: `/blogs/${article.blog.handle}`, children: article.blog.title }) }),
    title && /* @__PURE__ */ jsx("h1", { className: "article-body__title", children: title }),
    ((article == null ? void 0 : article.publishedAt) || (article == null ? void 0 : article.author)) && /* @__PURE__ */ jsxs("p", { className: "article-body__meta", children: [
      (article == null ? void 0 : article.publishedAt) && /* @__PURE__ */ jsx("time", { dateTime: article.publishedAt, children: new Date(article.publishedAt).toLocaleDateString(void 0, {
        year: "numeric",
        month: "long",
        day: "numeric"
      }) }),
      ((_a = article == null ? void 0 : article.author) == null ? void 0 : _a.name) && /* @__PURE__ */ jsxs(Fragment, { children: [
        article.publishedAt && " · ",
        /* @__PURE__ */ jsx("span", { children: article.author.name })
      ] })
    ] }),
    (article == null ? void 0 : article.image) && /* @__PURE__ */ jsx("figure", { className: "article-body__hero", children: /* @__PURE__ */ jsx("img", { src: article.image.url, alt: article.image.altText ?? article.title }) }),
    body && /* @__PURE__ */ jsx(
      "div",
      {
        className: "article-body__content rich-text",
        dangerouslySetInnerHTML: { __html: body }
      }
    )
  ] }) });
}
const ArticleBody_default = defineSection({
  name: "article-body",
  title: "Article content",
  category: "content",
  icon: "✎",
  attributes: {
    fallbackTitle: { type: "text", label: "Fallback title", default: "Article" },
    fallbackBody: { type: "textarea", label: "Fallback body (HTML)", default: "" }
  },
  component: ArticleBody
});
const __vite_glob_0_4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ArticleBody,
  default: ArticleBody_default
}, Symbol.toStringTag, { value: "Module" }));
const __vite_import_meta_env__$3 = {};
function BlogPosts({ attributes }) {
  var _a;
  const { fallbackTitle, fallbackEmpty } = attributes;
  const blogHandle = typeof window !== "undefined" ? decodeHandle((_a = window.location.pathname.match(/^\/blogs\/([^/]+)\/?$/)) == null ? void 0 : _a[1]) : void 0;
  const [blog, setBlog] = useState(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!blogHandle) {
      setLoaded(true);
      return;
    }
    const env = __vite_import_meta_env__$3;
    if (!env.VITE_TANQORY_BACKEND || !env.VITE_TANQORY_STORE_ID) {
      setLoaded(true);
      return;
    }
    const url = `${apiBase(env.VITE_TANQORY_BACKEND)}/api/v1/stores/${encodeURIComponent(
      env.VITE_TANQORY_STORE_ID
    )}/graphql`;
    let cancelled = false;
    fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...env.VITE_TANQORY_STOREFRONT_TOKEN ? { "x-publishable-key": env.VITE_TANQORY_STOREFRONT_TOKEN } : {}
      },
      body: JSON.stringify({
        query: `query B($h: String) {
          blog(handle: $h) {
            title
            articles(first: 30) {
              edges {
                node {
                  handle
                  title
                  excerpt
                  publishedAt
                  image { url altText }
                }
              }
            }
          }
        }`,
        variables: { h: blogHandle }
      })
    }).then((r) => r.json()).then((j) => {
      var _a2;
      if (cancelled) return;
      const b = (_a2 = j.data) == null ? void 0 : _a2.blog;
      if (!b) {
        setBlog(null);
      } else {
        setBlog({
          title: b.title,
          articles: b.articles.edges.map((e) => e.node)
        });
      }
      setLoaded(true);
    }).catch(() => {
      if (!cancelled) setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [blogHandle]);
  const title = (blog == null ? void 0 : blog.title) ?? (loaded ? fallbackTitle ?? "" : "");
  const showEmpty = loaded && (!blog || blog.articles.length === 0);
  return /* @__PURE__ */ jsx("section", { className: "blog-posts", children: /* @__PURE__ */ jsxs(Container, { className: "blog-posts__inner", children: [
    title && /* @__PURE__ */ jsx("h1", { className: "blog-posts__title", children: title }),
    blog && blog.articles.length > 0 && /* @__PURE__ */ jsx("ul", { className: "blog-posts__list", children: blog.articles.map((article) => /* @__PURE__ */ jsxs("li", { className: "blog-posts__item", children: [
      article.image && /* @__PURE__ */ jsx(
        "a",
        {
          className: "blog-posts__media",
          href: `/blogs/${blogHandle}/${article.handle}`,
          children: /* @__PURE__ */ jsx("img", { src: article.image.url, alt: article.image.altText ?? article.title })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "blog-posts__body", children: [
        /* @__PURE__ */ jsx("h2", { className: "blog-posts__heading", children: /* @__PURE__ */ jsx("a", { href: `/blogs/${blogHandle}/${article.handle}`, children: article.title }) }),
        article.publishedAt && /* @__PURE__ */ jsx("time", { className: "blog-posts__date", dateTime: article.publishedAt, children: new Date(article.publishedAt).toLocaleDateString(void 0, {
          year: "numeric",
          month: "long",
          day: "numeric"
        }) }),
        article.excerpt && /* @__PURE__ */ jsx("p", { className: "blog-posts__excerpt", children: article.excerpt })
      ] })
    ] }, article.handle)) }),
    showEmpty && fallbackEmpty && /* @__PURE__ */ jsx(
      "div",
      {
        className: "blog-posts__empty rich-text",
        dangerouslySetInnerHTML: { __html: fallbackEmpty }
      }
    )
  ] }) });
}
const BlogPosts_default = defineSection({
  name: "blog-posts",
  title: "Blog posts",
  category: "content",
  icon: "✎",
  attributes: {
    fallbackTitle: { type: "text", label: "Fallback title", default: "Journal" },
    fallbackEmpty: {
      type: "textarea",
      label: "Fallback (when empty)",
      default: ""
    }
  },
  component: BlogPosts
});
const __vite_glob_0_5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BlogPosts,
  default: BlogPosts_default
}, Symbol.toStringTag, { value: "Module" }));
function ButtonBlock({ attributes }) {
  const label = attributes.label;
  if (!label) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsx("div", { className: "block-button", style: { textAlign: attributes.align || "left" }, children: /* @__PURE__ */ jsx(
    Button,
    {
      label,
      link: attributes.link,
      variant: attributes.variant || "primary"
    }
  ) });
}
const ButtonBlock_default = defineSection({
  name: "button",
  title: "Button",
  category: "block",
  icon: "⬚",
  attributes: {
    label: { type: "text", default: "Shop now", label: "Label" },
    link: { type: "url", label: "Link" },
    variant: {
      type: "select",
      default: "primary",
      label: "Style",
      options: [
        { value: "primary", label: "Primary" },
        { value: "secondary", label: "Secondary" },
        { value: "ghost", label: "Ghost" },
        { value: "link", label: "Link" }
      ]
    },
    align: {
      type: "select",
      default: "left",
      label: "Alignment",
      options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
        { value: "right", label: "Right" }
      ]
    }
  },
  component: ButtonBlock
});
const __vite_glob_0_6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ButtonBlock,
  default: ButtonBlock_default
}, Symbol.toStringTag, { value: "Module" }));
function CartItems({ attributes }) {
  const { lines, subtotal, checkoutUrl, updateQuantity, remove } = useCart();
  const t = useT();
  const heading = attributes.heading ?? t("cart.title");
  const buttonLabel = attributes.buttonLabel ?? t("cart.checkout");
  const buttonLink = attributes.buttonLink ?? checkoutUrl ?? "/checkout";
  return /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsxs("div", { className: "container", children: [
    /* @__PURE__ */ jsx("h2", { style: { marginBottom: "var(--space-6)" }, children: heading }),
    lines.length === 0 ? /* @__PURE__ */ jsx(EmptyCart, {}) : /* @__PURE__ */ jsxs("div", { className: "cart", children: [
      /* @__PURE__ */ jsx("div", { className: "cart__list", children: lines.map((l) => {
        var _a, _b;
        return /* @__PURE__ */ jsxs("div", { className: "cart__line", children: [
          /* @__PURE__ */ jsx("div", { className: "cart__thumb", children: /* @__PURE__ */ jsx(ImageResponsive, { src: (_a = l.image) == null ? void 0 : _a.url, alt: ((_b = l.image) == null ? void 0 : _b.altText) ?? l.title }) }),
          /* @__PURE__ */ jsxs("div", { className: "cart__info", children: [
            /* @__PURE__ */ jsx("strong", { children: l.productHandle ? /* @__PURE__ */ jsx(Link, { href: `/products/${l.productHandle}`, children: l.title }) : l.title }),
            l.variantTitle && /* @__PURE__ */ jsx("span", { className: "u-text-muted", children: l.variantTitle }),
            /* @__PURE__ */ jsxs("div", { className: "cart__qty", style: { marginTop: "var(--space-2)" }, children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "aria-label": "Decrease quantity",
                  onClick: () => void updateQuantity(l.id, l.quantity - 1),
                  children: "−"
                }
              ),
              /* @__PURE__ */ jsx("span", { style: { minWidth: 32, textAlign: "center" }, children: l.quantity }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "aria-label": "Increase quantity",
                  onClick: () => void updateQuantity(l.id, l.quantity + 1),
                  children: "+"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "cart__remove",
                  "aria-label": `${t("cart.remove")} ${l.title}`,
                  style: { marginLeft: "var(--space-3)" },
                  onClick: () => {
                    getAnalytics().track("PRODUCT_REMOVED_FROM_CART", {
                      lineId: l.id,
                      title: l.title,
                      quantity: l.quantity,
                      ...l.productHandle ? { handle: l.productHandle } : {}
                    });
                    void remove(l.id);
                  },
                  children: t("cart.remove")
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx(Money, { value: l.lineSubtotal })
        ] }, l.id);
      }) }),
      /* @__PURE__ */ jsxs("aside", { className: "cart__summary", children: [
        /* @__PURE__ */ jsx("h3", { style: { fontFamily: "var(--font-body)", fontSize: "var(--type-step-1)", fontWeight: 500, letterSpacing: 0 }, children: t("cart.orderSummary") }),
        /* @__PURE__ */ jsxs("div", { className: "cart__row", children: [
          /* @__PURE__ */ jsx("span", { children: t("cart.subtotal") }),
          /* @__PURE__ */ jsx(Money, { value: subtotal })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "cart__row u-text-muted", children: [
          /* @__PURE__ */ jsx("span", { children: t("cart.shipping") }),
          /* @__PURE__ */ jsx("span", { children: t("cart.calculatedAtCheckout") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "cart__row cart__row--total", children: [
          /* @__PURE__ */ jsx("strong", { children: t("cart.total") }),
          /* @__PURE__ */ jsx("strong", { children: /* @__PURE__ */ jsx(Money, { value: subtotal }) })
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            label: buttonLabel,
            link: buttonLink,
            variant: "primary",
            size: "lg",
            fullWidth: true,
            onClick: () => {
              const a = getAnalytics();
              a.track("CHECKOUT_STARTED", { value: subtotal, lineCount: lines.length });
              a.flush();
            }
          }
        ),
        /* @__PURE__ */ jsxs(Link, { href: "/collections/all", className: "btn btn--link", style: { alignSelf: "center", marginTop: "var(--space-1)" }, children: [
          t("common.continueShopping"),
          " →"
        ] })
      ] })
    ] })
  ] }) });
}
function EmptyCart() {
  const t = useT();
  return /* @__PURE__ */ jsxs("div", { className: "not-found", children: [
    /* @__PURE__ */ jsx("h3", { children: t("cart.empty.title") }),
    /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: t("cart.empty.sub") }),
    /* @__PURE__ */ jsx(Button, { label: t("common.shopCollection"), link: "/collections/all", variant: "primary", size: "lg" })
  ] });
}
const CartItems_default = defineSection({
  name: "cart-items",
  title: "Cart items",
  category: "commerce",
  icon: "⊞",
  attributes: {
    heading: { type: "text", default: "Your cart", label: "Heading" },
    buttonLabel: { type: "text", default: "Checkout", label: "Checkout button" },
    buttonLink: { type: "url", label: "Checkout link override" }
  },
  component: CartItems
});
const __vite_glob_0_7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CartItems,
  default: CartItems_default
}, Symbol.toStringTag, { value: "Module" }));
function CollectionItem({ attributes }) {
  var _a, _b, _c, _d;
  const { collectionByHandle } = useData();
  const handle = attributes.collection ?? "";
  const titleOverride = attributes.title;
  const c = handle ? collectionByHandle(handle) : null;
  if (!c) {
    return /* @__PURE__ */ jsx("div", { className: "collection-card collection-card--empty card card--bordered u-text-center", children: /* @__PURE__ */ jsx("span", { className: "u-text-muted", children: handle ? `Collection "${handle}" not found` : "Pick a collection" }) });
  }
  const heroUrl = ((_a = c.image) == null ? void 0 : _a.url) ?? ((_c = (_b = c.products[0]) == null ? void 0 : _b.featuredImage) == null ? void 0 : _c.url);
  const heroAlt = ((_d = c.image) == null ? void 0 : _d.altText) ?? c.title;
  return /* @__PURE__ */ jsxs(Link, { href: `/collections/${c.handle}`, className: "collection-card", children: [
    /* @__PURE__ */ jsx(ImageResponsive, { src: heroUrl, alt: heroAlt }),
    /* @__PURE__ */ jsx("div", { className: "collection-card__overlay", children: /* @__PURE__ */ jsx("span", { className: "collection-card__title", children: titleOverride || c.title }) })
  ] });
}
const CollectionItem_default = defineSection({
  name: "collection-item",
  title: "Collection",
  category: "block",
  icon: "▢",
  attributes: {
    collection: { type: "collection", label: "Collection" },
    title: { type: "text", label: "Title override" }
  },
  component: CollectionItem
});
const __vite_glob_0_8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CollectionItem,
  default: CollectionItem_default
}, Symbol.toStringTag, { value: "Module" }));
function CollectionLinks({ attributes }) {
  const { allCollections } = useData();
  const limit = attributes.limit ?? 6;
  const columns = attributes.columns ?? 3;
  const collections = allCollections().slice(0, limit);
  if (collections.length === 0) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsxs("div", { className: "container", children: [
    attributes.heading && /* @__PURE__ */ jsx("div", { className: "product-grid__head", children: /* @__PURE__ */ jsx("h2", { children: attributes.heading }) }),
    /* @__PURE__ */ jsx("div", { className: "collection-links__grid", style: { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }, children: collections.map((c) => {
      var _a, _b, _c, _d;
      const image = ((_a = c.image) == null ? void 0 : _a.url) ?? ((_c = (_b = c.products[0]) == null ? void 0 : _b.featuredImage) == null ? void 0 : _c.url);
      return /* @__PURE__ */ jsxs("a", { className: "collection-link", href: `/collections/${c.handle}`, children: [
        /* @__PURE__ */ jsx("div", { className: "collection-link__media", children: image && /* @__PURE__ */ jsx("img", { src: image, alt: ((_d = c.image) == null ? void 0 : _d.altText) ?? c.title, loading: "lazy", decoding: "async" }) }),
        /* @__PURE__ */ jsx("span", { className: "collection-link__title", children: c.title })
      ] }, c.handle);
    }) })
  ] }) });
}
const CollectionLinks_default = defineSection({
  name: "collection-links",
  title: "Collection links",
  category: "content",
  icon: "▦",
  attributes: {
    heading: { type: "text", default: "Shop by collection", label: "Heading" },
    columns: { type: "range", default: 3, min: 2, max: 5, step: 1, label: "Columns" },
    limit: { type: "range", default: 6, min: 2, max: 12, step: 1, label: "Collections to show" }
  },
  component: CollectionLinks
});
const __vite_glob_0_9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CollectionLinks,
  default: CollectionLinks_default
}, Symbol.toStringTag, { value: "Module" }));
function CollectionList({ attributes, children }) {
  const { allCollections } = useData();
  const limit = attributes.limit ?? 12;
  const heading = attributes.heading ?? "Shop by collection";
  const subheading = attributes.subheading;
  const hasBlocks = Children.count(children) > 0;
  const collections = hasBlocks ? [] : allCollections().slice(0, limit);
  return /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsxs("div", { className: "container", children: [
    /* @__PURE__ */ jsx("div", { className: "featured-collection__head", children: /* @__PURE__ */ jsxs("div", { className: "stack stack--sm", children: [
      /* @__PURE__ */ jsx("h2", { children: heading }),
      subheading && /* @__PURE__ */ jsx("p", { className: "lede", children: subheading })
    ] }) }),
    hasBlocks ? /* @__PURE__ */ jsx("div", { className: "collection-list__grid", children }) : collections.length === 0 ? /* @__PURE__ */ jsx("div", { className: "card card--padded card--bordered u-text-center", children: /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: "No collections yet." }) }) : /* @__PURE__ */ jsx("div", { className: "collection-list__grid", children: collections.map((c) => {
      var _a, _b, _c, _d;
      const heroUrl = ((_a = c.image) == null ? void 0 : _a.url) ?? ((_c = (_b = c.products[0]) == null ? void 0 : _b.featuredImage) == null ? void 0 : _c.url);
      const heroAlt = ((_d = c.image) == null ? void 0 : _d.altText) ?? c.title;
      return /* @__PURE__ */ jsxs(Link, { href: `/collections/${c.handle}`, className: "collection-card", children: [
        /* @__PURE__ */ jsx(ImageResponsive, { src: heroUrl, alt: heroAlt }),
        /* @__PURE__ */ jsx("div", { className: "collection-card__overlay", children: /* @__PURE__ */ jsx("span", { className: "collection-card__title", children: c.title }) })
      ] }, c.handle);
    }) })
  ] }) });
}
const CollectionList_default = defineSection({
  name: "collection-list",
  title: "Collection list",
  category: "commerce",
  icon: "☷",
  attributes: {
    heading: { type: "text", default: "Shop by collection", label: "Heading" },
    subheading: { type: "text", label: "Subheading" },
    limit: { type: "number", default: 6, label: "Max collections (auto mode)" }
  },
  allowedBlocks: ["collection-item"],
  presets: [
    {
      blocks: [
        { type: "collection-item", settings: {} },
        { type: "collection-item", settings: {} },
        { type: "collection-item", settings: {} }
      ]
    }
  ],
  component: CollectionList
});
const __vite_glob_0_10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CollectionList,
  default: CollectionList_default
}, Symbol.toStringTag, { value: "Module" }));
const PATHS = {
  truck: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("path", { d: "M3 7h11v8H3z" }),
    /* @__PURE__ */ jsx("path", { d: "M14 10h3.5L21 13v2h-7z" }),
    /* @__PURE__ */ jsx("circle", { cx: "7", cy: "17", r: "1.6" }),
    /* @__PURE__ */ jsx("circle", { cx: "17.5", cy: "17", r: "1.6" })
  ] }),
  return: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("path", { d: "M9 7 4 12l5 5" }),
    /* @__PURE__ */ jsx("path", { d: "M4 12h10a6 6 0 0 1 6 6" })
  ] }),
  chat: /* @__PURE__ */ jsx("path", { d: "M21 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.3A7.5 7.5 0 1 1 21 11.5z" }),
  shield: /* @__PURE__ */ jsx("path", { d: "M12 3 5 6v6c0 4.2 3 7.4 7 9 4-1.6 7-4.8 7-9V6z" }),
  star: /* @__PURE__ */ jsx("path", { d: "M12 3.5 14.6 9l6 .6-4.5 4 1.4 5.9L12 16.4 6.5 19.5 7.9 13.6 3.4 9.6l6-.6z" }),
  gift: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("rect", { x: "4", y: "9", width: "16", height: "11", rx: "1" }),
    /* @__PURE__ */ jsx("path", { d: "M4 13h16M12 9v11M8.5 9a2.2 2.2 0 1 1 3.5-1.8M15.5 9a2.2 2.2 0 1 0-3.5-1.8" })
  ] }),
  leaf: /* @__PURE__ */ jsx("path", { d: "M5 19c0-8 6-13 14-13 0 9-5 14-13 14a8 8 0 0 1 5-7" }),
  clock: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "8.5" }),
    /* @__PURE__ */ jsx("path", { d: "M12 7v5l3.5 2" })
  ] }),
  // Social (simplified marks)
  instagram: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("rect", { x: "4", y: "4", width: "16", height: "16", rx: "4.5" }),
    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "3.6" }),
    /* @__PURE__ */ jsx("circle", { cx: "17", cy: "7", r: "0.9", fill: "currentColor", stroke: "none" })
  ] }),
  facebook: /* @__PURE__ */ jsx("path", { d: "M14.5 8.5H16V5.6h-1.9c-1.9 0-3.1 1.2-3.1 3.1v1.8H9v2.9h2v6.1h3v-6.1h2.1l.5-2.9H14v-1.4c0-.4.2-.6.5-.6z" }),
  x: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("path", { d: "M5 5l14 14" }),
    /* @__PURE__ */ jsx("path", { d: "M19 5 5 19" })
  ] }),
  youtube: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("rect", { x: "3", y: "6.5", width: "18", height: "11", rx: "3.2" }),
    /* @__PURE__ */ jsx("path", { d: "M11 9.8l4 2.2-4 2.2z", fill: "currentColor", stroke: "none" })
  ] }),
  tiktok: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("path", { d: "M13.5 5v9.2a3.3 3.3 0 1 1-2.4-3.18" }),
    /* @__PURE__ */ jsx("path", { d: "M13.5 5c.4 1.9 1.9 3.2 3.9 3.4" })
  ] })
};
function Icon$1({ name, size = 28 }) {
  const path = name ? PATHS[name] : null;
  if (!path) return null;
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.6",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: path
    }
  );
}
function ColumnItem({ attributes }) {
  const icon = attributes.icon;
  const heading = attributes.heading;
  const body = attributes.body;
  return /* @__PURE__ */ jsxs("div", { className: "multicolumn__item", children: [
    icon && /* @__PURE__ */ jsx("div", { className: "multicolumn__icon", children: /* @__PURE__ */ jsx(Icon$1, { name: icon }) }),
    heading && /* @__PURE__ */ jsx("h3", { children: heading }),
    body && /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: body })
  ] });
}
const ColumnItem_default = defineSection({
  name: "column",
  title: "Column",
  category: "block",
  icon: "▥",
  attributes: {
    icon: {
      type: "select",
      default: "star",
      label: "Icon",
      options: [
        { value: "truck", label: "Truck" },
        { value: "return", label: "Return" },
        { value: "chat", label: "Chat" },
        { value: "shield", label: "Shield" },
        { value: "star", label: "Star" },
        { value: "gift", label: "Gift" },
        { value: "leaf", label: "Leaf" },
        { value: "clock", label: "Clock" }
      ]
    },
    heading: { type: "text", default: "Feature", label: "Heading" },
    body: { type: "textarea", label: "Body" }
  },
  component: ColumnItem
});
const __vite_glob_0_11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ColumnItem,
  default: ColumnItem_default
}, Symbol.toStringTag, { value: "Module" }));
function ContactForm({ attributes }) {
  const heading = attributes.heading ?? "Get in touch";
  const subheading = attributes.subheading;
  const buttonLabel = attributes.buttonLabel ?? "Send message";
  const action = attributes.action ?? "/_api/contact";
  const showPhone = Boolean(attributes.showPhone);
  return /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsx("div", { className: "container", children: /* @__PURE__ */ jsxs("div", { className: "contact", children: [
    /* @__PURE__ */ jsxs("div", { className: "contact__head", children: [
      /* @__PURE__ */ jsx("h2", { children: heading }),
      subheading && /* @__PURE__ */ jsx("p", { className: "lede", children: subheading })
    ] }),
    /* @__PURE__ */ jsxs("form", { className: "contact__form", action, method: "post", children: [
      /* @__PURE__ */ jsxs("label", { className: "field", children: [
        /* @__PURE__ */ jsx("span", { className: "field__label", children: "First name" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "field__input",
            name: "firstName",
            type: "text",
            required: true,
            autoComplete: "given-name"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "field", children: [
        /* @__PURE__ */ jsx("span", { className: "field__label", children: "Last name" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "field__input",
            name: "lastName",
            type: "text",
            autoComplete: "family-name"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "field field--full", children: [
        /* @__PURE__ */ jsx("span", { className: "field__label", children: "Email" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "field__input",
            name: "email",
            type: "email",
            required: true,
            autoComplete: "email"
          }
        )
      ] }),
      showPhone && /* @__PURE__ */ jsxs("label", { className: "field field--full", children: [
        /* @__PURE__ */ jsx("span", { className: "field__label", children: "Phone (optional)" }),
        /* @__PURE__ */ jsx("input", { className: "field__input", name: "phone", type: "tel", autoComplete: "tel" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "field field--full", children: [
        /* @__PURE__ */ jsx("span", { className: "field__label", children: "Message" }),
        /* @__PURE__ */ jsx("textarea", { className: "field__textarea", name: "message", required: true })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "field--full", style: { marginTop: "var(--space-3)" }, children: /* @__PURE__ */ jsx("button", { className: "btn btn--primary btn--lg", type: "submit", children: buttonLabel }) })
    ] })
  ] }) }) });
}
const ContactForm_default = defineSection({
  name: "contact-form",
  title: "Contact form",
  category: "forms",
  icon: "✉",
  attributes: {
    heading: { type: "text", default: "Get in touch", label: "Heading" },
    subheading: {
      type: "text",
      default: "We'll reply within one business day.",
      label: "Subheading"
    },
    showPhone: { type: "boolean", default: false, label: "Show phone field" },
    buttonLabel: { type: "text", default: "Send message", label: "Button label" },
    action: { type: "url", label: "Form action URL" }
  },
  component: ContactForm
});
const __vite_glob_0_12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ContactForm,
  default: ContactForm_default
}, Symbol.toStringTag, { value: "Module" }));
function Divider({ attributes }) {
  const height = attributes.height ?? 48;
  const showLine = attributes.showLine === true;
  return /* @__PURE__ */ jsx("div", { className: "divider", style: { paddingTop: height / 2, paddingBottom: height / 2 }, children: /* @__PURE__ */ jsx("div", { className: "container", children: showLine && /* @__PURE__ */ jsx("hr", { className: "divider__line", style: { borderColor: attributes.color } }) }) });
}
const Divider_default = defineSection({
  name: "divider",
  title: "Divider",
  category: "layout",
  icon: "—",
  attributes: {
    height: { type: "range", default: 48, min: 8, max: 160, step: 8, label: "Height (px)" },
    showLine: { type: "boolean", default: true, label: "Show line" },
    color: { type: "color", default: "#e7e7e9", label: "Line color" }
  },
  component: Divider
});
const __vite_glob_0_13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Divider,
  default: Divider_default
}, Symbol.toStringTag, { value: "Module" }));
function parseItems$1(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      return JSON.parse(raw);
    } catch {
    }
  }
  return [];
}
const DEFAULT_FAQ = [
  {
    q: "How long does shipping take?",
    a: "3–5 business days within the country, 7–14 days internationally. You'll receive a tracking link as soon as your order ships."
  },
  {
    q: "What is your return policy?",
    a: "We accept returns within 30 days of delivery. Items must be unworn, unwashed, and in original packaging with tags attached."
  },
  {
    q: "Do you ship internationally?",
    a: "Yes — we ship worldwide. Duties and taxes may apply depending on the destination; rates are calculated at checkout."
  },
  {
    q: "How do I care for my pieces?",
    a: "Each product page lists specific care instructions. As a general rule, we recommend cold water washing and air drying for the longest life."
  }
];
function FAQ({ attributes, children }) {
  const items = parseItems$1(attributes.items);
  const list = items.length > 0 ? items : DEFAULT_FAQ;
  const hasBlocks = Children.count(children) > 0;
  const eyebrow = attributes.eyebrow;
  const heading = attributes.heading ?? "Frequently asked questions";
  return /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsx("div", { className: "container", children: /* @__PURE__ */ jsxs("div", { className: "faq", children: [
    /* @__PURE__ */ jsxs("div", { className: "faq__head", children: [
      eyebrow && /* @__PURE__ */ jsx("span", { className: "eyebrow", children: eyebrow }),
      /* @__PURE__ */ jsx("h2", { children: heading })
    ] }),
    hasBlocks ? children : list.map((it, i) => /* @__PURE__ */ jsxs("details", { className: "faq__item", children: [
      /* @__PURE__ */ jsx("summary", { className: "faq__summary", children: it.q }),
      it.a && /* @__PURE__ */ jsx("p", { className: "faq__body", children: it.a })
    ] }, i))
  ] }) }) });
}
const FAQ_default = defineSection({
  name: "faq",
  title: "FAQ",
  category: "content",
  icon: "?",
  attributes: {
    eyebrow: { type: "text", label: "Eyebrow" },
    heading: { type: "text", default: "Frequently asked questions", label: "Heading" }
  },
  allowedBlocks: ["faq-item"],
  presets: [
    {
      blocks: [
        { type: "faq-item", settings: { question: "What is your return policy?", answer: "Returns are accepted within 30 days of delivery — no questions asked." } },
        { type: "faq-item", settings: { question: "How long does shipping take?", answer: "Most orders arrive within 3–5 business days." } },
        { type: "faq-item", settings: { question: "Do you ship internationally?", answer: "Yes — we ship to most countries worldwide." } }
      ]
    }
  ],
  component: FAQ
});
const __vite_glob_0_14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FAQ,
  default: FAQ_default
}, Symbol.toStringTag, { value: "Module" }));
function FaqItem({ attributes }) {
  const q = attributes.question;
  const a = attributes.answer;
  return /* @__PURE__ */ jsxs("details", { className: "faq__item", children: [
    /* @__PURE__ */ jsx("summary", { className: "faq__summary", children: q ?? "Question" }),
    a && /* @__PURE__ */ jsx("p", { className: "faq__body", children: a })
  ] });
}
const FaqItem_default = defineSection({
  name: "faq-item",
  title: "Question",
  category: "block",
  icon: "?",
  attributes: {
    question: { type: "text", default: "Your question?", label: "Question" },
    answer: { type: "textarea", label: "Answer" }
  },
  component: FaqItem
});
const __vite_glob_0_15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FaqItem,
  default: FaqItem_default
}, Symbol.toStringTag, { value: "Module" }));
function FeatureGridBlocks({ attributes, children }) {
  const eyebrow = useBoundText(attributes.eyebrow);
  const heading = useBoundText(attributes.heading);
  const cols = Math.min(Math.max(Number(attributes.columns ?? 3), 2), 4);
  return /* @__PURE__ */ jsxs("section", { className: "section feature-grid-blocks", children: [
    /* @__PURE__ */ jsx("style", { children: `
        .feature-grid-blocks__head { max-width: 640px; margin: 0 auto var(--space-8); text-align: center; }
        .feature-grid-blocks__items { display: grid; grid-template-columns: repeat(${cols}, minmax(0, 1fr)); gap: var(--space-8); }
        @media (max-width: 749px) { .feature-grid-blocks__items { grid-template-columns: 1fr; } }
      ` }),
    /* @__PURE__ */ jsxs("div", { className: "container", children: [
      (eyebrow || heading) && /* @__PURE__ */ jsxs("div", { className: "feature-grid-blocks__head", children: [
        eyebrow && /* @__PURE__ */ jsx("span", { className: "eyebrow", children: eyebrow }),
        heading && /* @__PURE__ */ jsx("h2", { style: { marginTop: "var(--space-2)" }, children: heading })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "feature-grid-blocks__items", children })
    ] })
  ] });
}
const FeatureGridBlocks_default = defineSection({
  name: "feature-grid-blocks",
  title: "Feature grid (blocks)",
  category: "content",
  icon: "star",
  attributes: {
    eyebrow: { type: "text", label: "Eyebrow", dynamic: true },
    heading: { type: "text", default: "Why shop with us", label: "Heading", dynamic: true },
    columns: { type: "range", default: 3, min: 2, max: 4, label: "Columns" }
  },
  allowedBlocks: ["column", "icon", "heading", "text"],
  presets: [
    {
      blocks: [
        { type: "column", settings: { icon: "truck", heading: "Free shipping", body: "On every order, no minimum." } },
        { type: "column", settings: { icon: "shield", heading: "Secure payment", body: "Encrypted, trusted checkout." } },
        { type: "column", settings: { icon: "clock", heading: "24/7 support", body: "Here whenever you need us." } }
      ]
    }
  ],
  component: FeatureGridBlocks
});
const __vite_glob_0_16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FeatureGridBlocks,
  default: FeatureGridBlocks_default
}, Symbol.toStringTag, { value: "Module" }));
function FeatureHighlights({ attributes }) {
  let features = [];
  try {
    features = JSON.parse(attributes.features || "[]");
  } catch {
    features = [];
  }
  const bgColor = attributes.background || "transparent";
  const alignLeft = attributes.textAlign === "left";
  return /* @__PURE__ */ jsxs("section", { className: "section feature-highlights", style: { background: bgColor }, children: [
    /* @__PURE__ */ jsx("style", { children: `
        .feature-highlights__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-10); text-align: center; }
        .feature-highlights__icon { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-lg, 16px); background: var(--color-surface, #f7f7f7); margin-bottom: var(--space-4); }
        .feature-highlights__icon svg { width: 24px; height: 24px; stroke: currentColor; }
        .feature-highlights__title { margin-top: var(--space-2); font-weight: bold; font-size: 1.2em; }
        .feature-highlights__description { margin-top: var(--space-2); color: var(--text-secondary); line-height: var(--leading-loose); }
        @media (max-width: 749px) {
          .feature-highlights__grid { grid-template-columns: 1fr; text-align: ${alignLeft ? "left" : "center"}; }
        }
      ` }),
    /* @__PURE__ */ jsx("div", { className: "container", children: /* @__PURE__ */ jsx("div", { className: "feature-highlights__grid", children: features.map((feature, index) => /* @__PURE__ */ jsxs("div", { className: "feature-highlights__item", children: [
      /* @__PURE__ */ jsx("div", { className: "feature-highlights__icon", children: /* @__PURE__ */ jsx("svg", { children: /* @__PURE__ */ jsx("use", { href: `#${feature.icon}` }) }) }),
      /* @__PURE__ */ jsx("div", { className: "feature-highlights__title", children: feature.title }),
      /* @__PURE__ */ jsx("div", { className: "feature-highlights__description", children: feature.description })
    ] }, index)) }) })
  ] });
}
const FeatureHighlights_default = defineSection({
  name: "feature-highlights",
  title: "Feature Highlights",
  category: "content",
  icon: "star",
  attributes: {
    features: {
      type: "textarea",
      label: "Features",
      default: '[{"icon":"truck","title":"Free Shipping","description":"Enjoy free shipping on all orders."},{"icon":"shield","title":"Secure Payment","description":"Your payment information is safe with us."},{"icon":"clock","title":"Fast Delivery","description":"Get your orders delivered quickly."}]'
    },
    background: { type: "color", label: "Background Color" },
    textAlign: { type: "select", label: "Text Alignment", default: "center", options: [
      { value: "left", label: "Left" },
      { value: "center", label: "Center" }
    ] }
  },
  component: FeatureHighlights
});
const __vite_glob_0_17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FeatureHighlights,
  default: FeatureHighlights_default
}, Symbol.toStringTag, { value: "Module" }));
const __vite_import_meta_env__$2 = {};
function FeaturedCollection({ attributes }) {
  const { collectionByHandle } = useData();
  const handle = attributes.collection ?? "all";
  const limit = attributes.limit ?? 8;
  const eyebrow = attributes.eyebrow;
  const heading = attributes.heading ?? "Featured";
  const subheading = attributes.subheading;
  const showViewAll = attributes.showViewAll !== false;
  const cached = collectionByHandle(handle);
  const cachedProducts = ((cached == null ? void 0 : cached.products) ?? []).slice(0, limit);
  const [livePrducts, setLiveProducts] = useState(null);
  const cacheUsable = Boolean(cached && cachedProducts.length > 0);
  useEffect(() => {
    if (cacheUsable) {
      setLiveProducts(null);
      return;
    }
    const env = __vite_import_meta_env__$2;
    if (!env.VITE_TANQORY_BACKEND || !env.VITE_TANQORY_STORE_ID) return;
    const url = `${apiBase(env.VITE_TANQORY_BACKEND)}/api/v1/stores/${encodeURIComponent(
      env.VITE_TANQORY_STORE_ID
    )}/graphql`;
    let cancelled = false;
    fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...env.VITE_TANQORY_STOREFRONT_TOKEN ? { "x-publishable-key": env.VITE_TANQORY_STOREFRONT_TOKEN } : {}
      },
      body: JSON.stringify({
        query: `query C($h: String, $first: Int!) {
          collection(handle: $h) {
            handle
            title
            products(first: $first) {
              edges {
                node {
                  handle
                  title
                  featuredImage { url altText }
                  priceRange { minVariantPrice { amount currencyCode } }
                }
              }
            }
          }
        }`,
        variables: { h: handle, first: limit }
      })
    }).then((r) => r.json()).then((j) => {
      var _a;
      if (cancelled) return;
      const col = (_a = j.data) == null ? void 0 : _a.collection;
      if (!col) {
        setLiveProducts([]);
        return;
      }
      setLiveProducts(
        col.products.edges.map((e) => ({
          handle: e.node.handle,
          title: e.node.title,
          featuredImage: e.node.featuredImage ? {
            url: e.node.featuredImage.url,
            ...e.node.featuredImage.altText ? { altText: e.node.featuredImage.altText } : {}
          } : null,
          price: e.node.priceRange.minVariantPrice
        }))
      );
    }).catch(() => {
      if (!cancelled) setLiveProducts([]);
    });
    return () => {
      cancelled = true;
    };
  }, [cacheUsable, handle, limit]);
  const products = cacheUsable ? cachedProducts.map((p) => ({
    handle: p.handle,
    title: p.title,
    featuredImage: p.featuredImage ?? null,
    price: p.price
  })) : livePrducts ?? [];
  return /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsxs("div", { className: "container", children: [
    /* @__PURE__ */ jsxs("div", { className: "featured-collection__head", children: [
      /* @__PURE__ */ jsxs("div", { className: "stack stack--sm", children: [
        eyebrow && /* @__PURE__ */ jsx("span", { className: "eyebrow", children: eyebrow }),
        /* @__PURE__ */ jsx("h2", { children: heading }),
        subheading && /* @__PURE__ */ jsx("p", { className: "lede", children: subheading })
      ] }),
      showViewAll && /* @__PURE__ */ jsx(Link, { href: `/collections/${handle}`, className: "btn btn--link", children: "View all →" })
    ] }),
    products.length === 0 ? /* @__PURE__ */ jsx(EmptyState, {}) : /* @__PURE__ */ jsx("div", { className: "featured-collection__grid", children: products.map((p) => {
      var _a, _b;
      return /* @__PURE__ */ jsxs(Link, { href: `/products/${p.handle}`, className: "product-card", children: [
        /* @__PURE__ */ jsx("div", { className: "product-card__media", children: /* @__PURE__ */ jsx(ImageResponsive, { src: (_a = p.featuredImage) == null ? void 0 : _a.url, alt: ((_b = p.featuredImage) == null ? void 0 : _b.altText) ?? p.title }) }),
        /* @__PURE__ */ jsx("span", { className: "product-card__title", children: p.title }),
        /* @__PURE__ */ jsx("span", { className: "product-card__price", children: /* @__PURE__ */ jsx(Money, { value: p.price }) })
      ] }, p.handle);
    }) })
  ] }) });
}
function EmptyState() {
  return /* @__PURE__ */ jsx("div", { className: "card card--padded card--bordered u-text-center", children: /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: "No products in this collection yet." }) });
}
const FeaturedCollection_default = defineSection({
  name: "featured-collection",
  title: "Featured collection",
  category: "commerce",
  icon: "▦",
  attributes: {
    eyebrow: { type: "text", label: "Eyebrow" },
    heading: { type: "text", default: "Featured", label: "Heading" },
    subheading: { type: "text", label: "Subheading" },
    collection: { type: "collection", default: "all", label: "Collection" },
    limit: { type: "number", default: 8, label: "Max products" },
    showViewAll: { type: "boolean", default: true, label: 'Show "View all" link' }
  },
  component: FeaturedCollection
});
const __vite_glob_0_18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FeaturedCollection,
  default: FeaturedCollection_default
}, Symbol.toStringTag, { value: "Module" }));
const __vite_import_meta_env__$1 = {};
function FeaturedProduct({ attributes }) {
  var _a, _b, _c, _d;
  const { productByHandle, collectionByHandle } = useData();
  const handle = attributes.product;
  const fromHandle = handle ? productByHandle(handle) : null;
  const fallback = ((_b = (_a = collectionByHandle("all")) == null ? void 0 : _a.products) == null ? void 0 : _b[0]) ?? null;
  const [livePrduct, setLiveProduct] = useState(null);
  useEffect(() => {
    if (!handle || fromHandle) {
      setLiveProduct(null);
      return;
    }
    const env = __vite_import_meta_env__$1;
    if (!env.VITE_TANQORY_BACKEND || !env.VITE_TANQORY_STORE_ID) return;
    const url = `${apiBase(env.VITE_TANQORY_BACKEND)}/api/v1/stores/${encodeURIComponent(
      env.VITE_TANQORY_STORE_ID
    )}/graphql`;
    let cancelled = false;
    fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...env.VITE_TANQORY_STOREFRONT_TOKEN ? { "x-publishable-key": env.VITE_TANQORY_STOREFRONT_TOKEN } : {}
      },
      body: JSON.stringify({
        query: `query P($h: String) {
          product(handle: $h) {
            handle
            title
            featuredImage { url altText }
            priceRange { minVariantPrice { amount currencyCode } }
          }
        }`,
        variables: { h: handle }
      })
    }).then((r) => r.json()).then((j) => {
      var _a2;
      if (cancelled) return;
      const p = (_a2 = j.data) == null ? void 0 : _a2.product;
      setLiveProduct(
        p ? {
          handle: p.handle,
          title: p.title,
          featuredImage: p.featuredImage ? {
            url: p.featuredImage.url,
            ...p.featuredImage.altText ? { altText: p.featuredImage.altText } : {}
          } : null,
          price: p.priceRange.minVariantPrice
        } : null
      );
    }).catch(() => {
      if (!cancelled) setLiveProduct(null);
    });
    return () => {
      cancelled = true;
    };
  }, [handle, fromHandle]);
  const product = fromHandle ? {
    handle: fromHandle.handle,
    title: fromHandle.title,
    featuredImage: fromHandle.featuredImage ?? null,
    price: fromHandle.price
  } : livePrduct ?? (fallback ? {
    handle: fallback.handle,
    title: fallback.title,
    featuredImage: fallback.featuredImage ?? null,
    price: fallback.price
  } : null);
  if (!product) {
    return /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsx("div", { className: "container", children: /* @__PURE__ */ jsx("div", { className: "card card--padded card--bordered u-text-center", children: /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: "Select a product in the editor." }) }) }) });
  }
  const eyebrow = attributes.eyebrow;
  const body = attributes.body;
  return /* @__PURE__ */ jsx("section", { className: "section section--alt", children: /* @__PURE__ */ jsx("div", { className: "container", children: /* @__PURE__ */ jsxs("div", { className: "featured-product", children: [
    /* @__PURE__ */ jsx("div", { className: "featured-product__media", children: /* @__PURE__ */ jsx(
      ImageResponsive,
      {
        src: (_c = product.featuredImage) == null ? void 0 : _c.url,
        alt: ((_d = product.featuredImage) == null ? void 0 : _d.altText) ?? product.title
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "featured-product__body", children: [
      eyebrow && /* @__PURE__ */ jsx("span", { className: "eyebrow", children: eyebrow }),
      /* @__PURE__ */ jsx("h2", { className: "featured-product__title", children: product.title }),
      /* @__PURE__ */ jsx("span", { className: "featured-product__price", children: /* @__PURE__ */ jsx(Money, { value: product.price }) }),
      body && /* @__PURE__ */ jsx("p", { className: "u-text-muted", style: { maxWidth: "50ch" }, children: body }),
      /* @__PURE__ */ jsxs("div", { className: "cluster", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            label: attributes.buttonLabel ?? "Shop now",
            link: attributes.buttonLink ?? `/products/${product.handle}`,
            variant: "primary",
            size: "lg"
          }
        ),
        /* @__PURE__ */ jsx(Button, { label: "View details", link: `/products/${product.handle}`, variant: "ghost" })
      ] })
    ] })
  ] }) }) });
}
const FeaturedProduct_default = defineSection({
  name: "featured-product",
  title: "Featured product",
  category: "commerce",
  icon: "★",
  attributes: {
    eyebrow: { type: "text", label: "Eyebrow" },
    product: { type: "product", label: "Product" },
    body: { type: "textarea", label: "Description" },
    buttonLabel: { type: "text", default: "Shop now", label: "Button label" },
    buttonLink: { type: "url", label: "Button link (auto = product page)" }
  },
  component: FeaturedProduct
});
const __vite_glob_0_19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FeaturedProduct,
  default: FeaturedProduct_default
}, Symbol.toStringTag, { value: "Module" }));
function SiteHeader({ attributes } = {}) {
  var _a;
  const {
    enableMobileNavDrawer: enableMobileNavDrawer2,
    shopName: shopName2,
    navItems,
    showSwitchers,
    locales,
    showLocaleSwitch,
    activeLocale,
    countries,
    showCountrySwitch,
    activeCountry,
    enableSearchModal: enableSearchModal2,
    enableAccountDropdown: enableAccountDropdown2,
    settings: settings2,
    totalQuantity,
    enableCartDrawer: enableCartDrawer2,
    chromeStyle,
    brandLogo
  } = useChrome(attributes);
  return /* @__PURE__ */ jsx("header", { className: "site-header", style: chromeStyle, children: /* @__PURE__ */ jsxs("div", { className: "container site-header__inner", children: [
    enableMobileNavDrawer2 && /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: "site-header__hamburger",
        "aria-label": "Open menu",
        onClick: () => openOverlay("mobile-nav"),
        children: /* @__PURE__ */ jsx(Icon, { name: "menu" })
      }
    ),
    /* @__PURE__ */ jsx("a", { className: "site-header__brand", href: "/", children: brandLogo ? /* @__PURE__ */ jsx(
      "img",
      {
        className: "site-header__logo",
        src: brandLogo.url,
        alt: brandLogo.altText || shopName2
      }
    ) : shopName2 }),
    /* @__PURE__ */ jsx("nav", { className: "site-nav", "aria-label": "Primary", children: navItems.map((item) => /* @__PURE__ */ jsx("a", { href: item.url, children: item.title }, `${item.url}-${item.title}`)) }),
    /* @__PURE__ */ jsxs("div", { className: "site-header__actions", children: [
      showSwitchers && /* @__PURE__ */ jsx(
        LocaleSwitch,
        {
          locales: showLocaleSwitch ? locales : [],
          activeLocale,
          countries: showCountrySwitch ? countries : [],
          activeCountry: activeCountry ?? ((_a = countries[0]) == null ? void 0 : _a.code) ?? "",
          compact: true
        }
      ),
      enableSearchModal2 ? /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "site-header__icon",
          "aria-label": "Search",
          onClick: () => openOverlay("search"),
          children: /* @__PURE__ */ jsx(Icon, { name: "search" })
        }
      ) : /* @__PURE__ */ jsx("a", { href: "/search", className: "site-header__icon", "aria-label": "Search", children: /* @__PURE__ */ jsx(Icon, { name: "search" }) }),
      enableAccountDropdown2 ? /* @__PURE__ */ jsxs("div", { className: "site-header__account-wrap", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "site-header__icon",
            "aria-label": "Account",
            "aria-haspopup": "dialog",
            "data-overlay-trigger": "account",
            onClick: () => {
              var _a2;
              const isOpen = (_a2 = document.querySelector(".account-menu")) == null ? void 0 : _a2.classList.contains("account-menu--open");
              if (isOpen) closeOverlay();
              else openOverlay("account");
            },
            children: /* @__PURE__ */ jsx(Icon, { name: "user" })
          }
        ),
        /* @__PURE__ */ jsx(
          AccountMenu,
          {
            loggedIn: Boolean(settings2.accountLoggedIn),
            heading: settings2.accountHeading,
            subtext: settings2.accountSubtext,
            primaryLabel: settings2.accountPrimaryLabel,
            primaryHref: settings2.accountPrimaryHref,
            secondaryLabel: settings2.accountSecondaryLabel,
            secondaryHref: settings2.accountSecondaryHref,
            links: settings2.accountExtraLinks
          }
        )
      ] }) : /* @__PURE__ */ jsx("a", { href: "/account", className: "site-header__icon", "aria-label": "Account", children: /* @__PURE__ */ jsx(Icon, { name: "user" }) }),
      enableCartDrawer2 ? /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "site-header__icon site-header__cart",
          "aria-label": `Cart${totalQuantity > 0 ? ` (${totalQuantity})` : ""}`,
          onClick: () => openOverlay("cart"),
          children: [
            /* @__PURE__ */ jsx(Icon, { name: "bag" }),
            totalQuantity > 0 && /* @__PURE__ */ jsx("span", { className: "site-header__cart-count", children: totalQuantity })
          ]
        }
      ) : /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/cart",
          className: "site-header__icon site-header__cart",
          "aria-label": `Cart${totalQuantity > 0 ? ` (${totalQuantity})` : ""}`,
          children: [
            /* @__PURE__ */ jsx(Icon, { name: "bag" }),
            totalQuantity > 0 && /* @__PURE__ */ jsx("span", { className: "site-header__cart-count", children: totalQuantity })
          ]
        }
      )
    ] })
  ] }) });
}
function SiteFooter({
  attributes,
  children
} = {}) {
  var _a;
  const {
    shopName: shopName2,
    footerTagline: footerTagline2,
    footerColumns,
    showSwitchers,
    locales,
    showLocaleSwitch,
    activeLocale,
    countries,
    showCountrySwitch,
    activeCountry,
    year,
    t,
    chromeStyle,
    showPoweredBy: showPoweredBy2,
    poweredByLabel: poweredByLabel2
  } = useChrome(attributes);
  const hasBlocks = Children.count(children) > 0;
  return /* @__PURE__ */ jsx("footer", { className: "site-footer", style: chromeStyle, children: /* @__PURE__ */ jsxs("div", { className: "container", children: [
    /* @__PURE__ */ jsx("div", { className: "site-footer__grid", children: hasBlocks ? children : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "site-footer__brand", children: [
        /* @__PURE__ */ jsx("h2", { children: shopName2 }),
        footerTagline2 && /* @__PURE__ */ jsx("p", { style: { color: "rgba(255,255,255,0.7)", maxWidth: "36ch" }, children: footerTagline2 })
      ] }),
      footerColumns.map((col, i) => /* @__PURE__ */ jsxs("div", { className: "site-footer__col", children: [
        col.title && /* @__PURE__ */ jsx("h6", { children: col.title }),
        /* @__PURE__ */ jsx("ul", { children: col.links.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: item.url, children: item.title }) }, `${item.url}-${item.title}`)) })
      ] }, i))
    ] }) }),
    showSwitchers && /* @__PURE__ */ jsx("div", { className: "site-footer__market", children: /* @__PURE__ */ jsx(
      LocaleSwitch,
      {
        locales: showLocaleSwitch ? locales : [],
        activeLocale,
        countries: showCountrySwitch ? countries : [],
        activeCountry: activeCountry ?? ((_a = countries[0]) == null ? void 0 : _a.code) ?? ""
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "site-footer__bottom", children: [
      /* @__PURE__ */ jsxs("small", { children: [
        "© ",
        year,
        " ",
        shopName2,
        ". ",
        t("footer.rights")
      ] }),
      showPoweredBy2 && /* @__PURE__ */ jsx("small", { children: poweredByLabel2 })
    ] })
  ] }) });
}
function LocaleSwitch({
  locales,
  activeLocale,
  countries,
  activeCountry,
  compact
}) {
  const [locale2, setLocale] = usePersistedChoice("locale", LOCALE_KEY, activeLocale, true);
  const [country, setCountry] = usePersistedChoice("country", COUNTRY_KEY, activeCountry, true);
  const activeCountryRow = countries.find((c) => c.code === country) ?? countries[0];
  const t = useT();
  const label = { language: t("footer.language") || "Language", region: t("footer.region") || "Country / region" };
  if (compact) {
    return /* @__PURE__ */ jsxs("details", { className: "locale-switch locale-switch--compact", children: [
      /* @__PURE__ */ jsx("summary", { className: "site-header__icon", "aria-label": "Region and language", children: /* @__PURE__ */ jsx(Icon, { name: "globe" }) }),
      /* @__PURE__ */ jsxs("div", { className: "locale-switch__panel", role: "dialog", "aria-label": "Region and language", children: [
        locales.length > 0 && /* @__PURE__ */ jsxs("div", { className: "locale-switch__group", children: [
          /* @__PURE__ */ jsx("span", { className: "locale-switch__label", children: label.language }),
          /* @__PURE__ */ jsx(
            "select",
            {
              className: "locale-switch__select",
              value: locale2,
              onChange: (e) => setLocale(e.currentTarget.value),
              "aria-label": "Language",
              children: locales.map((l) => /* @__PURE__ */ jsx("option", { value: l.code, children: l.label }, l.code))
            }
          )
        ] }),
        countries.length > 0 && /* @__PURE__ */ jsxs("div", { className: "locale-switch__group", children: [
          /* @__PURE__ */ jsx("span", { className: "locale-switch__label", children: label.region }),
          /* @__PURE__ */ jsx(
            "select",
            {
              className: "locale-switch__select",
              value: country,
              onChange: (e) => setCountry(e.currentTarget.value),
              "aria-label": "Country / region",
              children: countries.map((c) => /* @__PURE__ */ jsxs("option", { value: c.code, children: [
                c.label,
                " · ",
                c.currency
              ] }, c.code))
            }
          )
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "locale-switch locale-switch--full", children: [
    countries.length > 0 && /* @__PURE__ */ jsxs("div", { className: "locale-switch__group", children: [
      /* @__PURE__ */ jsx("label", { className: "locale-switch__label", htmlFor: "market-country", children: label.region }),
      /* @__PURE__ */ jsx(
        "select",
        {
          id: "market-country",
          className: "locale-switch__select",
          value: country,
          onChange: (e) => setCountry(e.currentTarget.value),
          children: countries.map((c) => /* @__PURE__ */ jsxs("option", { value: c.code, children: [
            c.label,
            " (",
            c.currency,
            ")"
          ] }, c.code))
        }
      )
    ] }),
    locales.length > 0 && /* @__PURE__ */ jsxs("div", { className: "locale-switch__group", children: [
      /* @__PURE__ */ jsx("label", { className: "locale-switch__label", htmlFor: "market-locale", children: label.language }),
      /* @__PURE__ */ jsx(
        "select",
        {
          id: "market-locale",
          className: "locale-switch__select",
          value: locale2,
          onChange: (e) => setLocale(e.currentTarget.value),
          children: locales.map((l) => /* @__PURE__ */ jsx("option", { value: l.code, children: l.label }, l.code))
        }
      )
    ] }),
    activeCountryRow && /* @__PURE__ */ jsxs("p", { className: "locale-switch__hint", children: [
      t("footer.shippingTo") || "Shipping to",
      " ",
      /* @__PURE__ */ jsx("strong", { children: activeCountryRow.label }),
      ".",
      " ",
      t("footer.pricesIn") || "Prices in",
      " ",
      /* @__PURE__ */ jsx("strong", { children: activeCountryRow.currency }),
      "."
    ] })
  ] });
}
function Icon({ name }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
  };
  if (name === "search") {
    return /* @__PURE__ */ jsxs("svg", { ...props, children: [
      /* @__PURE__ */ jsx("circle", { cx: "11", cy: "11", r: "7" }),
      /* @__PURE__ */ jsx("path", { d: "m20 20-3.5-3.5" })
    ] });
  }
  if (name === "user") {
    return /* @__PURE__ */ jsxs("svg", { ...props, children: [
      /* @__PURE__ */ jsx("circle", { cx: "12", cy: "8", r: "4" }),
      /* @__PURE__ */ jsx("path", { d: "M4 21c0-4.5 3.5-8 8-8s8 3.5 8 8" })
    ] });
  }
  if (name === "globe") {
    return /* @__PURE__ */ jsxs("svg", { ...props, children: [
      /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ jsx("path", { d: "M3 12h18" }),
      /* @__PURE__ */ jsx("path", { d: "M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" })
    ] });
  }
  if (name === "menu") {
    return /* @__PURE__ */ jsx("svg", { ...props, children: /* @__PURE__ */ jsx("path", { d: "M4 7h16M4 12h16M4 17h16" }) });
  }
  return /* @__PURE__ */ jsxs("svg", { ...props, children: [
    /* @__PURE__ */ jsx("path", { d: "M6 7h12l-1 13H7L6 7Z" }),
    /* @__PURE__ */ jsx("path", { d: "M9 7V5a3 3 0 0 1 6 0v2" })
  ] });
}
function Footer({ attributes, children }) {
  return /* @__PURE__ */ jsx(SiteFooter, { attributes, children });
}
const Footer_default = defineSection({
  name: "footer",
  title: "Footer",
  category: "layout",
  icon: "▬",
  attributes: {
    showLocale: { type: "boolean", default: true, label: "Show language / region" },
    showPoweredBy: { type: "boolean", default: true, label: "Show footer credit" },
    poweredByLabel: { type: "text", default: "Made with Tanqory", label: "Footer credit text" },
    bg: { type: "color", label: "Background" },
    fg: { type: "color", label: "Text color" }
  },
  allowedBlocks: ["footer-brand", "footer-menu", "footer-text", "social-links", "newsletter", "payment-icons"],
  presets: [
    {
      blocks: [
        { type: "footer-brand", settings: { title: "Your store", tagline: "A short line about your brand." } },
        { type: "footer-menu", settings: { heading: "Shop" } },
        { type: "footer-menu", settings: { heading: "Help" } },
        { type: "footer-menu", settings: { heading: "Company" } }
      ]
    }
  ],
  component: Footer
});
const __vite_glob_0_20 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Footer,
  default: Footer_default
}, Symbol.toStringTag, { value: "Module" }));
function FooterBrand({ attributes }) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const data = useData();
  const settings2 = useSettings();
  const boundTitle = useBoundText(attributes.title);
  const boundTagline = useBoundText(attributes.tagline);
  const name = (boundTitle || settings2.shopName || "").trim() || ((_b = (_a = data.shop) == null ? void 0 : _a.name) == null ? void 0 : _b.trim()) || "Your store";
  const tagline = boundTagline || ((_d = (_c = data.shop) == null ? void 0 : _c.brand) == null ? void 0 : _d.slogan) || ((_e = data.shop) == null ? void 0 : _e.description) || "";
  const email = (_g = (_f = data.shop) == null ? void 0 : _f.email) == null ? void 0 : _g.trim();
  const phone = (_i = (_h = data.shop) == null ? void 0 : _h.phone) == null ? void 0 : _i.trim();
  return /* @__PURE__ */ jsxs("div", { className: "site-footer__brand", children: [
    /* @__PURE__ */ jsx("h2", { children: name }),
    tagline && /* @__PURE__ */ jsx("p", { style: { color: "rgba(255,255,255,0.7)", maxWidth: "36ch" }, children: tagline }),
    (email || phone) && /* @__PURE__ */ jsxs("p", { className: "site-footer__contact", style: { color: "rgba(255,255,255,0.7)" }, children: [
      email && /* @__PURE__ */ jsx("a", { href: `mailto:${email}`, style: { color: "inherit" }, children: email }),
      email && phone && /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: " · " }),
      phone && /* @__PURE__ */ jsx("a", { href: `tel:${phone}`, style: { color: "inherit" }, children: phone })
    ] })
  ] });
}
const FooterBrand_default = defineSection({
  name: "footer-brand",
  title: "Brand information",
  category: "block",
  icon: "◈",
  attributes: {
    title: { type: "text", label: "Brand name (blank = store name)", dynamic: true },
    tagline: { type: "textarea", label: "Tagline (blank = store description)", dynamic: true }
  },
  component: FooterBrand
});
const __vite_glob_0_21 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FooterBrand,
  default: FooterBrand_default
}, Symbol.toStringTag, { value: "Module" }));
function FooterMenu({ attributes }) {
  const handle = attributes.menu || "";
  const menu = useMenu(handle);
  const heading = attributes.heading || (menu == null ? void 0 : menu.title) || "";
  const links = ((menu == null ? void 0 : menu.items) ?? []).filter((it) => Boolean(it.url));
  return /* @__PURE__ */ jsxs("div", { className: "site-footer__col", children: [
    heading && /* @__PURE__ */ jsx("h6", { children: heading }),
    /* @__PURE__ */ jsx("ul", { children: links.map((it) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: it.url, children: it.title }) }, `${it.url}-${it.title}`)) })
  ] });
}
const FooterMenu_default = defineSection({
  name: "footer-menu",
  title: "Menu",
  category: "block",
  icon: "chat",
  attributes: {
    // `menu` = pick a real store menu (Dashboard → Navigation); value is the
    // menu handle. The editor renders a dropdown populated from the storefront
    // `menus` query.
    //
    // This was `link_list`, which is NOT one of the 20 AttrSpec types — the
    // editor's server-side gate silently coerced it to `text`, so the merchant
    // got a free-text box and had to type a handle from memory. `menu` is the
    // declared type for exactly this (see AttrSpec in @tanqory/theme-kit), and
    // it is what config/settings.schema.ts already uses for the header/footer
    // menu settings.
    menu: { type: "menu", label: "Menu" },
    heading: { type: "text", label: "Heading (blank = menu name)" }
  },
  component: FooterMenu
});
const __vite_glob_0_22 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FooterMenu,
  default: FooterMenu_default
}, Symbol.toStringTag, { value: "Module" }));
function FooterText({ attributes }) {
  const heading = useBoundText(attributes.heading);
  const body = useBoundText(attributes.body);
  return /* @__PURE__ */ jsxs("div", { className: "site-footer__col", children: [
    heading && /* @__PURE__ */ jsx("h6", { children: heading }),
    body && /* @__PURE__ */ jsx("p", { style: { color: "rgba(255,255,255,0.7)", maxWidth: "36ch" }, children: body })
  ] });
}
const FooterText_default = defineSection({
  name: "footer-text",
  title: "Text",
  category: "block",
  icon: "¶",
  attributes: {
    heading: { type: "text", label: "Heading", dynamic: true },
    body: { type: "textarea", label: "Text", dynamic: true }
  },
  component: FooterText
});
const __vite_glob_0_23 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FooterText,
  default: FooterText_default
}, Symbol.toStringTag, { value: "Module" }));
function Group({ attributes, children }) {
  return /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsx("div", { className: "container", style: { display: "grid", gap: `${attributes.gap ?? 16}px` }, children }) });
}
const Group_default = defineSection({
  name: "group",
  title: "Group",
  category: "layout",
  icon: "▤",
  attributes: {
    gap: { type: "number", default: 16, label: "Gap (px)" }
  },
  allowedBlocks: [
    // Generic content blocks (standard) — compose a custom layout.
    "text",
    "heading",
    "button",
    "image",
    "icon",
    "spacer",
    "video",
    "accordion",
    "jumbo-text",
    "social-links",
    "payment-icons",
    // Whole sections can also nest inside a group.
    "cart-items",
    "collection-list",
    "contact-form",
    "faq",
    "featured-collection",
    "featured-product",
    "group",
    "hero",
    "image-with-text",
    "logo-list",
    "multicolumn",
    "newsletter",
    "not-found",
    "product-details",
    "product-grid",
    "rich-text",
    "search-results",
    "slideshow"
  ],
  presets: [
    {
      blocks: [
        { type: "heading", settings: {} },
        { type: "text", settings: {} }
      ]
    }
  ],
  component: Group
});
const __vite_glob_0_24 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Group,
  default: Group_default
}, Symbol.toStringTag, { value: "Module" }));
function Header({ attributes }) {
  return /* @__PURE__ */ jsx(SiteHeader, { attributes });
}
const Header_default = defineSection({
  name: "header",
  title: "Header",
  category: "layout",
  icon: "▭",
  attributes: {
    menu: {
      type: "select",
      default: "main-menu",
      label: "Navigation menu",
      options: [
        { value: "main-menu", label: "Main menu" },
        { value: "footer", label: "Footer" },
        { value: "footer-shop", label: "Footer · Shop" },
        { value: "footer-help", label: "Footer · Help" },
        { value: "footer-company", label: "Footer · Company" }
      ]
    },
    logo: { type: "text", label: "Logo text (blank = shop name)" },
    showSearch: { type: "boolean", default: true, label: "Show search" },
    showCart: { type: "boolean", default: true, label: "Show cart" },
    showAccount: { type: "boolean", default: true, label: "Show account" },
    showLocale: { type: "boolean", default: true, label: "Show language / region" },
    bg: { type: "color", label: "Background" },
    fg: { type: "color", label: "Text color" }
  },
  component: Header
});
const __vite_glob_0_25 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Header,
  default: Header_default
}, Symbol.toStringTag, { value: "Module" }));
function HeadingBlock({ attributes }) {
  const text = attributes.text;
  if (!text) return /* @__PURE__ */ jsx(Fragment, {});
  const Tag = ["h1", "h2", "h3", "h4"].includes(attributes.level) ? attributes.level : "h2";
  return /* @__PURE__ */ jsx(Tag, { className: "block-heading", style: { textAlign: attributes.align || "left" }, children: text });
}
const HeadingBlock_default = defineSection({
  name: "heading",
  title: "Heading",
  category: "block",
  icon: "H",
  attributes: {
    text: { type: "text", default: "Heading", label: "Text" },
    level: {
      type: "select",
      default: "h2",
      label: "Level",
      options: [
        { value: "h1", label: "H1" },
        { value: "h2", label: "H2" },
        { value: "h3", label: "H3" },
        { value: "h4", label: "H4" }
      ]
    },
    align: {
      type: "select",
      default: "left",
      label: "Alignment",
      options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
        { value: "right", label: "Right" }
      ]
    }
  },
  component: HeadingBlock
});
const __vite_glob_0_26 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  HeadingBlock,
  default: HeadingBlock_default
}, Symbol.toStringTag, { value: "Module" }));
function Hero({ attributes }) {
  const {
    eyebrow,
    heading,
    subtext,
    buttonLabel,
    buttonLink,
    secondaryLabel,
    secondaryLink,
    backgroundImage
  } = attributes;
  const isMedia = Boolean(backgroundImage);
  return /* @__PURE__ */ jsxs("section", { className: `hero ${isMedia ? "hero--media" : ""}`, children: [
    isMedia && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "hero__bg", style: { backgroundImage: `url(${backgroundImage})` } }),
      /* @__PURE__ */ jsx("div", { className: "hero__bg-overlay" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "hero__inner", children: [
      eyebrow && /* @__PURE__ */ jsx("span", { className: "hero__eyebrow", children: eyebrow }),
      /* @__PURE__ */ jsx("h1", { className: "hero__heading", children: heading || "Modern essentials" }),
      subtext && /* @__PURE__ */ jsx("p", { className: "hero__subtext", children: subtext }),
      (buttonLabel || secondaryLabel) && /* @__PURE__ */ jsxs("div", { className: "hero__actions", children: [
        buttonLabel && /* @__PURE__ */ jsx(
          Button,
          {
            label: buttonLabel,
            link: buttonLink,
            variant: isMedia ? "inverse" : "primary",
            size: "lg"
          }
        ),
        secondaryLabel && /* @__PURE__ */ jsx(Button, { label: secondaryLabel, link: secondaryLink, variant: "ghost", size: "lg" })
      ] })
    ] })
  ] });
}
const Hero_default = defineSection({
  name: "hero",
  title: "Hero",
  category: "layout",
  icon: "✦",
  attributes: {
    eyebrow: { type: "text", label: "Eyebrow" },
    heading: { type: "text", default: "Modern essentials", label: "Heading" },
    subtext: {
      type: "textarea",
      label: "Subtext",
      default: "Designed for everyday rituals — built to last beyond the season."
    },
    buttonLabel: { type: "text", default: "Shop the collection", label: "Primary button" },
    buttonLink: { type: "url", default: "/collections/all", label: "Primary button link" },
    secondaryLabel: { type: "text", label: "Secondary button" },
    secondaryLink: { type: "url", label: "Secondary button link" },
    backgroundImage: { type: "image", label: "Background image" }
  },
  component: Hero
});
const __vite_glob_0_27 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Hero,
  default: Hero_default
}, Symbol.toStringTag, { value: "Module" }));
function IconBlock({ attributes }) {
  return /* @__PURE__ */ jsx("div", { className: "block-icon", style: { textAlign: attributes.align || "left" }, children: /* @__PURE__ */ jsx(Icon$1, { name: attributes.icon || "star", size: attributes.size ?? 32 }) });
}
const IconBlock_default = defineSection({
  name: "icon",
  title: "Icon",
  category: "block",
  icon: "✶",
  attributes: {
    icon: {
      type: "select",
      default: "star",
      label: "Icon",
      options: [
        { value: "truck", label: "Truck" },
        { value: "return", label: "Return" },
        { value: "chat", label: "Chat" },
        { value: "shield", label: "Shield" },
        { value: "star", label: "Star" },
        { value: "gift", label: "Gift" },
        { value: "leaf", label: "Leaf" },
        { value: "clock", label: "Clock" }
      ]
    },
    size: { type: "range", default: 32, min: 16, max: 80, step: 4, label: "Size (px)" },
    align: {
      type: "select",
      default: "left",
      label: "Alignment",
      options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
        { value: "right", label: "Right" }
      ]
    }
  },
  component: IconBlock
});
const __vite_glob_0_28 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  IconBlock,
  default: IconBlock_default
}, Symbol.toStringTag, { value: "Module" }));
function ImageBlock({ attributes }) {
  const src = attributes.image;
  if (!src) return /* @__PURE__ */ jsx(Fragment, {});
  const img = /* @__PURE__ */ jsx(
    "img",
    {
      className: "block-image",
      src,
      alt: attributes.alt ?? "",
      loading: "lazy",
      decoding: "async",
      style: { borderRadius: attributes.rounded ? "var(--radius-md, 10px)" : void 0 }
    }
  );
  const link = attributes.link;
  return /* @__PURE__ */ jsx("div", { className: "block-image-wrap", children: link ? /* @__PURE__ */ jsx("a", { href: link, children: img }) : img });
}
const ImageBlock_default = defineSection({
  name: "image",
  title: "Image",
  category: "block",
  icon: "▥",
  attributes: {
    image: { type: "image", label: "Image" },
    alt: { type: "text", label: "Alt text" },
    link: { type: "url", label: "Link" },
    rounded: { type: "boolean", default: true, label: "Rounded corners" }
  },
  component: ImageBlock
});
const __vite_glob_0_29 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ImageBlock,
  default: ImageBlock_default
}, Symbol.toStringTag, { value: "Module" }));
function ImageWithText({ attributes }) {
  const reverse = Boolean(attributes.imageRight);
  const image = attributes.image;
  const imageAlt = attributes.imageAlt;
  const eyebrow = attributes.eyebrow;
  const heading = attributes.heading ?? "A story worth telling";
  const body = attributes.body;
  const buttonLabel = attributes.buttonLabel;
  const buttonLink = attributes.buttonLink;
  return /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsx("div", { className: "container", children: /* @__PURE__ */ jsxs("div", { className: `iwt ${reverse ? "iwt--reverse" : ""}`, children: [
    /* @__PURE__ */ jsx("div", { className: "iwt__media", children: /* @__PURE__ */ jsx(ImageResponsive, { src: image, alt: imageAlt ?? heading }) }),
    /* @__PURE__ */ jsxs("div", { className: "iwt__body", children: [
      eyebrow && /* @__PURE__ */ jsx("span", { className: "eyebrow", children: eyebrow }),
      /* @__PURE__ */ jsx("h2", { children: heading }),
      body && /* @__PURE__ */ jsx("p", { children: body }),
      buttonLabel && /* @__PURE__ */ jsx("div", { className: "cluster", children: /* @__PURE__ */ jsx(Button, { label: buttonLabel, link: buttonLink, variant: "secondary" }) })
    ] })
  ] }) }) });
}
const ImageWithText_default = defineSection({
  name: "image-with-text",
  title: "Image with text",
  category: "content",
  icon: "◧",
  attributes: {
    image: {
      type: "image",
      label: "Image",
      default: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%271400%27%20height%3D%271000%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%271%27%20y2%3D%271%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%23374a40%27/%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%235e7d6a%27/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20fill%3D%27url%28%23g%29%27/%3E%3C/svg%3E"
    },
    imageAlt: { type: "text", label: "Image alt text" },
    imageRight: { type: "boolean", default: false, label: "Image on right" },
    eyebrow: { type: "text", label: "Eyebrow" },
    heading: { type: "text", default: "A story worth telling", label: "Heading" },
    body: {
      type: "textarea",
      label: "Body",
      default: "Crafted in small batches with materials that age well. Every piece earns its place in your routine."
    },
    buttonLabel: { type: "text", label: "Button label" },
    buttonLink: { type: "url", label: "Button link" }
  },
  component: ImageWithText
});
const __vite_glob_0_30 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ImageWithText,
  default: ImageWithText_default
}, Symbol.toStringTag, { value: "Module" }));
function JumboText({ attributes }) {
  const text = attributes.text;
  if (!text) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsx("p", { className: "block-jumbo", style: { textAlign: attributes.align || "center" }, children: text });
}
const JumboText_default = defineSection({
  name: "jumbo-text",
  title: "Jumbo text",
  category: "block",
  icon: "A",
  attributes: {
    text: { type: "text", default: "Made to last.", label: "Text" },
    align: {
      type: "select",
      default: "center",
      label: "Alignment",
      options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
        { value: "right", label: "Right" }
      ]
    }
  },
  component: JumboText
});
const __vite_glob_0_31 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  JumboText,
  default: JumboText_default
}, Symbol.toStringTag, { value: "Module" }));
function LogoItem({ attributes }) {
  const src = attributes.src;
  const alt = attributes.alt ?? "";
  const href = attributes.href;
  const inner = src ? /* @__PURE__ */ jsx("img", { src, alt, loading: "lazy", decoding: "async" }) : /* @__PURE__ */ jsx("span", { children: alt || "Logo" });
  return href ? /* @__PURE__ */ jsx("a", { href, className: "logo-list__item", children: inner }) : /* @__PURE__ */ jsx("div", { className: "logo-list__item", children: inner });
}
const LogoItem_default = defineSection({
  name: "logo",
  title: "Logo",
  category: "block",
  icon: "◍",
  attributes: {
    src: { type: "image", label: "Image" },
    alt: { type: "text", label: "Brand name (alt text)" },
    href: { type: "url", label: "Link (optional)" }
  },
  component: LogoItem
});
const __vite_glob_0_32 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  LogoItem,
  default: LogoItem_default
}, Symbol.toStringTag, { value: "Module" }));
function parseLogos(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      return JSON.parse(raw);
    } catch {
    }
  }
  return [];
}
function LogoList({ attributes, children }) {
  const logos = parseLogos(attributes.logos);
  const heading = attributes.heading;
  const hasBlocks = Children.count(children) > 0;
  return /* @__PURE__ */ jsx("section", { className: "section section--tight", children: /* @__PURE__ */ jsxs("div", { className: "container", children: [
    heading && /* @__PURE__ */ jsx("div", { className: "logo-list__head", children: /* @__PURE__ */ jsx("span", { className: "eyebrow", children: heading }) }),
    hasBlocks ? /* @__PURE__ */ jsx("div", { className: "logo-list__grid", children }) : logos.length === 0 ? /* @__PURE__ */ jsx("div", { className: "card card--padded card--bordered u-text-center", children: /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: "Add brand logos in the editor." }) }) : /* @__PURE__ */ jsx("div", { className: "logo-list__grid", children: logos.map((logo, i) => {
      const inner = logo.src ? /* @__PURE__ */ jsx("img", { src: logo.src, alt: logo.alt ?? "", loading: "lazy", decoding: "async" }) : /* @__PURE__ */ jsx("span", { children: logo.alt });
      return logo.href ? /* @__PURE__ */ jsx("a", { href: logo.href, className: "logo-list__item", children: inner }, i) : /* @__PURE__ */ jsx("div", { className: "logo-list__item", children: inner }, i);
    }) })
  ] }) });
}
const LogoList_default = defineSection({
  name: "logo-list",
  title: "Logo list",
  category: "social-proof",
  icon: "◍",
  attributes: {
    heading: { type: "text", default: "As seen in", label: "Heading" }
  },
  allowedBlocks: ["logo"],
  presets: [
    {
      blocks: [
        { type: "logo", settings: { alt: "Brand 1" } },
        { type: "logo", settings: { alt: "Brand 2" } },
        { type: "logo", settings: { alt: "Brand 3" } },
        { type: "logo", settings: { alt: "Brand 4" } }
      ]
    }
  ],
  component: LogoList
});
const __vite_glob_0_33 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  LogoList,
  default: LogoList_default
}, Symbol.toStringTag, { value: "Module" }));
function Marquee({ attributes }) {
  const text = attributes.text || "";
  const speed = attributes.speed ?? 24;
  if (!text) return /* @__PURE__ */ jsx(Fragment, {});
  const half = Array.from({ length: 6 }, (_, i) => /* @__PURE__ */ jsx("span", { className: "marquee__item", children: text }, i));
  return /* @__PURE__ */ jsx("div", { className: "marquee", style: { background: attributes.bg, color: attributes.fg }, children: /* @__PURE__ */ jsxs("div", { className: "marquee__track", style: { animationDuration: `${speed}s` }, children: [
    /* @__PURE__ */ jsx("div", { className: "marquee__half", children: half }),
    /* @__PURE__ */ jsx("div", { className: "marquee__half", "aria-hidden": true, children: half })
  ] }) });
}
const Marquee_default = defineSection({
  name: "marquee",
  title: "Marquee",
  category: "content",
  icon: "↔",
  attributes: {
    text: { type: "text", default: "New season just dropped", label: "Text" },
    speed: { type: "range", default: 24, min: 8, max: 60, step: 2, label: "Scroll duration (s)" },
    bg: { type: "color", default: "#0a0a0a", label: "Background" },
    fg: { type: "color", default: "#ffffff", label: "Text color" }
  },
  component: Marquee
});
const __vite_glob_0_34 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Marquee,
  default: Marquee_default
}, Symbol.toStringTag, { value: "Module" }));
function parseItems(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      return JSON.parse(raw);
    } catch {
    }
  }
  return [];
}
const DEFAULT_ITEMS = [
  { icon: "truck", heading: "Free shipping", body: "On orders over $50." },
  { icon: "return", heading: "Easy returns", body: "30 days, no questions asked." },
  { icon: "chat", heading: "Real support", body: "Chat with us 24/7." },
  { icon: "shield", heading: "Made to last", body: "Built with materials that age well." }
];
function Multicolumn({ attributes, children }) {
  const items = parseItems(attributes.items);
  const list = items.length > 0 ? items : DEFAULT_ITEMS;
  const hasBlocks = Children.count(children) > 0;
  const eyebrow = attributes.eyebrow;
  const heading = attributes.heading;
  const subheading = attributes.subheading;
  return /* @__PURE__ */ jsx("section", { className: "section section--alt", children: /* @__PURE__ */ jsxs("div", { className: "container", children: [
    (heading || subheading) && /* @__PURE__ */ jsxs("div", { className: "multicolumn__head", children: [
      eyebrow && /* @__PURE__ */ jsx("span", { className: "eyebrow", children: eyebrow }),
      heading && /* @__PURE__ */ jsx("h2", { children: heading }),
      subheading && /* @__PURE__ */ jsx("p", { className: "lede", children: subheading })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "multicolumn__grid", children: hasBlocks ? children : list.map((item, i) => /* @__PURE__ */ jsxs("div", { className: "multicolumn__item", children: [
      item.icon && /* @__PURE__ */ jsx("div", { className: "multicolumn__icon", children: /* @__PURE__ */ jsx(Icon$1, { name: item.icon }) }),
      item.heading && /* @__PURE__ */ jsx("h3", { children: item.heading }),
      item.body && /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: item.body })
    ] }, i)) })
  ] }) });
}
const Multicolumn_default = defineSection({
  name: "multicolumn",
  title: "Multicolumn",
  category: "content",
  icon: "⫴",
  attributes: {
    eyebrow: { type: "text", label: "Eyebrow" },
    heading: { type: "text", default: "Why shop with us", label: "Heading" },
    subheading: { type: "text", label: "Subheading" }
  },
  allowedBlocks: ["column"],
  presets: [
    {
      blocks: [
        { type: "column", settings: { icon: "truck", heading: "Free shipping", body: "On orders over $50." } },
        { type: "column", settings: { icon: "return", heading: "Easy returns", body: "30 days, no questions asked." } },
        { type: "column", settings: { icon: "chat", heading: "Real support", body: "Chat with us 24/7." } }
      ]
    }
  ],
  component: Multicolumn
});
const __vite_glob_0_35 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Multicolumn,
  default: Multicolumn_default
}, Symbol.toStringTag, { value: "Module" }));
function Newsletter({ attributes }) {
  const eyebrow = attributes.eyebrow;
  const heading = attributes.heading ?? "Join the newsletter";
  const body = attributes.body;
  const placeholder = attributes.placeholder ?? "you@example.com";
  const buttonLabel = attributes.buttonLabel ?? "Subscribe";
  const note = attributes.note;
  const action = attributes.action;
  const inverse = Boolean(attributes.inverse);
  return /* @__PURE__ */ jsx("section", { className: `section ${inverse ? "section--inverse" : "section--alt"}`, children: /* @__PURE__ */ jsx("div", { className: "container", children: /* @__PURE__ */ jsxs("div", { className: "newsletter", children: [
    eyebrow && /* @__PURE__ */ jsx("span", { className: "eyebrow", children: eyebrow }),
    /* @__PURE__ */ jsx("h2", { children: heading }),
    body && /* @__PURE__ */ jsx("p", { className: "lede", children: body }),
    /* @__PURE__ */ jsxs("form", { className: "newsletter__form", action: action ?? "/_api/newsletter", method: "post", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "field__input",
          type: "email",
          name: "email",
          placeholder,
          required: true,
          autoComplete: "email",
          "aria-label": "Email address"
        }
      ),
      /* @__PURE__ */ jsx("button", { className: `btn ${inverse ? "btn--inverse" : "btn--primary"}`, type: "submit", children: buttonLabel })
    ] }),
    note && /* @__PURE__ */ jsx("small", { className: "newsletter__note", children: note })
  ] }) }) });
}
const Newsletter_default = defineSection({
  name: "newsletter",
  title: "Newsletter",
  category: "marketing",
  icon: "✉",
  attributes: {
    eyebrow: { type: "text", label: "Eyebrow" },
    heading: { type: "text", default: "Join the newsletter", label: "Heading" },
    body: {
      type: "textarea",
      default: "Be the first to hear about new arrivals and member-only sales — and get 10% off your first order.",
      label: "Body"
    },
    placeholder: { type: "text", default: "you@example.com", label: "Placeholder" },
    buttonLabel: { type: "text", default: "Subscribe", label: "Button label" },
    note: { type: "text", default: "No spam. Unsubscribe anytime.", label: "Footnote" },
    action: { type: "url", label: "Form action URL" },
    inverse: { type: "boolean", default: false, label: "Dark background" }
  },
  component: Newsletter
});
const __vite_glob_0_36 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Newsletter,
  default: Newsletter_default
}, Symbol.toStringTag, { value: "Module" }));
function NotFound({ attributes }) {
  const heading = attributes.heading ?? "Page not found";
  const body = attributes.body ?? "The page you're looking for doesn't exist or may have moved.";
  const buttonLabel = attributes.buttonLabel ?? "Back to home";
  const buttonLink = attributes.buttonLink ?? "/";
  return /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsx("div", { className: "container", children: /* @__PURE__ */ jsxs("div", { className: "not-found", children: [
    /* @__PURE__ */ jsx("div", { className: "not-found__code", "aria-hidden": true, children: "404" }),
    /* @__PURE__ */ jsx("h1", { children: heading }),
    /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: body }),
    /* @__PURE__ */ jsxs("div", { className: "cluster", children: [
      /* @__PURE__ */ jsx(Button, { label: buttonLabel, link: buttonLink, variant: "primary", size: "lg" }),
      /* @__PURE__ */ jsx(Button, { label: "Browse the shop", link: "/collections/all", variant: "ghost", size: "lg" })
    ] })
  ] }) }) });
}
const NotFound_default = defineSection({
  name: "not-found",
  title: "404",
  category: "system",
  icon: "⚠",
  attributes: {
    heading: { type: "text", default: "Page not found", label: "Heading" },
    body: {
      type: "textarea",
      default: "The page you're looking for doesn't exist or may have moved.",
      label: "Body"
    },
    buttonLabel: { type: "text", default: "Back to home", label: "Button label" },
    buttonLink: { type: "url", default: "/", label: "Button link" }
  },
  component: NotFound
});
const __vite_glob_0_37 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NotFound,
  default: NotFound_default
}, Symbol.toStringTag, { value: "Module" }));
const __vite_import_meta_env__ = {};
function PageBody({ attributes }) {
  var _a;
  const { fallbackTitle, fallbackBody } = attributes;
  const handle = typeof window !== "undefined" ? decodeHandle((_a = window.location.pathname.match(/^\/pages\/([^/]+)\/?$/)) == null ? void 0 : _a[1]) : void 0;
  const [page, setPage] = useState(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!handle) {
      setLoaded(true);
      return;
    }
    const env = __vite_import_meta_env__;
    if (!env.VITE_TANQORY_BACKEND || !env.VITE_TANQORY_STORE_ID) {
      setLoaded(true);
      return;
    }
    const url = `${apiBase(env.VITE_TANQORY_BACKEND)}/api/v1/stores/${encodeURIComponent(
      env.VITE_TANQORY_STORE_ID
    )}/graphql`;
    const country = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("country") || (() => {
      try {
        return window.localStorage.getItem("tq-country");
      } catch {
        return null;
      }
    })() : null;
    let cancelled = false;
    fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...env.VITE_TANQORY_STOREFRONT_TOKEN ? { "x-publishable-key": env.VITE_TANQORY_STOREFRONT_TOKEN } : {},
        ...country && /^[A-Za-z]{2}$/.test(country) ? { "x-tanqory-country": country.toUpperCase() } : {}
      },
      body: JSON.stringify({
        query: "query P($h: String) { page(handle: $h) { title body } }",
        variables: { h: handle }
      })
    }).then((r) => r.json()).then((j) => {
      var _a2;
      if (cancelled) return;
      const p = (_a2 = j.data) == null ? void 0 : _a2.page;
      setPage(p ? { title: p.title, body: p.body } : null);
      setLoaded(true);
    }).catch(() => {
      if (!cancelled) setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [handle]);
  const title = (page == null ? void 0 : page.title) ?? (loaded ? fallbackTitle ?? "" : "");
  const body = (page == null ? void 0 : page.body) ?? (loaded ? fallbackBody ?? "" : "");
  return /* @__PURE__ */ jsx("section", { className: "page-body", children: /* @__PURE__ */ jsxs(Container, { className: "page-body__inner", children: [
    title && /* @__PURE__ */ jsx("h1", { className: "page-body__title", children: title }),
    body && /* @__PURE__ */ jsx(
      "div",
      {
        className: "page-body__content rich-text",
        dangerouslySetInnerHTML: { __html: body }
      }
    )
  ] }) });
}
const PageBody_default = defineSection({
  name: "page-body",
  title: "Page content",
  category: "content",
  icon: "¶",
  attributes: {
    fallbackTitle: {
      type: "text",
      label: "Fallback title",
      default: "Page"
    },
    fallbackBody: {
      type: "textarea",
      label: "Fallback body (HTML)",
      default: ""
    }
  },
  component: PageBody
});
const __vite_glob_0_38 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  PageBody,
  default: PageBody_default
}, Symbol.toStringTag, { value: "Module" }));
const LABELS = {
  VISA: "Visa",
  MASTERCARD: "Mastercard",
  AMERICAN_EXPRESS: "Amex",
  DISCOVER: "Discover",
  DINERS_CLUB: "Diners",
  JCB: "JCB",
  ELO: "Elo",
  PAYPAL: "PayPal",
  APPLE_PAY: "Apple Pay",
  GOOGLE_PAY: "Google Pay",
  ANDROID_PAY: "Google Pay"
};
function PaymentIcons({ attributes }) {
  var _a;
  const data = useData();
  const override = (attributes.methods || "").trim();
  let list;
  if (override) {
    list = override.split(",").map((s) => s.trim()).filter(Boolean);
  } else {
    const pay = (_a = data.shop) == null ? void 0 : _a.paymentSettings;
    const codes = [...(pay == null ? void 0 : pay.acceptedCardBrands) ?? [], ...(pay == null ? void 0 : pay.supportedDigitalWallets) ?? []];
    list = [...new Set(codes.map((c) => LABELS[c] ?? c))];
  }
  if (list.length === 0) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsx("div", { className: "payment-icons", "aria-label": "Accepted payment methods", children: list.map((m) => /* @__PURE__ */ jsx("span", { className: "payment-icon", children: m }, m)) });
}
const PaymentIcons_default = defineSection({
  name: "payment-icons",
  title: "Payment icons",
  category: "block",
  icon: "▭",
  attributes: {
    methods: {
      type: "text",
      label: "Methods (comma-separated — blank = what the store accepts)"
    }
  },
  component: PaymentIcons
});
const __vite_glob_0_39 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  PaymentIcons,
  default: PaymentIcons_default
}, Symbol.toStringTag, { value: "Module" }));
const POLICY_BODIES = (
  /* GraphQL */
  `query PolicyBodies {
  shop {
    privacyPolicy { handle title body }
    refundPolicy { handle title body }
    termsOfService { handle title body }
    shippingPolicy { handle title body }
    contactInformation { handle title body }
    legalNotice { handle title body }
    subscriptionPolicy { handle title body }
  }
}`
);
function PolicyPage({ attributes }) {
  var _a, _b;
  const data = useData();
  const handleFromUrl = typeof window !== "undefined" ? decodeHandle((_a = window.location.pathname.match(/\/policies\/([^/]+)/)) == null ? void 0 : _a[1]) : void 0;
  const handle = attributes.policy || handleFromUrl || "";
  const boot = ((_b = data.shop) == null ? void 0 : _b.policies) ?? {};
  const bootMatch = Object.values(boot).find((p) => p && p.handle === handle) ?? null;
  const [policy, setPolicy] = useState(bootMatch);
  useEffect(() => {
    if (bootMatch == null ? void 0 : bootMatch.body) return;
    let alive = true;
    void (async () => {
      var _a2;
      const res = await ((_a2 = data.graphql) == null ? void 0 : _a2.call(data, POLICY_BODIES).catch(() => null));
      const found = (res == null ? void 0 : res.shop) ? Object.values(res.shop).find((p) => p && p.handle === handle) : null;
      if (alive && found) setPolicy(found);
    })();
    return () => {
      alive = false;
    };
  }, [handle]);
  return /* @__PURE__ */ jsx("section", { className: "section policy-page", children: /* @__PURE__ */ jsx(Container, { className: "policy-page__inner", children: policy ? /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("h1", { className: "policy-page__title", children: policy.title }),
    policy.body ? /* @__PURE__ */ jsx(
      "div",
      {
        className: "policy-page__body rte",
        dangerouslySetInnerHTML: { __html: policy.body }
      }
    ) : /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: "Loading…" })
  ] }) : /* @__PURE__ */ jsx("div", { className: "card card--padded card--bordered u-text-center", children: /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: "This policy isn’t available." }) }) }) });
}
const PolicyPage_default = defineSection({
  name: "policy-page",
  title: "Policy",
  category: "commerce",
  icon: "doc",
  attributes: {
    policy: { type: "text", label: "Policy handle (blank = from URL)" }
  },
  component: PolicyPage
});
const __vite_glob_0_40 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  PolicyPage,
  default: PolicyPage_default
}, Symbol.toStringTag, { value: "Module" }));
function ProductDescription(_props) {
  const ctx = useProductContext();
  const desc = ctx == null ? void 0 : ctx.product.description;
  if (!desc) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsx("div", { className: "product-details__desc", dangerouslySetInnerHTML: { __html: desc } });
}
const ProductDescription_default = defineSection({
  name: "product-description",
  title: "Product description",
  category: "block",
  icon: "¶",
  attributes: {},
  component: ProductDescription
});
const __vite_glob_0_41 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ProductDescription,
  default: ProductDescription_default
}, Symbol.toStringTag, { value: "Module" }));
function ProductDetails({ attributes, children }) {
  const ctx = useProductPage(attributes);
  const t = useT();
  const [activeIdx, setActiveIdx] = useState(0);
  if (!ctx) {
    return /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsx("div", { className: "container", children: /* @__PURE__ */ jsxs("div", { className: "not-found", children: [
      /* @__PURE__ */ jsx("h2", { children: t("product.notFound.title") }),
      /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: t("product.notFound.sub") }),
      /* @__PURE__ */ jsx(Button, { label: t("common.shopCollection"), link: "/collections/all", variant: "primary" })
    ] }) }) });
  }
  const { product, options, selected, setOption, displayPrice, variantImage, soldOut, adding } = ctx;
  const images = variantImage ? [variantImage, variantImage, variantImage, variantImage] : [];
  const active = images[activeIdx] ?? variantImage;
  const buttonLabel = attributes.buttonLabel ?? t("product.addToCart");
  const hasBlocks = Children.count(children) > 0;
  return /* @__PURE__ */ jsx(ProductProvider, { value: ctx, children: /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsx("div", { className: "container", children: /* @__PURE__ */ jsxs("div", { className: "product-details", children: [
    /* @__PURE__ */ jsxs("div", { className: "product-details__gallery", children: [
      /* @__PURE__ */ jsx("div", { className: "product-details__hero", children: active && /* @__PURE__ */ jsx(ImageResponsive, { src: active.url, alt: active.altText ?? product.title }) }),
      images.length > 1 && /* @__PURE__ */ jsx("div", { className: "product-details__thumbs", children: images.map((img, i) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "product-details__thumb",
          "aria-current": i === activeIdx,
          onClick: () => setActiveIdx(i),
          children: /* @__PURE__ */ jsx("img", { src: img.url, alt: "", loading: "lazy", decoding: "async" })
        },
        i
      )) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "product-details__body", children: hasBlocks ? children : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "stack stack--sm", children: [
        /* @__PURE__ */ jsx("span", { className: "eyebrow", children: soldOut ? t("product.soldOut") : "In stock · Ships in 24h" }),
        /* @__PURE__ */ jsx("h1", { className: "product-details__title", children: product.title }),
        /* @__PURE__ */ jsx("div", { className: "product-details__price", children: /* @__PURE__ */ jsx(Money, { value: displayPrice }) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "product-details__desc", children: product.description ?? "A quietly considered piece — clean lines, soft hand, made to last." }),
      options.map((opt) => /* @__PURE__ */ jsxs("div", { className: "stack stack--sm", children: [
        /* @__PURE__ */ jsx("span", { className: "field__label", children: opt.name }),
        /* @__PURE__ */ jsx("div", { className: "cluster", children: opt.values.map((value) => {
          const isActive = selected[opt.name] === value;
          return /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: `btn btn--${isActive ? "primary" : "secondary"} btn--sm`,
              style: { minWidth: 56 },
              "aria-pressed": isActive,
              onClick: () => setOption(opt.name, value),
              children: value
            },
            value
          );
        }) })
      ] }, opt.name)),
      /* @__PURE__ */ jsx("div", { className: "cluster", style: { marginTop: "var(--space-3)" }, children: /* @__PURE__ */ jsx(
        Button,
        {
          label: soldOut ? t("product.soldOut") : adding ? t("product.adding") : buttonLabel,
          onClick: () => void ctx.add(),
          disabled: soldOut || adding || !ctx.variantId,
          variant: "primary",
          size: "lg",
          fullWidth: true
        }
      ) }),
      /* @__PURE__ */ jsxs("details", { style: { borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-4)" }, children: [
        /* @__PURE__ */ jsxs(
          "summary",
          {
            style: {
              cursor: "pointer",
              listStyle: "none",
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 500
            },
            children: [
              t("product.materials"),
              /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: "+" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "u-text-muted", style: { marginTop: "var(--space-3)", lineHeight: "var(--leading-loose)" }, children: "100% organic cotton. Machine wash cold, line dry. Iron on low if needed." })
      ] }),
      /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsxs(
          "summary",
          {
            style: {
              cursor: "pointer",
              listStyle: "none",
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 500
            },
            children: [
              t("product.shipping"),
              /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: "+" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "u-text-muted", style: { marginTop: "var(--space-3)", lineHeight: "var(--leading-loose)" }, children: "Free shipping on orders over $50. 30-day returns on unworn items." })
      ] })
    ] }) })
  ] }) }) }) });
}
const ProductDetails_default = defineSection({
  name: "product-details",
  title: "Product details",
  category: "commerce",
  icon: "◉",
  attributes: {
    product: { type: "product", label: "Product (preview only — URL :handle is canonical)" },
    buttonLabel: { type: "text", default: "Add to cart", label: "Add to cart label" },
    buttonLink: { type: "url", label: "Add to cart link override" }
  },
  // Block-composed PDP (standard): add blocks into the info column to build
  // the product page from parts. With no blocks, the default layout renders.
  allowedBlocks: [
    "product-title",
    "product-price",
    "variant-picker",
    "swatches",
    "quantity",
    "add-to-cart",
    "product-description",
    "product-sku",
    "product-inventory",
    "text",
    "heading",
    "button",
    "image",
    "icon",
    "spacer",
    "accordion",
    "social-links",
    "payment-icons"
  ],
  presets: [
    {
      blocks: [
        { type: "product-title", settings: {} },
        { type: "product-price", settings: {} },
        { type: "variant-picker", settings: {} },
        { type: "quantity", settings: {} },
        { type: "add-to-cart", settings: {} },
        { type: "product-description", settings: {} }
      ]
    }
  ],
  component: ProductDetails
});
const __vite_glob_0_42 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ProductDetails,
  default: ProductDetails_default
}, Symbol.toStringTag, { value: "Module" }));
function ProductGrid({ attributes }) {
  const { collectionByHandle } = useData();
  const handle = attributes.collection ?? "all";
  const collection = collectionByHandle(handle);
  const products = (collection == null ? void 0 : collection.products) ?? [];
  const heading = attributes.heading;
  const subheading = attributes.subheading;
  return /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsxs("div", { className: "container", children: [
    (heading || subheading) && /* @__PURE__ */ jsxs("div", { className: "product-grid__head", children: [
      heading && /* @__PURE__ */ jsx("h2", { children: heading }),
      subheading && /* @__PURE__ */ jsx("p", { className: "lede", children: subheading })
    ] }),
    products.length === 0 ? /* @__PURE__ */ jsx("div", { className: "card card--padded card--bordered u-text-center", children: /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: "No products to show." }) }) : /* @__PURE__ */ jsx("div", { className: "product-grid__grid", children: products.map((p) => /* @__PURE__ */ jsxs("a", { className: "product-card", href: `/products/${p.handle}`, children: [
      /* @__PURE__ */ jsx("div", { className: "product-card__media", children: p.featuredImage && /* @__PURE__ */ jsx(
        "img",
        {
          src: p.featuredImage.url,
          alt: p.featuredImage.altText ?? p.title,
          loading: "lazy",
          decoding: "async"
        }
      ) }),
      /* @__PURE__ */ jsx("span", { className: "product-card__title", children: p.title }),
      /* @__PURE__ */ jsx("span", { className: "product-card__price", children: /* @__PURE__ */ jsx(Price, { money: p.price }) })
    ] }, p.handle)) })
  ] }) });
}
const ProductGrid_default = defineSection({
  name: "product-grid",
  title: "Product grid",
  category: "commerce",
  icon: "▦",
  attributes: {
    heading: { type: "text", default: "Shop the collection", label: "Heading" },
    subheading: { type: "text", label: "Subheading" },
    collection: { type: "collection", default: "all", label: "Collection" }
  },
  component: ProductGrid
});
const __vite_glob_0_43 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ProductGrid,
  default: ProductGrid_default
}, Symbol.toStringTag, { value: "Module" }));
function ProductInventory({ attributes }) {
  const ctx = useProductContext();
  if (!ctx) return /* @__PURE__ */ jsx(Fragment, {});
  const inStock = attributes.inStockLabel || "In stock";
  const soldOut = attributes.soldOutLabel || "Sold out";
  return /* @__PURE__ */ jsx("span", { className: "eyebrow", children: ctx.soldOut ? soldOut : inStock });
}
const ProductInventory_default = defineSection({
  name: "product-inventory",
  title: "Product inventory",
  category: "block",
  icon: "◔",
  attributes: {
    inStockLabel: { type: "text", default: "In stock", label: "In-stock label" },
    soldOutLabel: { type: "text", default: "Sold out", label: "Sold-out label" }
  },
  component: ProductInventory
});
const __vite_glob_0_44 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ProductInventory,
  default: ProductInventory_default
}, Symbol.toStringTag, { value: "Module" }));
function ProductPrice(_props) {
  const ctx = useProductContext();
  if (!ctx) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsx("div", { className: "product-details__price", children: /* @__PURE__ */ jsx(Money, { value: ctx.displayPrice }) });
}
const ProductPrice_default = defineSection({
  name: "product-price",
  title: "Product price",
  category: "block",
  icon: "$",
  attributes: {},
  component: ProductPrice
});
const __vite_glob_0_45 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ProductPrice,
  default: ProductPrice_default
}, Symbol.toStringTag, { value: "Module" }));
function ProductRecommendations({ attributes }) {
  var _a, _b;
  const { productByHandle, collectionByHandle, productRecommendations } = useData();
  const handle = typeof window !== "undefined" ? decodeHandle((_a = window.location.pathname.match(/\/products\/([^/]+)/)) == null ? void 0 : _a[1]) : void 0;
  const [recommended, setRecommended] = useState([]);
  useEffect(() => {
    let cancelled = false;
    const base = handle ? productByHandle(handle) : null;
    if ((base == null ? void 0 : base.id) && productRecommendations) {
      productRecommendations(base.id).then((r) => {
        if (!cancelled) setRecommended(r);
      }).catch(() => {
      });
    }
    return () => {
      cancelled = true;
    };
  }, [handle, productByHandle, productRecommendations]);
  const limit = attributes.limit ?? 4;
  const list = (recommended.length > 0 ? recommended : ((_b = collectionByHandle("all")) == null ? void 0 : _b.products) ?? []).filter((p) => p.handle !== handle).slice(0, limit);
  if (list.length === 0) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsxs("div", { className: "container", children: [
    /* @__PURE__ */ jsx("div", { className: "product-grid__head", children: /* @__PURE__ */ jsx("h2", { children: attributes.heading || "You may also like" }) }),
    /* @__PURE__ */ jsx("div", { className: "product-grid__grid", children: list.map((p) => /* @__PURE__ */ jsxs("a", { className: "product-card", href: `/products/${p.handle}`, children: [
      /* @__PURE__ */ jsx("div", { className: "product-card__media", children: p.featuredImage && /* @__PURE__ */ jsx("img", { src: p.featuredImage.url, alt: p.featuredImage.altText ?? p.title, loading: "lazy", decoding: "async" }) }),
      /* @__PURE__ */ jsx("span", { className: "product-card__title", children: p.title }),
      /* @__PURE__ */ jsx("span", { className: "product-card__price", children: /* @__PURE__ */ jsx(Price, { money: p.price }) })
    ] }, p.handle)) })
  ] }) });
}
const ProductRecommendations_default = defineSection({
  name: "product-recommendations",
  title: "Product recommendations",
  category: "product",
  icon: "✧",
  attributes: {
    heading: { type: "text", default: "You may also like", label: "Heading" },
    limit: { type: "range", default: 4, min: 2, max: 8, step: 1, label: "Products to show" }
  },
  component: ProductRecommendations
});
const __vite_glob_0_46 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ProductRecommendations,
  default: ProductRecommendations_default
}, Symbol.toStringTag, { value: "Module" }));
function ProductSku(_props) {
  var _a;
  const ctx = useProductContext();
  const sku = (_a = ctx == null ? void 0 : ctx.selectedVariant) == null ? void 0 : _a.sku;
  if (!sku) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsxs("p", { className: "product-details__sku u-text-muted", children: [
    "SKU: ",
    sku
  ] });
}
const ProductSku_default = defineSection({
  name: "product-sku",
  title: "Product SKU",
  category: "block",
  icon: "⌗",
  attributes: {},
  component: ProductSku
});
const __vite_glob_0_47 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ProductSku,
  default: ProductSku_default
}, Symbol.toStringTag, { value: "Module" }));
function ProductTitle(_props) {
  const ctx = useProductContext();
  if (!ctx) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsx("h1", { className: "product-details__title", children: ctx.product.title });
}
const ProductTitle_default = defineSection({
  name: "product-title",
  title: "Product title",
  category: "block",
  icon: "T",
  attributes: {},
  component: ProductTitle
});
const __vite_glob_0_48 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ProductTitle,
  default: ProductTitle_default
}, Symbol.toStringTag, { value: "Module" }));
function QuantitySelector(_props) {
  const ctx = useProductContext();
  if (!ctx) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsxs("div", { className: "quantity", role: "group", "aria-label": "Quantity", children: [
    /* @__PURE__ */ jsx("button", { type: "button", onClick: () => ctx.setQuantity(Math.max(1, ctx.quantity - 1)), "aria-label": "Decrease quantity", children: "−" }),
    /* @__PURE__ */ jsx("span", { className: "quantity__value", children: ctx.quantity }),
    /* @__PURE__ */ jsx("button", { type: "button", onClick: () => ctx.setQuantity(ctx.quantity + 1), "aria-label": "Increase quantity", children: "+" })
  ] });
}
const QuantitySelector_default = defineSection({
  name: "quantity",
  title: "Quantity",
  category: "block",
  icon: "#",
  attributes: {},
  component: QuantitySelector
});
const __vite_glob_0_49 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  QuantitySelector,
  default: QuantitySelector_default
}, Symbol.toStringTag, { value: "Module" }));
function RichText({ attributes }) {
  const align = attributes.align ?? "center";
  const eyebrow = attributes.eyebrow;
  const heading = attributes.heading;
  const body = attributes.body;
  const buttonLabel = attributes.buttonLabel;
  const buttonLink = attributes.buttonLink;
  return /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsx("div", { className: "container", children: /* @__PURE__ */ jsxs("div", { className: `rich-text ${align === "left" ? "rich-text--left" : ""}`, children: [
    eyebrow && /* @__PURE__ */ jsx("span", { className: "eyebrow", children: eyebrow }),
    heading && /* @__PURE__ */ jsx("h2", { children: heading }),
    body && /* @__PURE__ */ jsx("p", { children: body }),
    buttonLabel && /* @__PURE__ */ jsx(Button, { label: buttonLabel, link: buttonLink, variant: "secondary" })
  ] }) }) });
}
const RichText_default = defineSection({
  name: "rich-text",
  title: "Rich text",
  category: "content",
  icon: "¶",
  attributes: {
    eyebrow: { type: "text", label: "Eyebrow" },
    heading: { type: "text", default: "About our store", label: "Heading" },
    body: {
      type: "textarea",
      default: "Tell your story here. A short paragraph about who you are, what you make, and why it matters — three or four sentences is plenty.",
      label: "Body"
    },
    buttonLabel: { type: "text", label: "Button label" },
    buttonLink: { type: "url", label: "Button link" },
    align: {
      type: "select",
      default: "center",
      label: "Alignment",
      options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" }
      ]
    }
  },
  component: RichText
});
const __vite_glob_0_50 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  RichText,
  default: RichText_default
}, Symbol.toStringTag, { value: "Module" }));
function SearchResults({ attributes }) {
  var _a;
  const { collectionByHandle } = useData();
  const t = useT();
  const query = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") ?? "" : "";
  const q = query.trim().toLowerCase();
  const all = ((_a = collectionByHandle("all")) == null ? void 0 : _a.products) ?? [];
  const results = q ? all.filter((p) => p.title.toLowerCase().includes(q)) : [];
  const emptyHeading = attributes.emptyHeading ?? t("search.empty.title");
  return /* @__PURE__ */ jsx("section", { className: "section", children: /* @__PURE__ */ jsx("div", { className: "container", children: /* @__PURE__ */ jsxs("div", { className: "search", children: [
    /* @__PURE__ */ jsxs(
      "form",
      {
        className: "search__form",
        action: "/search",
        method: "get",
        role: "search",
        "aria-label": "Search products",
        children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              className: "field__input",
              type: "search",
              name: "q",
              defaultValue: query,
              placeholder: t("search.placeholder"),
              "aria-label": t("search.button")
            }
          ),
          /* @__PURE__ */ jsx("button", { className: "btn btn--primary", type: "submit", children: t("search.button") })
        ]
      }
    ),
    !q ? /* @__PURE__ */ jsxs("div", { className: "search__empty", children: [
      /* @__PURE__ */ jsx("h2", { children: emptyHeading }),
      /* @__PURE__ */ jsx("p", { children: attributes.emptySub ?? t("search.empty.sub") })
    ] }) : results.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "search__empty", children: [
      /* @__PURE__ */ jsxs("h2", { children: [
        t("search.noResults"),
        " “",
        query,
        "”"
      ] }),
      /* @__PURE__ */ jsx("p", { children: "Try a different search term, or browse the full collection." })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("p", { className: "search__count", children: [
        results.length,
        " ",
        results.length === 1 ? t("search.resultFor") : t("search.resultsFor"),
        " “",
        query,
        "”"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "product-grid__grid", children: results.map((p) => {
        var _a2, _b;
        return /* @__PURE__ */ jsxs(Link, { href: `/products/${p.handle}`, className: "product-card", children: [
          /* @__PURE__ */ jsx("div", { className: "product-card__media", children: /* @__PURE__ */ jsx(ImageResponsive, { src: (_a2 = p.featuredImage) == null ? void 0 : _a2.url, alt: ((_b = p.featuredImage) == null ? void 0 : _b.altText) ?? p.title }) }),
          /* @__PURE__ */ jsx("span", { className: "product-card__title", children: p.title }),
          /* @__PURE__ */ jsx("span", { className: "product-card__price", children: /* @__PURE__ */ jsx(Money, { value: p.price }) })
        ] }, p.handle);
      }) })
    ] })
  ] }) }) });
}
const SearchResults_default = defineSection({
  name: "search-results",
  title: "Search results",
  category: "commerce",
  icon: "⌕",
  attributes: {
    emptyHeading: { type: "text", default: "Find what you love", label: "Empty-state heading" },
    emptySub: {
      type: "text",
      default: "Type a query above to find products.",
      label: "Empty-state subtext"
    }
  },
  component: SearchResults
});
const __vite_glob_0_51 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SearchResults,
  default: SearchResults_default
}, Symbol.toStringTag, { value: "Module" }));
function SlideItem({ attributes }) {
  const image = attributes.image;
  const eyebrow = attributes.eyebrow;
  const heading = attributes.heading;
  const body = attributes.body;
  const buttonLabel = attributes.buttonLabel;
  const buttonLink = attributes.buttonLink;
  return /* @__PURE__ */ jsxs("div", { className: "tq-slideshow__slide", children: [
    image && /* @__PURE__ */ jsx(
      "img",
      {
        src: image,
        alt: heading ?? "",
        className: "tq-slideshow__img",
        loading: "lazy",
        decoding: "async"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "tq-slideshow__overlay", children: [
      eyebrow && /* @__PURE__ */ jsx("span", { className: "hero__eyebrow", children: eyebrow }),
      heading && /* @__PURE__ */ jsx("h2", { className: "tq-slideshow__heading", children: heading }),
      body && /* @__PURE__ */ jsx("p", { className: "tq-slideshow__body", children: body }),
      buttonLabel && /* @__PURE__ */ jsx(Button, { label: buttonLabel, link: buttonLink, variant: "inverse", size: "lg" })
    ] })
  ] });
}
const SlideItem_default = defineSection({
  name: "slide",
  title: "Slide",
  category: "block",
  icon: "▭",
  attributes: {
    image: { type: "image", label: "Image" },
    eyebrow: { type: "text", label: "Eyebrow" },
    heading: { type: "text", default: "New slide", label: "Heading" },
    body: { type: "textarea", label: "Body" },
    buttonLabel: { type: "text", label: "Button label" },
    buttonLink: { type: "url", label: "Button link" }
  },
  component: SlideItem
});
const __vite_glob_0_52 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SlideItem,
  default: SlideItem_default
}, Symbol.toStringTag, { value: "Module" }));
function parseSlides(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      return JSON.parse(raw);
    } catch {
    }
  }
  return [];
}
const DEFAULT_SLIDES = [
  {
    image: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%272000%27%20height%3D%27900%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%271%27%20y2%3D%271%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%232d3e50%27/%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%2356708c%27/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20fill%3D%27url%28%23g%29%27/%3E%3C/svg%3E",
    eyebrow: "New season",
    heading: "Modern essentials",
    body: "A clean starter storefront powered by Tanqory sections.",
    buttonLabel: "Shop the collection",
    buttonLink: "/collections/all"
  }
];
function Slideshow({ attributes, children }) {
  const parsed = parseSlides(attributes.slides);
  const blockCount = Children.count(children);
  const slides = parsed.length > 0 ? parsed : DEFAULT_SLIDES;
  const slideCount = blockCount > 0 ? blockCount : slides.length;
  const interval = attributes.intervalMs ?? 6e3;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (slideCount < 2 || paused) return;
    const id = window.setInterval(() => setIdx((i) => (i + 1) % slideCount), interval);
    return () => window.clearInterval(id);
  }, [slideCount, paused, interval]);
  const go = (n) => setIdx((n % slideCount + slideCount) % slideCount);
  return /* @__PURE__ */ jsx(
    "section",
    {
      className: "tq-slideshow",
      onMouseEnter: () => setPaused(true),
      onMouseLeave: () => setPaused(false),
      children: /* @__PURE__ */ jsxs("div", { className: "tq-slideshow__viewport", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "tq-slideshow__track",
            style: { transform: `translateX(-${idx * 100}%)` },
            children: blockCount > 0 ? children : slides.map((slide, i) => /* @__PURE__ */ jsxs("div", { className: "tq-slideshow__slide", children: [
              slide.image && /* @__PURE__ */ jsx(
                "img",
                {
                  src: slide.image,
                  alt: slide.heading ?? "",
                  className: "tq-slideshow__img",
                  loading: i === 0 ? "eager" : "lazy",
                  decoding: "async"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "tq-slideshow__overlay", children: [
                slide.eyebrow && /* @__PURE__ */ jsx("span", { className: "hero__eyebrow", children: slide.eyebrow }),
                slide.heading && /* @__PURE__ */ jsx("h2", { className: "tq-slideshow__heading", children: slide.heading }),
                slide.body && /* @__PURE__ */ jsx("p", { className: "tq-slideshow__body", children: slide.body }),
                slide.buttonLabel && /* @__PURE__ */ jsx(
                  Button,
                  {
                    label: slide.buttonLabel,
                    link: slide.buttonLink,
                    variant: "inverse",
                    size: "lg"
                  }
                )
              ] })
            ] }, i))
          }
        ),
        slideCount > 1 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "tq-slideshow__arrow tq-slideshow__arrow--prev",
              type: "button",
              "aria-label": "Previous slide",
              onClick: () => go(idx - 1),
              children: /* @__PURE__ */ jsx(Arrow, { direction: "left" })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "tq-slideshow__arrow tq-slideshow__arrow--next",
              type: "button",
              "aria-label": "Next slide",
              onClick: () => go(idx + 1),
              children: /* @__PURE__ */ jsx(Arrow, { direction: "right" })
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "tq-slideshow__dots", role: "tablist", children: Array.from({ length: slideCount }).map((_, i) => /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "tq-slideshow__dot",
              "aria-label": `Slide ${i + 1}`,
              "aria-current": i === idx,
              role: "tab",
              onClick: () => go(i)
            },
            i
          )) })
        ] })
      ] })
    }
  );
}
function Arrow({ direction }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width: "22",
      height: "22",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.6",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      style: { transform: direction === "left" ? "rotate(180deg)" : void 0 },
      children: [
        /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
        /* @__PURE__ */ jsx("path", { d: "m13 5 7 7-7 7" })
      ]
    }
  );
}
const Slideshow_default = defineSection({
  name: "slideshow",
  title: "Slideshow",
  category: "layout",
  icon: "▷",
  attributes: {
    intervalMs: { type: "number", default: 6e3, label: "Auto-advance interval (ms)" }
  },
  allowedBlocks: ["slide"],
  presets: [
    {
      blocks: [
        { type: "slide", settings: { heading: "Modern essentials", body: "A clean starter storefront powered by Tanqory sections.", buttonLabel: "Shop the collection", buttonLink: "/collections/all" } },
        { type: "slide", settings: { heading: "New season, new staples", body: "Limited-run pieces drop weekly.", buttonLabel: "Browse new", buttonLink: "/collections/all" } }
      ]
    }
  ],
  component: Slideshow
});
const __vite_glob_0_53 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Slideshow,
  default: Slideshow_default
}, Symbol.toStringTag, { value: "Module" }));
const PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X" },
  { key: "tiktok", label: "TikTok" },
  { key: "youtube", label: "YouTube" }
];
function SocialLinks({ attributes }) {
  const links = PLATFORMS.map((p) => ({ ...p, url: attributes[p.key] })).filter(
    (p) => p.url
  );
  if (links.length === 0) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsx("div", { className: "social-links", children: links.map((p) => /* @__PURE__ */ jsx(
    "a",
    {
      href: p.url,
      "aria-label": p.label,
      className: "social-link",
      target: "_blank",
      rel: "noopener noreferrer",
      children: /* @__PURE__ */ jsx(Icon$1, { name: p.key, size: 20 })
    },
    p.key
  )) });
}
const SocialLinks_default = defineSection({
  name: "social-links",
  title: "Social links",
  category: "block",
  icon: "@",
  attributes: {
    instagram: { type: "url", label: "Instagram URL" },
    facebook: { type: "url", label: "Facebook URL" },
    x: { type: "url", label: "X (Twitter) URL" },
    tiktok: { type: "url", label: "TikTok URL" },
    youtube: { type: "url", label: "YouTube URL" }
  },
  component: SocialLinks
});
const __vite_glob_0_54 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SocialLinks,
  default: SocialLinks_default
}, Symbol.toStringTag, { value: "Module" }));
function SpacerBlock({ attributes }) {
  return /* @__PURE__ */ jsx("div", { className: "block-spacer", style: { height: attributes.height ?? 24 }, "aria-hidden": true });
}
const SpacerBlock_default = defineSection({
  name: "spacer",
  title: "Spacer",
  category: "block",
  icon: "↕",
  attributes: {
    height: { type: "range", default: 24, min: 4, max: 120, step: 4, label: "Height (px)" }
  },
  component: SpacerBlock
});
const __vite_glob_0_55 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SpacerBlock,
  default: SpacerBlock_default
}, Symbol.toStringTag, { value: "Module" }));
function StoreLocator({ attributes }) {
  const { locations } = useData();
  const [list, setList] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    void ((locations == null ? void 0 : locations()) ?? Promise.resolve([])).then((r) => {
      if (alive) {
        setList(Array.isArray(r) ? r : []);
        setLoaded(true);
      }
    }).catch(() => {
      if (alive) setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [locations]);
  const heading = attributes.heading ?? "Visit us";
  return /* @__PURE__ */ jsx("section", { className: "section store-locator", children: /* @__PURE__ */ jsxs(Container, { className: "store-locator__inner", children: [
    /* @__PURE__ */ jsx("h2", { className: "store-locator__heading", children: heading }),
    !loaded ? /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: "Loading locations…" }) : list.length === 0 ? /* @__PURE__ */ jsx("div", { className: "card card--padded card--bordered u-text-center", children: /* @__PURE__ */ jsx("p", { className: "u-text-muted", children: "No store locations yet." }) }) : /* @__PURE__ */ jsx("div", { className: "store-locator__grid", children: list.map((l) => {
      const a = l.address;
      const lines = [
        a == null ? void 0 : a.address,
        [a == null ? void 0 : a.city, a == null ? void 0 : a.province].filter(Boolean).join(", "),
        a == null ? void 0 : a.postalCode,
        a == null ? void 0 : a.country
      ].filter(Boolean);
      return /* @__PURE__ */ jsxs("div", { className: "store-locator__card card card--padded card--bordered", children: [
        /* @__PURE__ */ jsx("h3", { className: "store-locator__name", children: l.name }),
        /* @__PURE__ */ jsx("address", { className: "store-locator__address stack stack--sm", children: lines.map((ln, i) => /* @__PURE__ */ jsx("span", { children: ln }, i)) }),
        (a == null ? void 0 : a.phone) && /* @__PURE__ */ jsx("a", { href: `tel:${a.phone}`, className: "store-locator__phone", children: a.phone })
      ] }, l.id);
    }) })
  ] }) });
}
const StoreLocator_default = defineSection({
  name: "store-locator",
  title: "Store locator",
  category: "commerce",
  icon: "pin",
  attributes: {
    heading: { type: "text", label: "Heading", default: "Visit us" }
  },
  component: StoreLocator
});
const __vite_glob_0_56 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  StoreLocator,
  default: StoreLocator_default
}, Symbol.toStringTag, { value: "Module" }));
const COLOR_MAP = {
  black: "#0a0a0a",
  white: "#ffffff",
  grey: "#9ca3af",
  gray: "#9ca3af",
  red: "#dc2626",
  orange: "#ea580c",
  yellow: "#eab308",
  green: "#16a34a",
  blue: "#2563eb",
  navy: "#1e3a5f",
  purple: "#7c3aed",
  pink: "#ec4899",
  brown: "#92400e",
  beige: "#e3d5b8",
  cream: "#f5efe0",
  tan: "#d2b48c"
};
function Swatches(_props) {
  const ctx = useProductContext();
  if (!ctx) return /* @__PURE__ */ jsx(Fragment, {});
  const opt = ctx.options.find((o) => /colou?r/i.test(o.name)) ?? ctx.options[0];
  if (!opt) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsxs("div", { className: "stack stack--sm", children: [
    /* @__PURE__ */ jsx("span", { className: "field__label", children: opt.name }),
    /* @__PURE__ */ jsx("div", { className: "swatches", children: opt.values.map((value) => {
      const isActive = ctx.selected[opt.name] === value;
      const color = COLOR_MAP[value.toLowerCase()] ?? value;
      return /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `swatch ${isActive ? "swatch--active" : ""}`,
          style: { background: color },
          "aria-label": value,
          "aria-pressed": isActive,
          title: value,
          onClick: () => ctx.setOption(opt.name, value)
        },
        value
      );
    }) })
  ] });
}
const Swatches_default = defineSection({
  name: "swatches",
  title: "Swatches",
  category: "block",
  icon: "●",
  attributes: {},
  component: Swatches
});
const __vite_glob_0_57 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Swatches,
  default: Swatches_default
}, Symbol.toStringTag, { value: "Module" }));
function TextBlock({ attributes }) {
  const text = attributes.text;
  if (!text) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsx("p", { className: "block-text", style: { textAlign: attributes.align || "left" }, children: text });
}
const TextBlock_default = defineSection({
  name: "text",
  title: "Text",
  category: "block",
  icon: "¶",
  attributes: {
    text: { type: "textarea", default: "Add your text here.", label: "Text" },
    align: {
      type: "select",
      default: "left",
      label: "Alignment",
      options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
        { value: "right", label: "Right" }
      ]
    }
  },
  component: TextBlock
});
const __vite_glob_0_58 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  TextBlock,
  default: TextBlock_default
}, Symbol.toStringTag, { value: "Module" }));
function VariantPicker(_props) {
  const ctx = useProductContext();
  if (!ctx || ctx.options.length === 0) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsx(Fragment, { children: ctx.options.map((opt) => /* @__PURE__ */ jsxs("div", { className: "stack stack--sm", children: [
    /* @__PURE__ */ jsx("span", { className: "field__label", children: opt.name }),
    /* @__PURE__ */ jsx("div", { className: "cluster", children: opt.values.map((value) => {
      const isActive = ctx.selected[opt.name] === value;
      return /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `btn btn--${isActive ? "primary" : "secondary"} btn--sm`,
          style: { minWidth: 56 },
          "aria-pressed": isActive,
          onClick: () => ctx.setOption(opt.name, value),
          children: value
        },
        value
      );
    }) })
  ] }, opt.name)) });
}
const VariantPicker_default = defineSection({
  name: "variant-picker",
  title: "Variant picker",
  category: "block",
  icon: "◧",
  attributes: {},
  component: VariantPicker
});
const __vite_glob_0_59 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  VariantPicker,
  default: VariantPicker_default
}, Symbol.toStringTag, { value: "Module" }));
function VideoBlock({ attributes }) {
  var _a, _b;
  const url = attributes.url;
  if (!url) return /* @__PURE__ */ jsx(Fragment, {});
  const yt = (_a = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)) == null ? void 0 : _a[1];
  const vimeo = (_b = url.match(/vimeo\.com\/(\d+)/)) == null ? void 0 : _b[1];
  const embed = yt ? `https://www.youtube.com/embed/${yt}` : vimeo ? `https://player.vimeo.com/video/${vimeo}` : null;
  const autoplay = attributes.autoplay === true;
  return /* @__PURE__ */ jsx("div", { className: "block-video", children: embed ? /* @__PURE__ */ jsx(
    "iframe",
    {
      src: embed,
      title: "Video",
      allow: "autoplay; fullscreen; picture-in-picture",
      allowFullScreen: true,
      loading: "lazy"
    }
  ) : /* @__PURE__ */ jsx(
    "video",
    {
      src: url,
      poster: attributes.poster,
      controls: attributes.controls !== false,
      autoPlay: autoplay,
      muted: autoplay,
      loop: attributes.loop === true,
      playsInline: true
    }
  ) });
}
const VideoBlock_default = defineSection({
  name: "video",
  title: "Video",
  category: "block",
  icon: "▷",
  attributes: {
    url: { type: "url", label: "Video URL (YouTube / Vimeo / file)" },
    poster: { type: "image", label: "Poster image (file only)" },
    autoplay: { type: "boolean", default: false, label: "Autoplay (muted)" },
    loop: { type: "boolean", default: false, label: "Loop" },
    controls: { type: "boolean", default: true, label: "Show controls" }
  },
  component: VideoBlock
});
const __vite_glob_0_60 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  VideoBlock,
  default: VideoBlock_default
}, Symbol.toStringTag, { value: "Module" }));
const mockCollections = [
  {
    handle: "all",
    title: "All products",
    products: [
      {
        handle: "example-product-1",
        title: "Example product",
        price: {
          amount: "99.00",
          currencyCode: "USD"
        },
        featuredImage: {
          url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'><rect width='600' height='800' fill='%23f4f4f5'/><g transform='translate(300,360)' fill='none' stroke='%23a1a1aa' stroke-width='3'><rect x='-110' y='-90' width='220' height='180' rx='12'/><circle cx='-55' cy='-35' r='16' fill='%23a1a1aa'/><path d='M -110 80 L -45 15 L 10 55 L 55 25 L 110 65 L 110 90 L -110 90 Z' fill='%23a1a1aa' stroke='none'/></g><text x='300' y='520' text-anchor='middle' font-family='-apple-system,system-ui,sans-serif' font-size='22' font-weight='500' fill='%2371717a'>Example</text></svg>",
          altText: "Example product placeholder"
        },
        options: [
          {
            name: "Size",
            values: [
              "XS",
              "S",
              "M",
              "L",
              "XL"
            ]
          }
        ],
        variants: [
          {
            id: "example-product-1-xs",
            title: "XS",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "XS"
              }
            ]
          },
          {
            id: "example-product-1-s",
            title: "S",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "S"
              }
            ]
          },
          {
            id: "example-product-1-m",
            title: "M",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "M"
              }
            ]
          },
          {
            id: "example-product-1-l",
            title: "L",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "L"
              }
            ]
          },
          {
            id: "example-product-1-xl",
            title: "XL",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: false,
            selectedOptions: [
              {
                name: "Size",
                value: "XL"
              }
            ]
          }
        ],
        variantId: "example-product-1-xs"
      },
      {
        handle: "example-product-2",
        title: "Example product",
        price: {
          amount: "99.00",
          currencyCode: "USD"
        },
        featuredImage: {
          url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'><rect width='600' height='800' fill='%23f4f4f5'/><g transform='translate(300,360)' fill='none' stroke='%23a1a1aa' stroke-width='3'><rect x='-110' y='-90' width='220' height='180' rx='12'/><circle cx='-55' cy='-35' r='16' fill='%23a1a1aa'/><path d='M -110 80 L -45 15 L 10 55 L 55 25 L 110 65 L 110 90 L -110 90 Z' fill='%23a1a1aa' stroke='none'/></g><text x='300' y='520' text-anchor='middle' font-family='-apple-system,system-ui,sans-serif' font-size='22' font-weight='500' fill='%2371717a'>Example</text></svg>",
          altText: "Example product placeholder"
        },
        options: [
          {
            name: "Size",
            values: [
              "XS",
              "S",
              "M",
              "L",
              "XL"
            ]
          }
        ],
        variants: [
          {
            id: "example-product-2-xs",
            title: "XS",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "XS"
              }
            ]
          },
          {
            id: "example-product-2-s",
            title: "S",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "S"
              }
            ]
          },
          {
            id: "example-product-2-m",
            title: "M",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "M"
              }
            ]
          },
          {
            id: "example-product-2-l",
            title: "L",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "L"
              }
            ]
          },
          {
            id: "example-product-2-xl",
            title: "XL",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "XL"
              }
            ]
          }
        ],
        variantId: "example-product-2-xs"
      },
      {
        handle: "example-product-3",
        title: "Example product",
        price: {
          amount: "99.00",
          currencyCode: "USD"
        },
        featuredImage: {
          url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'><rect width='600' height='800' fill='%23f4f4f5'/><g transform='translate(300,360)' fill='none' stroke='%23a1a1aa' stroke-width='3'><rect x='-110' y='-90' width='220' height='180' rx='12'/><circle cx='-55' cy='-35' r='16' fill='%23a1a1aa'/><path d='M -110 80 L -45 15 L 10 55 L 55 25 L 110 65 L 110 90 L -110 90 Z' fill='%23a1a1aa' stroke='none'/></g><text x='300' y='520' text-anchor='middle' font-family='-apple-system,system-ui,sans-serif' font-size='22' font-weight='500' fill='%2371717a'>Example</text></svg>",
          altText: "Example product placeholder"
        },
        options: [
          {
            name: "Size",
            values: [
              "XS",
              "S",
              "M",
              "L",
              "XL"
            ]
          }
        ],
        variants: [
          {
            id: "example-product-3-xs",
            title: "XS",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "XS"
              }
            ]
          },
          {
            id: "example-product-3-s",
            title: "S",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "S"
              }
            ]
          },
          {
            id: "example-product-3-m",
            title: "M",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "M"
              }
            ]
          },
          {
            id: "example-product-3-l",
            title: "L",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "L"
              }
            ]
          },
          {
            id: "example-product-3-xl",
            title: "XL",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "XL"
              }
            ]
          }
        ],
        variantId: "example-product-3-xs"
      },
      {
        handle: "example-product-4",
        title: "Example product",
        price: {
          amount: "99.00",
          currencyCode: "USD"
        },
        featuredImage: {
          url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'><rect width='600' height='800' fill='%23f4f4f5'/><g transform='translate(300,360)' fill='none' stroke='%23a1a1aa' stroke-width='3'><rect x='-110' y='-90' width='220' height='180' rx='12'/><circle cx='-55' cy='-35' r='16' fill='%23a1a1aa'/><path d='M -110 80 L -45 15 L 10 55 L 55 25 L 110 65 L 110 90 L -110 90 Z' fill='%23a1a1aa' stroke='none'/></g><text x='300' y='520' text-anchor='middle' font-family='-apple-system,system-ui,sans-serif' font-size='22' font-weight='500' fill='%2371717a'>Example</text></svg>",
          altText: "Example product placeholder"
        },
        options: [
          {
            name: "Size",
            values: [
              "XS",
              "S",
              "M",
              "L",
              "XL"
            ]
          }
        ],
        variants: [
          {
            id: "example-product-4-xs",
            title: "XS",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "XS"
              }
            ]
          },
          {
            id: "example-product-4-s",
            title: "S",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "S"
              }
            ]
          },
          {
            id: "example-product-4-m",
            title: "M",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "M"
              }
            ]
          },
          {
            id: "example-product-4-l",
            title: "L",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "L"
              }
            ]
          },
          {
            id: "example-product-4-xl",
            title: "XL",
            price: {
              amount: "99.00",
              currencyCode: "USD"
            },
            availableForSale: true,
            selectedOptions: [
              {
                name: "Size",
                value: "XL"
              }
            ]
          }
        ],
        variantId: "example-product-4-xs"
      }
    ]
  }
];
const accent = "#0a0a0a";
const accountExtraLinks = "Orders|/account/orders\nAddresses|/account/addresses";
const accountHeading = "";
const accountLoggedIn = false;
const accountPrimaryHref = "";
const accountPrimaryLabel = "";
const accountSecondaryHref = "";
const accountSecondaryLabel = "";
const accountSubtext = "";
const cartCheckoutLabel = "Checkout";
const cartDrawerWidth = "420px";
const cartEmptyHeading = "Your cart is empty";
const cartEmptySubtext = "Add a few things to get started.";
const cartViewLabel = "View full cart";
const enableAccountDropdown = true;
const enableCartDrawer = true;
const enableMobileNavDrawer = true;
const enableSearchModal = true;
const enableSpaNavigation = true;
const footerCompanyMenuHandle = "footer-company";
const footerHelpMenuHandle = "footer-help";
const footerShopMenuHandle = "footer-shop";
const footerTagline = "";
const headerMenuHandle = "main-menu";
const mobileNavHeading = "Menu";
const mobileNavWidth = "320px";
const poweredByLabel = "Made with Tanqory";
const searchCtaLabel = "See all results →";
const searchDebounceMs = 250;
const searchMaxResults = 6;
const searchModalWidth = "640px";
const searchPlaceholder = "Search products…";
const shopName = "";
const showPoweredBy = true;
const settings = {
  accent,
  accountExtraLinks,
  accountHeading,
  accountLoggedIn,
  accountPrimaryHref,
  accountPrimaryLabel,
  accountSecondaryHref,
  accountSecondaryLabel,
  accountSubtext,
  cartCheckoutLabel,
  cartDrawerWidth,
  cartEmptyHeading,
  cartEmptySubtext,
  cartViewLabel,
  enableAccountDropdown,
  enableCartDrawer,
  enableMobileNavDrawer,
  enableSearchModal,
  enableSpaNavigation,
  footerCompanyMenuHandle,
  footerHelpMenuHandle,
  footerShopMenuHandle,
  footerTagline,
  headerMenuHandle,
  mobileNavHeading,
  mobileNavWidth,
  poweredByLabel,
  searchCtaLabel,
  searchDebounceMs,
  searchMaxResults,
  searchModalWidth,
  searchPlaceholder,
  shopName,
  showPoweredBy
};
const cart = "Cart";
const locale = {
  "nav.shop": "Shop",
  cart,
  "footer.rights": "All rights reserved.",
  "footer.language": "Language",
  "footer.region": "Country / region",
  "footer.shippingTo": "Shipping to",
  "footer.pricesIn": "Prices in",
  "common.shopCollection": "Shop the collection",
  "common.continueShopping": "Continue shopping",
  "product.addToCart": "Add to cart",
  "product.soldOut": "Sold out",
  "product.adding": "Adding…",
  "product.notFound.title": "Product not found",
  "product.notFound.sub": "This product may have moved or sold out.",
  "product.materials": "Materials & care",
  "product.shipping": "Shipping & returns",
  "cart.title": "Your cart",
  "cart.orderSummary": "Order summary",
  "cart.subtotal": "Subtotal",
  "cart.shipping": "Shipping",
  "cart.calculatedAtCheckout": "Calculated at checkout",
  "cart.total": "Total",
  "cart.checkout": "Checkout",
  "cart.remove": "Remove",
  "cart.empty.title": "Your cart is empty",
  "cart.empty.sub": "Add a few things from the collection to get started.",
  "cart.shippingNote": "Shipping & taxes calculated at checkout.",
  "search.placeholder": "Search products…",
  "search.button": "Search",
  "search.empty.title": "Search",
  "search.empty.sub": "Type a query above to find products.",
  "search.noResults": "No matches for",
  "search.resultsFor": "results for",
  "search.resultFor": "result for"
};
const renderSection = createSectionPreview({
  sections: /* @__PURE__ */ Object.assign({ "./sections/AccordionBlock.tsx": __vite_glob_0_0, "./sections/AccountPage.tsx": __vite_glob_0_1, "./sections/AddToCart.tsx": __vite_glob_0_2, "./sections/AnnouncementBar.tsx": __vite_glob_0_3, "./sections/ArticleBody.tsx": __vite_glob_0_4, "./sections/BlogPosts.tsx": __vite_glob_0_5, "./sections/ButtonBlock.tsx": __vite_glob_0_6, "./sections/CartItems.tsx": __vite_glob_0_7, "./sections/CollectionItem.tsx": __vite_glob_0_8, "./sections/CollectionLinks.tsx": __vite_glob_0_9, "./sections/CollectionList.tsx": __vite_glob_0_10, "./sections/ColumnItem.tsx": __vite_glob_0_11, "./sections/ContactForm.tsx": __vite_glob_0_12, "./sections/Divider.tsx": __vite_glob_0_13, "./sections/FAQ.tsx": __vite_glob_0_14, "./sections/FaqItem.tsx": __vite_glob_0_15, "./sections/FeatureGridBlocks.tsx": __vite_glob_0_16, "./sections/FeatureHighlights.tsx": __vite_glob_0_17, "./sections/FeaturedCollection.tsx": __vite_glob_0_18, "./sections/FeaturedProduct.tsx": __vite_glob_0_19, "./sections/Footer.tsx": __vite_glob_0_20, "./sections/FooterBrand.tsx": __vite_glob_0_21, "./sections/FooterMenu.tsx": __vite_glob_0_22, "./sections/FooterText.tsx": __vite_glob_0_23, "./sections/Group.tsx": __vite_glob_0_24, "./sections/Header.tsx": __vite_glob_0_25, "./sections/HeadingBlock.tsx": __vite_glob_0_26, "./sections/Hero.tsx": __vite_glob_0_27, "./sections/IconBlock.tsx": __vite_glob_0_28, "./sections/ImageBlock.tsx": __vite_glob_0_29, "./sections/ImageWithText.tsx": __vite_glob_0_30, "./sections/JumboText.tsx": __vite_glob_0_31, "./sections/LogoItem.tsx": __vite_glob_0_32, "./sections/LogoList.tsx": __vite_glob_0_33, "./sections/Marquee.tsx": __vite_glob_0_34, "./sections/Multicolumn.tsx": __vite_glob_0_35, "./sections/Newsletter.tsx": __vite_glob_0_36, "./sections/NotFound.tsx": __vite_glob_0_37, "./sections/PageBody.tsx": __vite_glob_0_38, "./sections/PaymentIcons.tsx": __vite_glob_0_39, "./sections/PolicyPage.tsx": __vite_glob_0_40, "./sections/ProductDescription.tsx": __vite_glob_0_41, "./sections/ProductDetails.tsx": __vite_glob_0_42, "./sections/ProductGrid.tsx": __vite_glob_0_43, "./sections/ProductInventory.tsx": __vite_glob_0_44, "./sections/ProductPrice.tsx": __vite_glob_0_45, "./sections/ProductRecommendations.tsx": __vite_glob_0_46, "./sections/ProductSku.tsx": __vite_glob_0_47, "./sections/ProductTitle.tsx": __vite_glob_0_48, "./sections/QuantitySelector.tsx": __vite_glob_0_49, "./sections/RichText.tsx": __vite_glob_0_50, "./sections/SearchResults.tsx": __vite_glob_0_51, "./sections/SlideItem.tsx": __vite_glob_0_52, "./sections/Slideshow.tsx": __vite_glob_0_53, "./sections/SocialLinks.tsx": __vite_glob_0_54, "./sections/SpacerBlock.tsx": __vite_glob_0_55, "./sections/StoreLocator.tsx": __vite_glob_0_56, "./sections/Swatches.tsx": __vite_glob_0_57, "./sections/TextBlock.tsx": __vite_glob_0_58, "./sections/VariantPicker.tsx": __vite_glob_0_59, "./sections/VideoBlock.tsx": __vite_glob_0_60 }),
  settings,
  locale,
  mockData: mockCollections
});
export {
  renderSection
};
