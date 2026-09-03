import type { BridgeResponse, ComponentInspect, DaemonStatus, DevKitPayload } from "./types";
import { parseBrowserLogs, parseErrors, parseReactTree, parseSnapshot, parseTreeDetail } from "./parse";

export async function fetchBridge(bridgeUrl, command) {
  const res = await fetch(bridgeUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ command }),
  });
  if (!res.ok) return { ok: false, command, output: "", error: `HTTP ${res.status}` };
  return res.json();
}

export async function fetchDaemonStatus(bridgeUrl) {
  try {
    const res = await fetch(bridgeUrl, { method: "GET" });
    if (!res.ok) return { ok: false, state: "daemon-down", hint: `HTTP ${res.status}` };
    return res.json();
  } catch (error) {
    return { ok: false, state: "daemon-down", hint: error instanceof Error ? error.message : "Bridge unreachable" };
  }
}

export async function inspectComponent(bridgeUrl, id) {
  const result = await fetchBridge(bridgeUrl, `tree ${id}`);
  if (!result.ok && !result.output) return { error: result.error ?? "Inspect failed", raw: "" };
  return parseTreeDetail(result.output || result.error || "");
}

export async function pullFromBridge(bridgeUrl) {
  const commands = ["snapshot", "tree", "errors", "browser-logs"];
  const raw = {};
  const payload = {};
  await Promise.all(commands.map(async (command) => {
    const result = await fetchBridge(bridgeUrl, command);
    raw[command] = result.error ? `// ${result.error}\n${result.output}` : result.output;
  }));
  if (raw.snapshot) payload.snapshot = parseSnapshot(raw.snapshot);
  if (raw.tree) payload.tree = parseReactTree(raw.tree);
  if (raw.errors) payload.errors = parseErrors(raw.errors);
  if (raw["browser-logs"]) payload.logs = parseBrowserLogs(raw["browser-logs"]);
  return { ...payload, raw };
}
