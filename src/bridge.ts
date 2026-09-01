import type { BridgeResponse, ComponentInspect, DevKitPayload } from "./types";
import { parseBrowserLogs, parseErrors, parseReactTree, parseSnapshot, parseTreeDetail } from "./parse";

export async function inspectComponent(bridgeUrl: string, id: string): Promise<ComponentInspect | { error: string; raw: string }> {
  const result = await fetchBridge(bridgeUrl, `tree ${id}`);
  if (!result.ok && !result.output) {
    return { error: result.error ?? "Inspect failed", raw: "" };
  }
  return parseTreeDetail(result.output || result.error || "");
}

export async function fetchBridge(bridgeUrl: string, command: string): Promise<BridgeResponse> {
  const res = await fetch(bridgeUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ command }),
  });
  if (!res.ok) {
    return { ok: false, command, output: "", error: `HTTP ${res.status}` };
  }
  return (await res.json()) as BridgeResponse;
}

export async function pullFromBridge(bridgeUrl: string): Promise<Partial<DevKitPayload> & { raw?: Record<string, string> }> {
  const commands = ["snapshot", "tree", "errors", "browser-logs"] as const;
  const raw: Record<string, string> = {};
  const payload: Partial<DevKitPayload> = {};
  await Promise.all(
    commands.map(async (command) => {
      const result = await fetchBridge(bridgeUrl, command);
      raw[command] = result.error ? `// ${result.error}\n${result.output}` : result.output;
    }),
  );
  if (raw.snapshot) payload.snapshot = parseSnapshot(raw.snapshot);
  if (raw.tree) payload.tree = parseReactTree(raw.tree);
  if (raw.errors) payload.errors = parseErrors(raw.errors);
  if (raw["browser-logs"]) payload.logs = parseBrowserLogs(raw["browser-logs"]);
  return { ...payload, raw };
}
