# @internetfriends/next-aria-devkit

Drop-in Next.js dev FAB for Vercel `next-browser` — snapshot, React tree, `tree <id>` inspector, errors, browser-logs — plus a live **daemon status chip**, **Apple fm chat**, and a **Jev development vector**.

## Install

```bash
pnpm add -D github:BarreraSlzr/next-aria-devkit react-aria-components
```

After publish:

```bash
pnpm add -D @internetfriends/next-aria-devkit react-aria-components
```

## Plug in (no layout import on Next 16.3+)

```ts
import { withNextAriaDevkit } from "@internetfriends/next-aria-devkit/plugin";

export default withNextAriaDevkit({}, { bridgeUrl: "/api/next-devkit" });
```

```ts
// app/api/next-devkit/route.ts
export { GET, POST } from "@internetfriends/next-aria-devkit/route";
```

Next < 16.3: also add `import "@internetfriends/next-aria-devkit/inject"` in `instrumentation-client.ts`.

`GET /api/next-devkit` probes `next-browser` and `fm serve`:
- **daemon live** — CLI + session up
- **daemon down** — CLI installed, run `next-browser open http://localhost:3000`
- **no CLI** — install `@vercel/next-browser`
- **no bridge** — route not mounted

`Alt+Shift+D` toggles the panel. Tree clicks run `tree <id>`.

## Apple fm + Jev (v0.4)

macOS:

```bash
fm serve --host 127.0.0.1 --port 1976
```

The **FM** tab talks to the on-device Foundation Model with the current `InspectionContext` (route, selected ref/component, snapshot/tree/errors/logs). The **Vector** tab asks TypeSafe Jev — or an fm JSON-schema fallback — for `area / severity / action / worthFixing`.

Optional cloud path:

```bash
pnpm add ai
# AI_GATEWAY_API_KEY or TYPESAFE_AI_API_KEY
```

Plugin option: `fmBaseUrl` (default `http://127.0.0.1:1976`) sets `NADK_FM_BASE_URL`.

Direct imports:

```ts
import { fmChat, fmStatus } from "@internetfriends/next-aria-devkit/fm";
import { evaluateVector } from "@internetfriends/next-aria-devkit/jev";
```

## Publish

```bash
npm login
npm publish --access public
```

MIT
