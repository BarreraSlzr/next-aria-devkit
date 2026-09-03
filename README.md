# @internetfriends/next-aria-devkit

Drop-in Next.js dev FAB for Vercel `next-browser` — snapshot, React tree, `tree <id>` inspector, errors, browser-logs — plus a live **daemon status chip**.

## Install

Until npm publish (needs an `@internetfriends` org token):

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

`GET /api/next-devkit` probes `next-browser --version` then `snapshot`:
- **daemon live** — CLI + session up
- **daemon down** — CLI installed, run `next-browser open http://localhost:3000`
- **no CLI** — install `@vercel/next-browser`
- **no bridge** — route not mounted

`Alt+Shift+D` toggles the panel. Tree clicks run `tree <id>`.

## Publish

```bash
npm login
npm publish --access public
```

Requires membership on the `internetfriends` npm org (or change `name` in package.json).

MIT
