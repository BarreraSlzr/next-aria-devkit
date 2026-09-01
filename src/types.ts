export type DevKitTab = "snapshot" | "tree" | "errors" | "logs";
export type LogLevel = "log" | "info" | "warn" | "error" | "debug";
export type TreeKind =
  | "generic"
  | "role"
  | "link"
  | "button"
  | "heading"
  | "component"
  | "section"
  | "error"
  | "log";

export interface DevTreeNode {
  id: string;
  title: string;
  kind?: TreeKind;
  ref?: string;
  meta?: string;
  href?: string;
  source?: string;
  selected?: boolean;
  children?: DevTreeNode[];
}

export interface DevLogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: number;
  source?: string;
}

export interface DevErrorEntry {
  id: string;
  title: string;
  message: string;
  stack?: string;
  source?: string;
  timestamp: number;
}

export interface DevKitPayload {
  snapshot: DevTreeNode[];
  tree: DevTreeNode[];
  errors: DevErrorEntry[];
  logs: DevLogEntry[];
}

export interface ComponentInspect {
  id: string;
  name: string;
  path?: string;
  source?: string;
  props: Record<string, string>;
  hooks: Array<{ name: string; value: string }>;
  raw: string;
}

export interface NextDevKitProps {
  enabled?: boolean;
  defaultTab?: DevKitTab;
  shortcut?: { alt?: boolean; shift?: boolean; meta?: boolean; key: string } | false;
  bridgeUrl?: string;
  initialPayload?: Partial<DevKitPayload>;
  onSelectRef?: (ref: string, node: DevTreeNode) => void;
  placement?: "right" | "left";
  className?: string;
}

export interface BridgeResponse {
  ok: boolean;
  command: string;
  output: string;
  error?: string;
}
