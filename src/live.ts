import type { DevErrorEntry, DevLogEntry, DevTreeNode } from "./types";

const INTERACTIVE = new Set(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "SUMMARY"]);

function visible(el: Element) {
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 || r.height > 0;
}

function roleOf(el: Element) {
  return (
    el.getAttribute("role") ||
    (el.tagName === "A" ? "link" : null) ||
    (el.tagName === "BUTTON" ? "button" : null) ||
    (el.tagName === "NAV" ? "navigation" : null) ||
    (el.tagName === "MAIN" ? "main" : null) ||
    (el.tagName === "HEADER" ? "banner" : null) ||
    (el.tagName === "FOOTER" ? "contentinfo" : null) ||
    (/^H[1-6]$/.test(el.tagName) ? "heading" : null) ||
    (el.tagName === "UL" || el.tagName === "OL" ? "list" : null) ||
    el.tagName.toLowerCase()
  );
}

function nameOf(el: Element) {
  return (
    el.getAttribute("aria-label") ||
    el.getAttribute("title") ||
    (el instanceof HTMLInputElement ? el.placeholder || el.name : "") ||
    el.textContent?.replace(/\s+/g, " ").trim().slice(0, 80) ||
    ""
  );
}

export function captureLiveSnapshot(root: ParentNode = document.body, ignoreSelector = "[data-nadk-root]"): DevTreeNode[] {
  let ref = 0;
  const walk = (parent: Element): DevTreeNode[] => {
    const nodes: DevTreeNode[] = [];
    for (const child of Array.from(parent.children)) {
      if (child.matches(ignoreSelector) || child.closest(ignoreSelector)) continue;
      if (!visible(child)) continue;
      const role = roleOf(child);
      const name = nameOf(child);
      const interactive =
        INTERACTIVE.has(child.tagName) ||
        child.hasAttribute("tabindex") ||
        ["link", "button", "tab", "menuitem", "checkbox", "radio"].includes(role);
      const interesting =
        interactive ||
        ["navigation", "main", "banner", "contentinfo", "heading", "tablist", "tab", "dialog"].includes(role) ||
        child.children.length > 0;
      if (!interesting) continue;
      const idRef = interactive ? `e${ref++}` : undefined;
      if (idRef) child.setAttribute("data-nadk-ref", idRef);
      const kids = walk(child);
      nodes.push({
        id: `live-${role}-${idRef ?? nodes.length}-${name.slice(0, 12)}`,
        title: name ? `${role} "${name}"` : role,
        kind: role === "link" || role === "button" || role === "heading" ? role : "role",
        ref: idRef,
        meta: idRef ? `#${idRef}` : undefined,
        href: child instanceof HTMLAnchorElement ? child.getAttribute("href") ?? undefined : undefined,
        children: kids,
      });
    }
    return nodes;
  };
  const host = root instanceof Element ? root : document.body;
  return walk(host);
}

export function highlightRef(ref: string | null) {
  document.querySelectorAll("[data-nadk-highlight]").forEach((el) => el.removeAttribute("data-nadk-highlight"));
  if (!ref) return;
  const el = document.querySelector(`[data-nadk-ref="${CSS.escape(ref)}"]`);
  if (el instanceof HTMLElement) {
    el.setAttribute("data-nadk-highlight", "true");
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

type ConsoleFn = (...args: unknown[]) => void;

export function installLogProbe(onLog: (entry: DevLogEntry) => void, onError: (entry: DevErrorEntry) => void) {
  if (typeof window === "undefined") return () => {};
  const levels: Array<keyof Console> = ["log", "info", "warn", "error", "debug"];
  const originals = new Map<string, ConsoleFn>();
  for (const level of levels) {
    const original = (console[level] as ConsoleFn | undefined) ?? console.log;
    originals.set(level, original);
    (console as unknown as Record<string, ConsoleFn>)[level] = (...args: unknown[]) => {
      original.apply(console, args);
      const message = args.map((a) => {
        if (typeof a === "string") return a;
        try { return JSON.stringify(a); } catch { return String(a); }
      }).join(" ");
      onLog({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        level: level === "warn" ? "warn" : (level as DevLogEntry["level"]),
        message,
        timestamp: Date.now(),
      });
    };
  }
  const onWindowError = (event: ErrorEvent) => {
    onError({
      id: `err-${Date.now()}`,
      title: event.message || "Runtime error",
      message: event.message,
      source: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined,
      stack: event.error instanceof Error ? event.error.stack : undefined,
      timestamp: Date.now(),
    });
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    onError({
      id: `rej-${Date.now()}`,
      title: "Unhandled rejection",
      message,
      stack: reason instanceof Error ? reason.stack : undefined,
      timestamp: Date.now(),
    });
  };
  window.addEventListener("error", onWindowError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    for (const [level, fn] of originals) {
      (console as unknown as Record<string, ConsoleFn>)[level] = fn;
    }
    window.removeEventListener("error", onWindowError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}

export const SAMPLE_SNAPSHOT = `- navigation "Main"
  - link "Home" [ref=e0]
  - link "Dashboard" [ref=e1]
- main
  - heading "Settings"
  - tablist
    - tab "General" [ref=e2] (selected)
    - tab "Security" [ref=e3]
  - button "Save" [ref=e4]
- contentinfo
  - link "Docs" [ref=e5]`;

export const SAMPLE_TREE = `0 1 - Root
1 2 1 HeadManagerContext.Provider
2 3 2 AppRouter
3 4 3 Layout
4 5 4 NextDevKitHost
5 6 3 Page
6 7 6 Heading
7 8 6 SettingsForm
8 9 8 TokenField`;

export const SAMPLE_TREE_DETAIL = `path: Root > HeadManagerContext.Provider > AppRouter > Layout > Page > SettingsForm
SettingsForm #8
props:
  title: "Settings"
  children: [<TokenField />, <Button />]
hooks:
  FormState: { dirty: false } (1 sub)
  Router: undefined (2 sub)
source: app/settings/form.tsx:24:8`;
