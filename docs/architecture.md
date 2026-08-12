# Press Architecture

## Bootstrap

Every press app is a Solid component tree started by `mountTUI` from `@ahokinson/press/terminal`. There is no `index.html` — the renderer owns the terminal.

Mount through press rather than calling `render` from `@opentui/solid` directly. `render` resolves to `void`, so it hands back no renderer to stop, and it leaves the debug console enabled — the console opens on the first error, renders *focused*, and from then on swallows every keystroke while the app carries on painting. Both failures look like a hang.

```ts
// src/app.tsx
import { useKeyboard } from "@opentui/solid"
import { mountTUI } from "@ahokinson/press/terminal"
import { onMount } from "solid-js"
import { ThemeProvider } from "@ahokinson/press/theme"
import { composeKeymap, matchKey } from "@ahokinson/press/keyboard"
import { createDataLoader } from "@ahokinson/press/models"

function App() {
  const loader = createDataLoader({ fetch: (sig) => fetchItems(sig) })
  onMount(() => loader.load())

  const handler = composeKeymap([{
    handler: (e) => {
      if (matchKey(e, { name: "q" })) { process.exit(0); return true }
      return false
    },
  }])
  useKeyboard(handler)

  return (
    <ThemeProvider>
      {/* your layout here */}
    </ThemeProvider>
  )
}

await mountTUI(() => <App />)
```

`useKeyboard` is from `@opentui/solid` and `onMount` from `solid-js`; do not import `useKeyboard` from press. Mounting is the exception — that comes from `@ahokinson/press/terminal`.

`mountTUI` returns the renderer and leaves it running, which suits an app that exits from inside a key handler. When something has to happen *after* the TUI — handing the terminal to another process, printing a result, choosing an exit code — use `runTUI` instead: it waits for a `finish` callback, stops the renderer, and resolves with whatever `finish` was given. Stopping is not exiting; call `process.exit` once it resolves if you mean to quit.

## Build

Apps must compile JSX through the opentui Solid plugin. With Bun:

```ts
// build.ts
import { createSolidTransformPlugin } from "@opentui/solid/bun-plugin"

await Bun.build({
  entrypoints: ["src/app.tsx"],
  outdir: "dist",
  target: "bun",
  format: "esm",
  plugins: [createSolidTransformPlugin()],
})
```

Run with `bun dist/app.js`. You can also skip the build step and run source directly with `bun --bun src/app.tsx` if you configure the plugin in `bunfig.toml`.

`tsconfig.json` must have:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@opentui/solid"
  }
}
```

## Three-layer rule

Always build in this order: **model → signal → component**.

1. **Models** (`@ahokinson/press/models`) — headless state factories. Pure TypeScript, no JSX. Create at app root or in a parent scope, then pass state down as props.
2. **Signals** (`@ahokinson/press/signals`) — reactive scroll sync, cursor, cycling. Used by models internally and by callers for scroll wiring.
3. **Components** (`@ahokinson/press/components`) — Solid JSX renderers. Accept model state via accessor props. Never own state.

## What lives where

| Concern | Layer |
|---|---|
| Navigation cursor | Model or Signal (`createNavigationCursor`) |
| Async data fetch | Model (`createDataLoader`) |
| Keyboard bindings | App/screen scope via `composeKeymap` |
| Scroll position | Signal (`createScrollboxSync`) |
| Focus routing | Model (`createFocusRing`) |
| Rendering rows | Component |
| Theme tokens | `useTheme()` inside components |

## Data flow

```
App root
  createDataLoader / createFilterableListState / ...  ← models created here
  composeKeymap([...layers])                          ← keyboard wired here
  useKeyboard(handler)
  return (
    <ThemeProvider>
      <MyListPane items={list.visibleItems} cursor={list.cursor} />
    </ThemeProvider>
  )
```

Components receive accessor props (`items: () => T[]`, `cursor: () => number`) and call them reactively inside JSX. They never create signals or own business logic.

## Module import paths

| Import path | Contents |
|---|---|
| `@ahokinson/press/models` | All model factories |
| `@ahokinson/press/signals` | `createNavigationCursor`, `createScrollboxSync`, `createCycler`, `cumulativeOffsets` |
| `@ahokinson/press/components` | All JSX components |
| `@ahokinson/press/keyboard` | `composeKeymap`, `matchKey`, `handleTextInput`, `dispatchBindings`, `bindingHints` |
| `@ahokinson/press/theme` | `ThemeProvider`, `useTheme`, `makeTheme`, `createTheme`, `BOLD`, `UNDERLINE`, `ITALIC` |
| `@ahokinson/press/terminal` | `createScreenStack`, `createResponsiveRouter`, `createTerminalHandover` |
| `@ahokinson/press/async` | Polling controller, stale/coalesce guards |
| `@ahokinson/press/format` | `padLeft`, `padRight`, truncate, compact numbers, relative time |
| `@ahokinson/press/icons` | Nerd Font glyph constants |
| `@ahokinson/press/io` | Atomic file write, JSON load/save with zod |
| `@ahokinson/press/markdown` | `Markdown` component |
| `@ahokinson/press/charts` | Braille sparkline, chart element |
| `@ahokinson/press/clipboard` | `copy(text)` |
| `@ahokinson/press/context` | `createRequiredContext` |
| `@ahokinson/press/link` | `<Link>`, `wrapOsc8` |
