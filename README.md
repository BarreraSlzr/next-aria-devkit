# next-aria-devkit

Drop-in Next.js development FAB that visualizes **Vercel `next-browser`** output — accessibility **snapshot**, React **tree**, **errors**, and **browser-logs** — with React Aria’s hierarchical tree (the NavigationTree-style sidebar from [react-aria-components 1.21](https://react-aria.adobe.com/releases/v1-21-0)).

Zero production cost: the host returns `null` unless `NODE_ENV === "development"` (or you pass `enabled`).

## Install

```bash
pnpm add -D next-aria-devkit react-aria-components
```

From GitHub while unpublished:

```bash
pnpm add -D github:BarreraSlzr/next-aria-devkit react-aria-components
```

Tell Next to transpile the package:

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["next-aria-devkit"],
};

export default nextConfig;
```

## Plug into any App Router project

```tsx
// app/layout.tsx
import { NextDevKit } from "next-aria-devkit";
import "next-aria-devkit/styles.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <NextDevKit />
      </body>
    </html>
  );
}
```

That’s it. In `next dev` you get a FAB in the bottom-right corner.

| Action | Shortcut |
| --- | --- |
| Toggle panel | `Alt+Shift+D` |
| Capture live a11y tree from the current document | **Live** |
| Pull `next-browser` CLI via optional API route | **Bridge** |
| Parse pasted CLI text | **Parse paste** |

Selecting a snapshot node with a `[ref=eN]` highlights the matching element on the page.

## Optional: next-browser bridge

`next-browser` is a CLI daemon (`@vercel/next-browser`). There is no public HTTP API, so the kit includes a **dev-only** App Router handler that shells out to allowed commands: `snapshot`, `tree`, `errors`, `logs`, `browser-logs`, `network`.

```ts
// app/api/next-devkit/route.ts
export { POST } from "next-aria-devkit/route";
```

```tsx
<NextDevKit bridgeUrl="/api/next-devkit" />
```

Prereqs:

```bash
pnpm add -g @vercel/next-browser
playwright install chromium
next-browser open http://localhost:3000
```

You can always paste CLI output into the Snapshot tab instead of wiring the bridge.

## Props

```ts
<NextDevKit
  enabled                // default: NODE_ENV === "development"
  defaultTab="snapshot"  // snapshot | tree | errors | logs
  placement="right"
  bridgeUrl="/api/next-devkit"
  shortcut={{ alt: true, shift: true, key: "d" }}
  onSelectRef={(ref, node) => console.log(ref, node)}
  initialPayload={{ snapshot, tree, errors, logs }}
/>
```

## What it continues from

The Grok thread started from Devon Govett’s React Aria 1.21 **NavigationTree** release and the idea of treating Vercel `next-browser` (`snapshot` / `tree` / `errors` / `browser-logs`) as the data source for a Next.js **dev FAB**.

This package is that idea as a reusable repo:

1. Live DOM walker → same shape as `next-browser snapshot`
2. Parsers for official CLI text
3. Optional CLI bridge
4. Console + `window.onerror` probes for logs/errors
5. React Aria `Tree` / `TreeItem` navigation sidebar inside a Dialog

## Package exports

| Import | Purpose |
| --- | --- |
| `next-aria-devkit` | `<NextDevKit />`, parsers, types |
| `next-aria-devkit/styles.css` | Isolated `.nadk-*` styles |
| `next-aria-devkit/route` | Dev-only `POST` handler |

## License

MIT
