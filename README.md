# next-aria-devkit

Drop-in Next.js development FAB that visualizes Vercel `next-browser` output — snapshot, React tree, `tree <id>` inspector, errors, and browser-logs — with React Aria hierarchical navigation.

## Install

```bash
pnpm add -D github:BarreraSlzr/next-aria-devkit react-aria-components
```

## Fastest path: next.config plugin (no layout import)

Next.js 16.3+ injects client instrumentation:

```ts
import { withNextAriaDevkit } from "next-aria-devkit/plugin";

export default withNextAriaDevkit(
  { /* existing config */ },
  { bridgeUrl: "/api/next-devkit" },
);
```

The wrapper adds `transpilePackages`, sets `NEXT_PUBLIC_NADK_BRIDGE_URL`, and appends `next-aria-devkit/inject` to `instrumentationClientInject`.

Next.js < 16.3: keep the plugin, plus one line:

```ts
// instrumentation-client.ts
import "next-aria-devkit/inject";
```

Or drop `<NextDevKit />` in `app/layout.tsx`.

`Alt+Shift+D` toggles the panel. Snapshot nodes highlight `[ref=eN]`. Tree nodes inspect `tree <id>` (props, hooks, source).

## Bridge

```ts
// app/api/next-devkit/route.ts
export { POST } from "next-aria-devkit/route";
```

```bash
pnpm add -g @vercel/next-browser
playwright install chromium
next-browser open http://localhost:3000
```

## Exports

- `next-aria-devkit` — UI, parsers, mount
- `next-aria-devkit/plugin` — `withNextAriaDevkit()`
- `next-aria-devkit/inject` — auto-mount bootstrap
- `next-aria-devkit/styles.css`
- `next-aria-devkit/route` — dev-only POST handler

MIT
