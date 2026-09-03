"use client";

import type { DaemonStatus } from "../types";

const LABEL: Record<string, string> = {
  unknown: "checking",
  "missing-bridge": "no bridge",
  "no-cli": "no CLI",
  "daemon-down": "daemon down",
  live: "daemon live",
};

export function StatusChip({ status }: { status: DaemonStatus }) {
  return (
    <span className="nadk-chip" data-state={status.state} title={status.hint ?? status.version ?? status.state}>
      <span className="nadk-chip-dot" />
      {LABEL[status.state] ?? status.state}
      {status.version && status.state === "live" ? <span className="nadk-chip-ver">{status.version}</span> : null}
    </span>
  );
}
