import { S as SectionTree, l as getSection, a as allSections, p as useData, r as registerSections, D as DataProvider, T as ThemeProvider, C as CartProvider } from "./ssg-DTm1kYiW.js";
import { c, b, d, e, f, g, h, i, j, k, m, n, o, u, q, s } from "./ssg-DTm1kYiW.js";
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useState, useRef, useEffect, createContext, useContext, Children, isValidElement } from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
function defineSection(def) {
  def.component.blockName = def.name;
  return def;
}
const KEY = "tq-cookie-consent";
const EVENT = "tq-consent-change";
let bannerRequired = false;
function setBannerRequired(v) {
  bannerRequired = v;
}
function isBannerRequired() {
  return bannerRequired;
}
function getConsent() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    if (raw === "accepted") return { analytics: true, marketing: true };
    if (raw === "declined") return { analytics: false, marketing: false };
    const p = JSON.parse(raw);
    return { analytics: !!p.analytics, marketing: !!p.marketing };
  } catch {
    return null;
  }
}
function hasDecided() {
  return getConsent() !== null;
}
function setConsent(c2) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c2));
  } catch {
  }
  try {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: c2 }));
  } catch {
  }
}
function hasConsent(purpose) {
  if (!bannerRequired) return true;
  const c2 = getConsent();
  return c2 ? c2[purpose] : false;
}
function onConsentChange(cb) {
  const handler = (e2) => cb(e2.detail);
  try {
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  } catch {
    return () => {
    };
  }
}
const VISITOR_KEY = "tq-visitor-id";
const SESSION_KEY = "tq-session";
const SESSION_TTL_MS = 30 * 60 * 1e3;
const DEFAULT_ENDPOINT = "/api/v1/analytics/events/batch";
const NOOP = { track() {
}, pageViewed() {
}, flush() {
}, subscribe: () => () => {
} };
const ALL_EVENTS = "all_events";
const REPLAY_MAX = 50;
const busSubscribers = /* @__PURE__ */ new Map();
const busReplay = [];
function busPublish(evt) {
  if (!hasConsent("marketing")) return;
  busReplay.push(evt);
  if (busReplay.length > REPLAY_MAX) busReplay.shift();
  const fire = (set) => {
    if (!set) return;
    for (const cb of set) {
      try {
        cb(evt);
      } catch {
      }
    }
  };
  fire(busSubscribers.get(evt.name));
  fire(busSubscribers.get(ALL_EVENTS));
}
function subscribe(eventName, cb) {
  let set = busSubscribers.get(eventName);
  if (!set) {
    set = /* @__PURE__ */ new Set();
    busSubscribers.set(eventName, set);
  }
  set.add(cb);
  for (const e2 of busReplay) {
    if (eventName === ALL_EVENTS || e2.name === eventName) {
      try {
        cb(e2);
      } catch {
      }
    }
  }
  return () => {
    set?.delete(cb);
  };
}
let activeAnalytics = NOOP;
function getAnalytics() {
  return activeAnalytics;
}
function uuid() {
  const c2 = globalThis.crypto;
  if (c2?.randomUUID) return c2.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = Math.random() * 16 | 0;
    return (ch === "x" ? r : r & 3 | 8).toString(16);
  });
}
function persistentId(key) {
  try {
    let v = localStorage.getItem(key);
    if (!v) {
      v = uuid();
      localStorage.setItem(key, v);
    }
    return v;
  } catch {
    return uuid();
  }
}
function sessionId() {
  const now = Date.now();
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const s2 = JSON.parse(raw);
      if (s2.id && now - s2.at < SESSION_TTL_MS) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ id: s2.id, at: now }));
        return s2.id;
      }
    }
    const id = uuid();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id, at: now }));
    return id;
  } catch {
    return uuid();
  }
}
function buildContext() {
  const params = new URLSearchParams(location.search);
  const utm = {};
  for (const [k2, dest] of [
    ["utm_source", "source"],
    ["utm_medium", "medium"],
    ["utm_campaign", "campaign"],
    ["utm_term", "term"],
    ["utm_content", "content"]
  ]) {
    const v = params.get(k2);
    if (v) utm[dest] = v;
  }
  return {
    userAgent: navigator.userAgent,
    referrer: document.referrer || "",
    ...Object.keys(utm).length ? { utm } : {},
    screen: { width: window.screen.width, height: window.screen.height },
    locale: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}
function createAnalytics(opts) {
  if (typeof window === "undefined" || !opts.storeId) return NOOP;
  const endpoint = opts.endpoint ?? DEFAULT_ENDPOINT;
  const batchSize = opts.batchSize ?? 10;
  const consent = opts.consent ?? (() => true);
  const queue = [];
  const send = () => {
    if (!queue.length || !consent()) {
      queue.length = 0;
      return;
    }
    const batch = {
      storeId: opts.storeId,
      sessionId: sessionId(),
      visitorId: persistentId(VISITOR_KEY),
      events: queue.splice(0, 50),
      context: buildContext()
    };
    const body = JSON.stringify(batch);
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
      } else {
        void fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
          keepalive: true
        }).catch(() => {
        });
      }
    } catch {
    }
  };
  const track = (type, properties = {}) => {
    busPublish({
      id: uuid(),
      name: type.toLowerCase(),
      type,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      data: properties,
      context: buildContext()
    });
    if (!consent()) return;
    queue.push({
      eventName: type.toLowerCase(),
      eventType: type,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      properties
    });
    if (queue.length >= batchSize) send();
  };
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") send();
  });
  window.addEventListener("pagehide", send);
  window.tqAnalytics ??= {
    subscribe
  };
  const api = {
    track,
    pageViewed: (properties = {}) => track("PAGE_VIEWED", { pageUrl: location.href, pageTitle: document.title, ...properties }),
    flush: send,
    subscribe
  };
  activeAnalytics = api;
  return api;
}
function defineTheme(config) {
  return config;
}
function defineSettings(schema) {
  return schema;
}
const samePath = (a, b2) => a.length === b2.length && a.every((v, i2) => v === b2[i2]);
function nodeAt(tree, path) {
  let nodes = tree;
  let node;
  for (const i2 of path) {
    node = nodes[i2];
    nodes = node?.blocks ?? [];
  }
  return node;
}
function updateAt(tree, path, fn) {
  const [i2, ...rest] = path;
  return tree.map(
    (n2, k2) => k2 !== i2 ? n2 : rest.length === 0 ? fn(n2) : { ...n2, blocks: updateAt(n2.blocks ?? [], rest, fn) }
  );
}
function removeAt(tree, path) {
  const [i2, ...rest] = path;
  if (rest.length === 0) return tree.filter((_, k2) => k2 !== i2);
  return tree.map((n2, k2) => k2 !== i2 ? n2 : { ...n2, blocks: removeAt(n2.blocks ?? [], rest) });
}
function insertChild(tree, parent, node) {
  if (parent.length === 0) return [...tree, node];
  const [i2, ...rest] = parent;
  return tree.map((n2, k2) => k2 !== i2 ? n2 : { ...n2, blocks: insertChild(n2.blocks ?? [], rest, node) });
}
function reorder(tree, parent, from, to) {
  const moveArr = (arr) => {
    const c2 = [...arr];
    const [m2] = c2.splice(from, 1);
    c2.splice(to, 0, m2);
    return c2;
  };
  if (parent.length === 0) return moveArr(tree);
  const [i2, ...rest] = parent;
  return tree.map((n2, k2) => k2 !== i2 ? n2 : { ...n2, blocks: reorder(n2.blocks ?? [], rest, from, to) });
}
function defaultsFor(type) {
  const out = {};
  for (const [k2, s2] of Object.entries(getSection(type)?.attributes ?? {})) if (s2.default !== void 0) out[k2] = s2.default;
  return out;
}
const newNode = (type) => ({ type, id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, settings: defaultsFor(type) });
function Field({ name, spec, value, onChange }) {
  const label = spec.label ?? name;
  const c2 = { style: { width: "100%", padding: "6px 8px", boxSizing: "border-box" } };
  let input;
  if (spec.type === "textarea") input = /* @__PURE__ */ jsx("textarea", { ...c2, rows: 3, value: String(value ?? ""), onChange: (e2) => onChange(e2.target.value) });
  else if (spec.type === "color") input = /* @__PURE__ */ jsx("input", { type: "color", value: String(value ?? "#000000"), onChange: (e2) => onChange(e2.target.value) });
  else if (spec.type === "number") input = /* @__PURE__ */ jsx("input", { ...c2, type: "number", value: Number(value ?? 0), onChange: (e2) => onChange(Number(e2.target.value)) });
  else if (spec.type === "boolean") input = /* @__PURE__ */ jsx("input", { type: "checkbox", checked: Boolean(value), onChange: (e2) => onChange(e2.target.checked) });
  else input = /* @__PURE__ */ jsx("input", { ...c2, type: "text", value: String(value ?? ""), onChange: (e2) => onChange(e2.target.value) });
  return /* @__PURE__ */ jsxs("label", { style: { display: "block", margin: "0 0 12px" }, children: [
    /* @__PURE__ */ jsx("span", { style: { display: "block", fontSize: 12, color: "#666", marginBottom: 4 }, children: label }),
    input
  ] });
}
const btn = (active = false) => ({ border: "1px solid", borderColor: active ? "#111" : "#e5e5e5", borderRadius: 6, background: active ? "#111" : "#fff", color: active ? "#fff" : "#111", cursor: "pointer", font: "inherit" });
function Editor({ pages, initialPage = "index" }) {
  const pageNames = Object.keys(pages);
  const [trees, setTrees] = useState(pages);
  const [page, setPage] = useState(pageNames.includes(initialPage) ? initialPage : pageNames[0] ?? "index");
  const [sel, setSel] = useState([0]);
  const [addParent, setAddParent] = useState(null);
  const [status, setStatus] = useState("");
  const [drag, setDrag] = useState(null);
  const tree = trees[page] ?? [];
  const setTree = (fn) => setTrees((all) => ({ ...all, [page]: fn(all[page] ?? []) }));
  const node = nodeAt(tree, sel);
  const def = node ? getSection(node.type) : void 0;
  const save = async () => {
    setStatus("saving…");
    const res = await fetch("/__studio/save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ page, doc: { sections: trees[page] ?? [] } })
    });
    setStatus(res.ok ? `saved ${page} ✓` : "save failed");
  };
  const onDrop = (parent, to) => {
    if (drag && drag.parent === parent.join(".")) setTree((t) => reorder(t, parent, drag.index, to));
    setDrag(null);
  };
  const inserter = (parent, allow) => {
    const opts = allSections().filter((s2) => !allow || allow.includes(s2.name));
    return /* @__PURE__ */ jsx("div", { style: { margin: "2px 0 8px", marginLeft: (parent.length + 1) * 14, border: "1px solid #eee", borderRadius: 6, padding: 6 }, children: opts.map((s2) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => {
          setTree((t) => insertChild(t, parent, newNode(s2.name)));
          setAddParent(null);
        },
        style: { ...btn(), display: "block", width: "100%", textAlign: "left", padding: "5px 8px", marginBottom: 2 },
        children: [
          s2.icon ?? "▪",
          " ",
          s2.title
        ]
      },
      s2.name
    )) });
  };
  const renderList = (nodes, parent) => nodes.map((n2, i2) => {
    const path = [...parent, i2];
    const sec = getSection(n2.type);
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          draggable: true,
          onDragStart: () => setDrag({ parent: parent.join("."), index: i2 }),
          onDragOver: (e2) => e2.preventDefault(),
          onDrop: () => onDrop(parent, i2),
          style: { display: "flex", gap: 4, marginBottom: 4, marginLeft: parent.length * 14 },
          children: [
            /* @__PURE__ */ jsx("span", { style: { cursor: "grab", color: "#bbb", padding: "0 2px" }, children: "⠿" }),
            /* @__PURE__ */ jsxs("button", { onClick: () => setSel(path), style: { ...btn(samePath(path, sel)), flex: 1, textAlign: "left", padding: "6px 8px" }, children: [
              sec?.icon ?? "▪",
              " ",
              sec?.title ?? n2.type
            ] }),
            sec?.allowedBlocks?.length ? /* @__PURE__ */ jsx("button", { title: "add child", onClick: () => setAddParent(path), style: { ...btn(), width: 26 }, children: "＋" }) : null,
            /* @__PURE__ */ jsx("button", { title: "remove", onClick: () => {
              setTree((t) => removeAt(t, path));
              setSel([0]);
            }, style: { ...btn(), width: 26, color: "#c0392b" }, children: "✕" })
          ]
        }
      ),
      n2.blocks?.length ? renderList(n2.blocks, path) : null,
      addParent && samePath(addParent, path) ? inserter(path, sec?.allowedBlocks) : null
    ] }, n2.id ?? i2);
  });
  return /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "300px 1fr 320px", height: "100vh", fontFamily: "system-ui" }, children: [
    /* @__PURE__ */ jsxs("aside", { style: { borderRight: "1px solid #e5e5e5", overflow: "auto", padding: 16 }, children: [
      /* @__PURE__ */ jsx("select", { value: page, onChange: (e2) => {
        setPage(e2.target.value);
        setSel([0]);
      }, style: { width: "100%", padding: "6px 8px", marginBottom: 12 }, children: pageNames.map((p) => /* @__PURE__ */ jsx("option", { value: p, children: p }, p)) }),
      /* @__PURE__ */ jsx("strong", { style: { fontSize: 13 }, children: "SECTIONS — drag ⠿ to reorder" }),
      /* @__PURE__ */ jsx("div", { style: { margin: "8px 0" }, children: renderList(tree, []) }),
      /* @__PURE__ */ jsx("button", { onClick: () => setAddParent([]), style: { ...btn(), padding: "8px 10px", width: "100%" }, children: "+ Add section" }),
      addParent && addParent.length === 0 ? inserter([]) : null,
      /* @__PURE__ */ jsx("button", { onClick: save, style: { marginTop: 16, padding: "10px 16px", border: "none", borderRadius: 6, background: "#111", color: "#fff", cursor: "pointer", width: "100%" }, children: "Save" }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: "#666", marginTop: 8 }, children: status })
    ] }),
    /* @__PURE__ */ jsx("main", { style: { overflow: "auto" }, children: /* @__PURE__ */ jsx(SectionTree, { tree }) }),
    /* @__PURE__ */ jsx("aside", { style: { borderLeft: "1px solid #e5e5e5", overflow: "auto", padding: 16 }, children: def ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("strong", { style: { fontSize: 13 }, children: [
        def.title.toUpperCase(),
        " SETTINGS"
      ] }),
      /* @__PURE__ */ jsx("div", { style: { marginTop: 8 }, children: Object.entries(def.attributes ?? {}).map(([k2, spec]) => /* @__PURE__ */ jsx(
        Field,
        {
          name: k2,
          spec,
          value: node.settings?.[k2] ?? spec.default,
          onChange: (v) => setTree((t) => updateAt(t, sel, (nn) => ({ ...nn, settings: { ...nn.settings, [k2]: v } })))
        },
        k2
      )) })
    ] }) : /* @__PURE__ */ jsx("div", { style: { color: "#888", fontSize: 13 }, children: "Select a section in the tree to edit its settings." }) })
  ] });
}
const isMsg = (m2) => !!m2 && typeof m2 === "object" && typeof m2.type === "string";
function PreviewBridge({
  pages,
  initialPage,
  Shell
}) {
  const [tree, setTree] = useState(pages[initialPage] ?? []);
  const [selected, setSelected] = useState(null);
  const data = useData();
  const send = (msg) => {
    try {
      window.parent?.postMessage(msg, "*");
      if (window.top && window.top !== window.parent) window.top.postMessage(msg, "*");
    } catch {
    }
  };
  const treeRef = useRef(tree);
  useEffect(() => {
    treeRef.current = tree;
  }, [tree]);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    send({ type: "tanqory-content-changed", content: { sections: tree } });
  }, [tree]);
  useEffect(() => {
    const onMsg = (e2) => {
      if (!isMsg(e2.data)) return;
      if (e2.data.type === "tanqory-get-content") {
        send({ type: "tanqory-content", requestId: e2.data.requestId ?? null, content: { sections: treeRef.current } });
      } else if (e2.data.type === "tq:set-content") {
        if (Array.isArray(e2.data.doc)) setTree(e2.data.doc);
        else if (typeof e2.data.page === "string" && pages[e2.data.page]) setTree(pages[e2.data.page]);
      } else if (e2.data.type === "tq:select") {
        setSelected(Array.isArray(e2.data.path) ? e2.data.path : null);
      } else if (e2.data.type === "tanqory-preview-update-section") {
        const id = e2.data.sectionId;
        const s2 = e2.data.settings ?? {};
        const rawBlocks = e2.data.blocks;
        const order = e2.data.order;
        let blocks;
        if (Array.isArray(rawBlocks)) {
          blocks = rawBlocks;
        } else if (rawBlocks && typeof rawBlocks === "object") {
          const ids = Array.isArray(order) && order.length ? order : Object.keys(rawBlocks);
          blocks = ids.filter((bid) => rawBlocks[bid]).map((bid) => ({ ...rawBlocks[bid], id: rawBlocks[bid].id ?? bid }));
        }
        setTree(
          (t) => t.map(
            (n2) => n2.id === id ? { ...n2, settings: { ...n2.settings, ...s2 }, ...blocks ? { blocks } : {} } : n2
          )
        );
      } else if (e2.data.type === "tanqory-preview-select") {
        const id = e2.data.sectionId;
        setTree((t) => {
          const i2 = t.findIndex((n2) => n2.id === id);
          setSelected(i2 >= 0 ? [i2] : null);
          return t;
        });
        if (typeof document !== "undefined" && id) {
          const sel = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(id) : id;
          requestAnimationFrame(() => {
            const wrap = document.querySelector(`[data-tq-section-id="${sel}"]`);
            const target = wrap?.firstElementChild ?? wrap;
            target?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }
      } else if (e2.data.type === "tanqory-preview-reorder-sections") {
        const order = e2.data.order;
        if (Array.isArray(order)) {
          setTree((t) => {
            const byId = new Map(t.map((n2) => [n2.id, n2]));
            const next = order.map((id) => byId.get(id)).filter(Boolean);
            for (const n2 of t) if (!order.includes(n2.id)) next.push(n2);
            return next.length ? next : t;
          });
        }
      } else if (e2.data.type === "tanqory-preview-remove-section") {
        const id = e2.data.sectionId;
        setTree((t) => t.filter((n2) => n2.id !== id));
      } else if (e2.data.type === "tanqory-preview-insert-section") {
        const id = e2.data.sectionId;
        const rawBlocks = e2.data.blocks;
        const order = e2.data.order;
        let blocks;
        if (Array.isArray(rawBlocks)) {
          blocks = rawBlocks;
        } else if (rawBlocks && typeof rawBlocks === "object") {
          const ids = Array.isArray(order) && order.length ? order : Object.keys(rawBlocks);
          blocks = ids.filter((bid) => rawBlocks[bid]).map((bid) => ({ ...rawBlocks[bid], id: rawBlocks[bid].id ?? bid }));
        }
        const node = {
          id,
          type: e2.data.sectionType,
          settings: e2.data.settings ?? {},
          ...blocks ? { blocks } : {}
        };
        const after = e2.data.afterSectionId;
        setTree((t) => {
          if (t.some((n2) => n2.id === id)) return t;
          const idx = after ? t.findIndex((n2) => n2.id === after) : -1;
          const next = [...t];
          next.splice(idx + 1, 0, node);
          return next;
        });
      } else if (e2.data.type === "tanqory-request-collections") {
        const collections = data.allCollections().map((c2) => ({
          handle: c2.handle,
          title: c2.title,
          productCount: c2.products.length
        }));
        send({ type: "tanqory-collections", requestId: e2.data.requestId ?? null, collections });
      } else if (e2.data.type === "tanqory-request-menus") {
        const requestId = e2.data.requestId ?? null;
        void Promise.resolve(data.listMenus?.() ?? []).then((menus) => send({ type: "tanqory-menus", requestId, menus })).catch(() => send({ type: "tanqory-menus", requestId, menus: [] }));
      } else if (e2.data.type === "tanqory-request-products") {
        const seen = /* @__PURE__ */ new Set();
        const products = [];
        for (const c2 of data.allCollections()) {
          for (const p of c2.products) {
            if (seen.has(p.handle)) continue;
            seen.add(p.handle);
            products.push({
              handle: p.handle,
              title: p.title,
              price: p.price?.amount ?? "",
              image: p.featuredImage?.url ?? null
            });
          }
        }
        send({ type: "tanqory-products", requestId: e2.data.requestId ?? null, products });
      }
    };
    window.addEventListener("message", onMsg);
    send({ type: "tq:ready", pages: Object.keys(pages) });
    return () => window.removeEventListener("message", onMsg);
  }, []);
  const onClickCapture = (e2) => {
    const target = e2.target;
    const nodeEl = target.closest("[data-tq-section-id]");
    if (!nodeEl) return;
    const nodeId = nodeEl.dataset.tqSectionId;
    const pathAttr = nodeEl.dataset.tqPath;
    if (target.closest('a, button[type="submit"]')) {
      e2.preventDefault();
    }
    const root = e2.currentTarget;
    const prevBox = root.querySelector("[data-tq-outlined]");
    if (prevBox) {
      prevBox.style.outline = "";
      prevBox.style.outlineOffset = "";
      prevBox.removeAttribute("data-tq-outlined");
    }
    const box = nodeEl.firstElementChild;
    if (box) {
      box.style.outline = "2px solid #2563eb";
      box.style.outlineOffset = "-2px";
      box.setAttribute("data-tq-outlined", "1");
    }
    if (pathAttr) {
      const path = pathAttr.split(".").map(Number);
      setSelected(path);
      send({ type: "tq:select", path });
    }
    const container = e2.currentTarget;
    const isBlock = !!pathAttr && pathAttr.includes(".");
    if (isBlock && nodeId) {
      const sectionPath = pathAttr.split(".")[0];
      const sectionEl = container.querySelector(`[data-tq-path="${sectionPath}"]`) ?? nodeEl.parentElement?.closest("[data-tq-section-id]");
      const sectionId = sectionEl?.dataset.tqSectionId;
      if (sectionId) {
        send({ type: "tanqory-block-selected", sectionId, blockId: nodeId });
        return;
      }
    }
    if (nodeId) {
      send({ type: "tanqory-section-selected", sectionId: nodeId });
    }
  };
  return /* @__PURE__ */ jsx("div", { onClickCapture, "data-tq-selected": selected?.join(".") ?? "", children: /* @__PURE__ */ jsx(Shell, { children: /* @__PURE__ */ jsx(SectionTree, { tree }) }) });
}
function defaultsOf(map) {
  return Object.values(map).map((m2) => m2.default);
}
function pickByName(map, name) {
  const hit = Object.entries(map).find(
    ([key]) => key.endsWith(`/${name}.json`) || key.endsWith(`/${name}.tsx`)
  );
  return hit ? hit[1].default : void 0;
}
function mount(opts) {
  registerSections(defaultsOf(opts.sections));
  const shells = opts.shell ? defaultsOf(opts.shell) : [];
  const Shell = shells[0] ?? (({ children }) => /* @__PURE__ */ jsx(Fragment, { children }));
  const pageDoc = pickByName(opts.pages, opts.page ?? "index") ?? { sections: [] };
  const rootEl = document.getElementById(opts.rootId ?? "root");
  if (!rootEl) throw new Error("[tanqory] mount target not found");
  const params = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams();
  const on = (k2) => {
    const v = params.get(k2);
    return v !== null && v !== "false" && v !== "0";
  };
  const previewHost = typeof location !== "undefined" && /^preview-/.test(location.hostname);
  const previewMode = previewHost || on("preview");
  const editMode = on("edit");
  const pagesByName = {};
  for (const [key, mod] of Object.entries(opts.pages)) {
    const name = key.replace(/^.*\//, "").replace(/\.json$/, "");
    pagesByName[name] = mod.default?.sections ?? [];
  }
  const content = previewMode ? /* @__PURE__ */ jsx(PreviewBridge, { pages: pagesByName, initialPage: opts.page ?? "index", Shell }) : editMode ? /* @__PURE__ */ jsx(Editor, { pages: pagesByName, initialPage: opts.page ?? "index" }) : /* @__PURE__ */ jsx(Shell, { children: /* @__PURE__ */ jsx(SectionTree, { tree: pageDoc.sections }) });
  const Root = () => {
    const [data, setData] = React.useState(opts.data);
    React.useEffect(() => {
      if (!opts.revalidate) return;
      let live = true;
      opts.revalidate().then((fresh) => {
        if (live && fresh) setData(fresh);
      }).catch(() => {
      });
      return () => {
        live = false;
      };
    }, []);
    return /* @__PURE__ */ jsx(DataProvider, { value: data, children: /* @__PURE__ */ jsx(ThemeProvider, { settings: opts.settings, locale: opts.locale, children: /* @__PURE__ */ jsx(CartProvider, { children: content }) }) });
  };
  const app = /* @__PURE__ */ jsx(React.StrictMode, { children: /* @__PURE__ */ jsx(Root, {}) });
  const isStorefront = !previewMode && !editMode;
  const hasSSG = rootEl.firstChild != null;
  if (isStorefront && hasSSG && !opts.forceClientRender) {
    hydrateRoot(rootEl, app);
  } else {
    if (hasSSG) rootEl.replaceChildren();
    createRoot(rootEl).render(app);
  }
}
function isBoundSource(v) {
  return typeof v === "object" && v !== null && typeof v["@source"] === "string";
}
const ResourceContext = createContext({});
function DynamicSourceProvider({
  value,
  children
}) {
  return /* @__PURE__ */ jsx(ResourceContext.Provider, { value, children });
}
function useResourceContext() {
  const data = useData();
  const ctx = useContext(ResourceContext);
  return { shop: data.shop, ...ctx };
}
const METAOBJECT_RE = /^metaobject:([^:]+):([^.]+)\.(.+)$/;
function resolveBoundSource(source, ctx) {
  const mo = source.match(METAOBJECT_RE);
  if (mo) {
    const [, type, handle, field] = mo;
    const obj = ctx.metaobject?.(type, handle);
    return obj?.values?.[field] ?? null;
  }
  const parts = source.split(".");
  const root = parts[0];
  const resource = root === "product" ? ctx.product : root === "collection" ? ctx.collection : root === "shop" ? ctx.shop : null;
  if (!resource) return null;
  if (parts[1] === "metafields") {
    const ns = parts[2];
    const key = parts.slice(3).join(".");
    if (!ns || !key) return null;
    return resource.metafields?.[`${ns}.${key}`] ?? null;
  }
  const direct = resource[parts[1]];
  return direct == null ? null : String(direct);
}
function useBound(value) {
  const ctx = useResourceContext();
  if (!isBoundSource(value)) return value;
  return resolveBoundSource(value["@source"], ctx);
}
function useBoundText(value, fallback = "") {
  const resolved = useBound(value);
  if (resolved == null) return fallback;
  return typeof resolved === "string" ? resolved : String(resolved);
}
function collectBoundIdentifiers(nodes) {
  const out = {
    product: [],
    collection: [],
    shop: []
  };
  const seen = /* @__PURE__ */ new Set();
  const visitSettings = (settings) => {
    if (!settings) return;
    for (const v of Object.values(settings)) {
      if (!isBoundSource(v)) continue;
      const parts = v["@source"].split(".");
      const root = parts[0];
      if (parts[1] !== "metafields") continue;
      const namespace = parts[2];
      const key = parts.slice(3).join(".");
      if (!namespace || !key || !(root in out)) continue;
      const dedupe = `${root}:${namespace}.${key}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      out[root].push({ namespace, key });
    }
  };
  const toNodes = (v) => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") return Object.values(v);
    return [];
  };
  const walk = (list) => {
    for (const node of toNodes(list)) {
      visitSettings(node.settings);
      walk(node.blocks);
    }
  };
  walk(nodes);
  return out;
}
function jsxToJSON(node) {
  return Children.toArray(node).flatMap((el) => {
    if (!isValidElement(el)) return [];
    const name = el.type?.blockName;
    if (!name) return [];
    const props = el.props;
    const out = { type: name };
    if (props.settings) out.settings = props.settings;
    const blocks = jsxToJSON(props.children);
    if (blocks.length) out.blocks = blocks;
    return [out];
  });
}
function tag(def) {
  return def.component;
}
export {
  CartProvider,
  DataProvider,
  DynamicSourceProvider,
  Editor,
  SectionTree,
  ThemeProvider,
  allSections,
  collectBoundIdentifiers,
  createAnalytics,
  c as createLiveData,
  b as createLiveDataFromSnapshot,
  d as createMockData,
  e as customerTokenStore,
  defineSection,
  defineSettings,
  defineTheme,
  f as formatDate,
  g as formatMoney,
  h as formatMoneyWithCurrency,
  i as formatMoneyWithoutCurrency,
  j as formatMoneyWithoutTrailingZeros,
  k as formatWeight,
  getAnalytics,
  getConsent,
  getSection,
  hasConsent,
  hasDecided,
  m as imageUrl,
  isBannerRequired,
  isBoundSource,
  jsxToJSON,
  mount,
  onConsentChange,
  registerSections,
  n as renderSectionPreviewHTML,
  o as renderStorefrontHTML,
  resolveBoundSource,
  setBannerRequired,
  setConsent,
  subscribe,
  tag,
  useBound,
  useBoundText,
  u as useCart,
  useData,
  useResourceContext,
  q as useSettings,
  s as useT
};
//# sourceMappingURL=index.js.map
