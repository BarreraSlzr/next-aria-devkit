const ALLOWED = new Set(["snapshot", "tree", "errors", "logs", "browser-logs", "network"]);

function run(args, timeout = 8000) {
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

  const { fmStatus } = await import("./fm");
  const fm = await fmStatus();

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
      nextBrowser: { state: "no-cli", daemon: false, version: null },
      fm,
    });
  }

  const probe = await run(["snapshot"], 6000);
  const combined = `${probe.stderr}\n${probe.stdout}`;
  const daemon = probe.ok && !/not running|no browser|could not connect/i.test(combined);
  const state = daemon ? "live" : "daemon-down";

  return Response.json({
    ok: daemon,
    state,
    cliInstalled: true,
    daemon,
    version: cliVersion,
    hint: daemon ? null : "Run `next-browser open http://localhost:3000`",
    nextBrowser: { state, daemon, version: cliVersion },
    fm,
  });
}

export async function POST(request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ ok: false, error: "Disabled outside development" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const command = String(body?.command ?? "snapshot").trim();

  if (command === "fm-chat") {
    const { fmChat, fmStatus } = await import("./fm");
    const status = await fmStatus();
    if (!status.ok) return Response.json({ ok: false, command, output: "", error: status.hint }, { status: 503 });
    try {
      const output = await fmChat(body.messages ?? []);
      return Response.json({ ok: true, command, output });
    } catch (error) {
      return Response.json({
        ok: false,
        command,
        output: "",
        error: error instanceof Error ? error.message : String(error),
      }, { status: 500 });
    }
  }

  if (command === "vector") {
    const { evaluateVector } = await import("./jev");
    try {
      const output = await evaluateVector(body.context);
      return Response.json({ ok: true, command, output: JSON.stringify(output) });
    } catch (error) {
      return Response.json({
        ok: false,
        command,
        output: "",
        error: error instanceof Error ? error.message : String(error),
      }, { status: 500 });
    }
  }

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
