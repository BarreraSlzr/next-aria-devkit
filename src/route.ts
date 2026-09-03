const ALLOWED = new Set(["snapshot", "tree", "errors", "logs", "browser-logs", "network"]);

function run(args: string[], timeout = 8000) {
  return import("node:child_process").then(
    ({ execFile }) =>
      new Promise((resolve) => {
        execFile("next-browser", args, { timeout }, (error, stdout, stderr) => {
          resolve({
            ok: !error || Boolean(stdout),
            stdout: String(stdout || ""),
            stderr: String(stderr || ""),
            code: error && "code" in error ? Number(error.code ?? 1) : 0,
          });
        });
      }),
  );
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ ok: false, error: "Disabled outside development" }, { status: 403 });
  }
  const version = await run(["--version"], 4000);
  const cliInstalled = version.ok || Boolean(version.stdout.trim());
  const cliVersion = (version.stdout || version.stderr).trim().split("\n")[0] || null;
  if (!cliInstalled) {
    return Response.json({
      ok: false,
      state: "no-cli",
      cliInstalled: false,
      daemon: false,
      version: null,
      hint: "pnpm add -g @vercel/next-browser && playwright install chromium",
    });
  }
  const probe = await run(["snapshot"], 6000);
  const combined = `${probe.stderr}\n${probe.stdout}`;
  const daemon = probe.ok && !/not running|no browser|could not connect/i.test(combined);
  return Response.json({
    ok: daemon,
    state: daemon ? "live" : "daemon-down",
    cliInstalled: true,
    daemon,
    version: cliVersion,
    hint: daemon ? null : "Run `next-browser open http://localhost:3000`",
  });
}

export async function POST(request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ ok: false, error: "Disabled outside development" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const command = (body?.command ?? "snapshot").trim();
  const args = command.split(/\s+/).filter(Boolean);
  const bin = args[0] ?? "";
  if (!ALLOWED.has(bin)) {
    return Response.json({ ok: false, command, output: "", error: `Command not allowed: ${command}` }, { status: 400 });
  }
  try {
    const result = await run(args, 15000);
    if (!result.ok && !result.stdout) throw new Error(result.stderr || `next-browser exited ${result.code}`);
    return Response.json({ ok: true, command, output: result.stdout || result.stderr });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({
      ok: false,
      command,
      output: "",
      error: `${message}. Install with pnpm add -g @vercel/next-browser and run next-browser open http://localhost:3000.`,
    }, { status: 500 });
  }
}
