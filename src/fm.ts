import type { FmStatus } from "./types";

export const FM_BIN = process.env.FM_BIN ?? "/usr/bin/fm";
export const FM_BASE = process.env.NADK_FM_BASE_URL ?? "http://127.0.0.1:1976";

export async function fmStatus(): Promise<FmStatus> {
  if (process.platform !== "darwin") {
    return { ok: false, platform: process.platform, endpoint: FM_BASE, hint: "fm is macOS-only" };
  }
  try {
    const res = await fetch(`${FM_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    return {
      ok: res.ok,
      platform: "darwin",
      endpoint: FM_BASE,
      hint: res.ok ? null : `Start with: ${FM_BIN} serve --host 127.0.0.1 --port 1976`,
    };
  } catch {
    return { ok: false, platform: "darwin", endpoint: FM_BASE, hint: "fm serve not running on :1976" };
  }
}

export async function fmChat(messages: { role: string; content: string }[]) {
  const res = await fetch(`${FM_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: "system", stream: false, messages }),
  });
  if (!res.ok) throw new Error(`fm serve ${res.status}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return String(json.choices?.[0]?.message?.content ?? "");
}
