"use client";

import { createRoot, type Root } from "react-dom/client";
import { NextDevKit } from "./ui/NextDevKit";
import "./styles.css";

let root: Root | null = null;

function readBridgeUrl() {
  const fromEnv = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_NADK_BRIDGE_URL : "";
  return fromEnv || undefined;
}

export function mountDevKit() {
  if (typeof document === "undefined") return;
  if (process.env.NODE_ENV !== "development") return;
  if (document.querySelector("[data-nadk-root]")) return;

  let host = document.getElementById("nadk-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "nadk-host";
    document.body.appendChild(host);
  }

  root = createRoot(host);
  root.render(<NextDevKit bridgeUrl={readBridgeUrl()} />);
}

export function unmountDevKit() {
  root?.unmount();
  root = null;
  document.getElementById("nadk-host")?.remove();
}
