/**
 * Optional App Router handler that shells out to the next-browser CLI.
 *
 * app/api/next-devkit/route.ts
 *   export { POST } from "next-aria-devkit/route";
 *
 * Then pass bridgeUrl="/api/next-devkit" to <NextDevKit />.
 *
 * Dev-only. Requires `@vercel/next-browser` on PATH and a running daemon
 * (`next-browser open http://localhost:3000`).
 */

const ALLOWED = new Set(["snapshot", "tree", "errors", "logs", "browser-logs", "network"]);

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ ok: false, error: "Disabled outside development" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { command?: string } | null;
  const command = (body?.command ?? "snapshot").trim();
  const args = command.split(/\s+/).filter(Boolean);
  const bin = args[0] ?? "";
  if (!ALLOWED.has(bin)) {
    return Response.json({ ok: false, command, output: "", error: `Command not allowed: ${command}` }, { status: 400 });
  }

  try {
    const { execFile } = await import("node:child_process");
    const output = await new Promise<string>((resolve, reject) => {
      execFile("next-browser", args, { timeout: 15_000 }, (error, stdout, stderr) => {
        if (error && !stdout) reject(new Error(stderr || error.message));
        else resolve(String(stdout || stderr || ""));
      });
    });
    return Response.json({ ok: true, command, output });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json(
      {
        ok: false,
        command,
        output: "",
        error: `${message}. Install with \`pnpm add -g @vercel/next-browser\` and run \`next-browser open http://localhost:3000\`.`,
      },
      { status: 500 },
    );
  }
}
