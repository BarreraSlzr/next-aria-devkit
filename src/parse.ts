import type { ComponentInspect, DevErrorEntry, DevLogEntry, DevTreeNode } from "./types";

let seq = 0;
const nid = (prefix: string) => `${prefix}-${++seq}`;

export function parseSnapshot(text: string): DevTreeNode[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim());
  const root: DevTreeNode[] = [];
  const stack: { indent: number; node: DevTreeNode }[] = [];
  for (const raw of lines) {
    const indent = raw.match(/^\s*/)?.[0].length ?? 0;
    const line = raw.trim().replace(/^-\s*/, "");
    const ref = line.match(/\[ref=([^\]]+)\]/)?.[1];
    const selected = /\(selected\)/.test(line);
    const quoted = line.match(/^([a-zA-Z0-9_-]+)\s+"([^"]+)"/);
    const roleOnly = line.match(/^([a-zA-Z0-9_-]+)\b/);
    const role = quoted?.[1] ?? roleOnly?.[1] ?? "node";
    const name = quoted?.[2];
    const node: DevTreeNode = {
      id: nid("snap"),
      title: name ? `${role} "${name}"` : role,
      kind: role === "link" || role === "button" || role === "heading" ? (role as DevTreeNode["kind"]) : "role",
      ref,
      selected,
      meta: [ref ? `#${ref}` : null, selected ? "selected" : null].filter(Boolean).join(" · ") || undefined,
      children: [],
    };
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    if (!stack.length) root.push(node);
    else {
      const parent = stack[stack.length - 1].node;
      parent.children = parent.children ?? [];
      parent.children.push(node);
    }
    stack.push({ indent, node });
  }
  return root;
}

export function parseReactTree(text: string): DevTreeNode[] {
  const byId = new Map<string, DevTreeNode>();
  const roots: DevTreeNode[] = [];
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("path:") || line.startsWith("props:") || line.startsWith("hooks:")) continue;
    const m = line.match(/^(\d+)\s+(\d+)(?:\s+(\d+))?\s+-?\s*(.+)$/);
    if (!m) continue;
    const [, , id, parentId, name] = m;
    const node: DevTreeNode = { id: `comp-${id}`, title: name.trim(), kind: "component", meta: `#${id}`, children: [] };
    byId.set(id, node);
    if (parentId && byId.has(parentId)) byId.get(parentId)!.children!.push(node);
    else roots.push(node);
  }
  return roots;
}

export function parseErrors(text: string): DevErrorEntry[] {
  if (!text.trim()) return [];
  return text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean).map((block, i) => {
    const [first, ...rest] = block.split("\n");
    return { id: `err-${i}`, title: first.slice(0, 140), message: rest.join("\n") || first, stack: rest.join("\n") || undefined, timestamp: Date.now() };
  });
}

export function parseBrowserLogs(text: string): DevLogEntry[] {
  if (!text.trim()) return [];
  return text.split("\n").map((line) => line.trim()).filter(Boolean).map((line, i) => {
    const raw = (line.match(/\b(error|warn|warning|info|debug|log)\b/i)?.[1] ?? "log").toLowerCase();
    const level = (raw === "warning" ? "warn" : raw) as DevLogEntry["level"];
    return { id: `blog-${i}`, level: ["log", "info", "warn", "error", "debug"].includes(level) ? level : "log", message: line, timestamp: Date.now() };
  });
}

export function parseTreeDetail(text: string): ComponentInspect {
  const inspect: ComponentInspect = { id: "", name: "Component", props: {}, hooks: [], raw: text.trim() };
  let section: "none" | "props" | "hooks" = "none";
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (/^path:/i.test(trimmed)) { inspect.path = trimmed.replace(/^path:\s*/i, ""); section = "none"; continue; }
    if (/^source:/i.test(trimmed)) { inspect.source = trimmed.replace(/^source:\s*/i, ""); section = "none"; continue; }
    if (/^props:/i.test(trimmed)) { section = "props"; continue; }
    if (/^hooks:/i.test(trimmed)) { section = "hooks"; continue; }
    const header = trimmed.match(/^(.+?)\s+#(\d+)\s*$/);
    if (header && section === "none") { inspect.name = header[1].trim(); inspect.id = header[2]; continue; }
    const kv = trimmed.match(/^([^:]+):\s*(.*)$/);
    if (section === "props" && kv) inspect.props[kv[1].trim()] = kv[2];
    if (section === "hooks" && kv) inspect.hooks.push({ name: kv[1].trim(), value: kv[2] });
  }
  return inspect;
}

export function componentIdFromNode(node: DevTreeNode): string | null {
  return node.meta?.match(/#(\d+)/)?.[1] ?? node.id.match(/(?:comp-)?(\d+)/)?.[1] ?? null;
}

export function flattenTree(nodes: DevTreeNode[]): DevTreeNode[] {
  const out: DevTreeNode[] = [];
  const walk = (list: DevTreeNode[]) => { for (const n of list) { out.push(n); if (n.children?.length) walk(n.children); } };
  walk(nodes);
  return out;
}
