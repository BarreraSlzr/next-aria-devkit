export type DevKitTab = "snapshot" | "tree" | "errors" | "logs" | "fm" | "vector";
export type LogLevel = "log" | "info" | "warn" | "error" | "debug";
export type TreeKind = "generic" | "role" | "link" | "button" | "heading" | "component" | "section" | "error" | "log";
export type DaemonState = "unknown" | "missing-bridge" | "no-cli" | "daemon-down" | "live";

export interface InspectionContext {
  kit: "next-aria-devkit@0.4";
  route?: string;
  capturedAt: string;
  selection?: { kind: "snapshot-ref" | "component" | "error" | "log"; id: string };
  snapshot?: string;
  tree?: string;
  errors?: string;
  browserLogs?: string;
}

export interface FmStatus {
  ok: boolean;
  platform: NodeJS.Platform | string;
  endpoint: string;
  hint?: string | null;
}

export interface DevVector {
  source: "jev" | "fm-schema" | "unavailable";
  area: "performance" | "ux" | "ui" | "a11y" | "data" | "infra" | "unknown";
  severity: number;
  action: "measure" | "fix-now" | "defer" | "ask-user" | "unknown";
  worthFixing: number;
  direction: string;
}

export interface DaemonStatus {
  ok: boolean;
  state: DaemonState;
  cliInstalled?: boolean;
  daemon?: boolean;
  version?: string | null;
  hint?: string | null;
  nextBrowser?: {
    state: DaemonState;
    daemon?: boolean;
    version?: string | null;
  };
  fm?: FmStatus;
}

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
