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

export interface NextDevKitProps {
  /** Force-enable even outside development. Default: only NODE_ENV=development. */
  enabled?: boolean;
  /** Starting tab. */
  defaultTab?: DevKitTab;
  /** Keyboard shortcut. Default Alt+Shift+D. Set false to disable. */
  shortcut?: { alt?: boolean; shift?: boolean; meta?: boolean; key: string } | false;
  /** Optional next-browser HTTP bridge, e.g. \"/api/next-devkit\". */
  bridgeUrl?: string;
  /** Seed data (useful for demos / pasted CLI output). */
  initialPayload?: Partial<DevKitPayload>;
  /** Called when a snapshot ref is selected. */
  onSelectRef?: (ref: string, node: DevTreeNode) => void;
  /** Panel side. */
  placement?: "right" | "left";
  /** Extra class on the host root. */
  className?: string;
}

export interface BridgeResponse {
  ok: boolean;
  command: string;
  output: string;
  error?: string;
}
