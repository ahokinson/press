# press

[![CI](https://github.com/ahokinson/press/actions/workflows/test.yml/badge.svg)](https://github.com/ahokinson/press/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/ahokinson/press/branch/develop/graph/badge.svg)](https://codecov.io/gh/ahokinson/press)

A toolkit for building terminal apps that look and feel good. Solid's reactivity, opentui's renderer, and the layer between them you'd otherwise write yourself.

## Why this exists

Nothing else looked right. Press is for people who care how the terminal feels.

## What's in the box

Each module is a separate import path; pull only what you use.

- **`press/theme`** — Catppuccin-based palette, a Solid `ThemeProvider`, and a `useTheme` hook. Build custom themes with `createTheme` / `makeTheme`.
- **`press/components`** — Rendered building blocks: atoms (Badge, Empty, Highlight, Progress, RangeBar, Skeleton, Spinner, Truncated), containers (Card, Header, List, Pane, Section, Sections, Separated, Table, scrollbox helpers), controls (Field, InputBar), and feedback surfaces (Banner, Callout, ConfirmDialog, Json, StatusBar).
- **`press/models`** — Headless state machines for recurring UI shapes: confirm dialogs, hierarchical navigation, status lines, collapsible groups, overlays, toggle sets, filterable lists, numeric editors.
- **`press/signals`** — Reactive helpers: viewport-aware scroll sync, cumulative row offsets, value cyclers, clamped setters.
- **`press/async`** — A polling controller with active/paused/disabled modes that coalesces overlapping ticks, plus a stale-stamp guard for cancelling out-of-date in-flight work.
- **`press/context`** — `createSimpleContext`, a factory that bundles a Solid `Provider` and `use()` hook into one call.
- **`press/format`** — Terminal-aware string utilities: column-width measurement (East Asian wide aware), truncate / pad / clip, compact number and relative-age formatting, range bars, search-match segmentation, progress-bar parts.
- **`press/icons`** — Nerd Font glyph constants tagged with their column width, plus a placeholder generator.
- **`press/io`** — Atomic file writes and JSON load/save with optional zod validation and structured failure reasons.
- **`press/terminal`** — A `useResponsiveLayout` breakpoint hook keyed to terminal width, and `createTerminalHandover` for suspending the renderer while a subprocess (editor, pager) takes the screen.
- **`press/keyboard`** — Key-event matching, declarative binding dispatch with optional status-bar hints, modal keymap layers, and a text-input helper for free-form fields.
- **`press/charts`** — A braille-cell rasterizer, sparkline, and a full chart renderable that registers as an opentui element.

## Install

```sh
bun add @ahokinson/press
bun add solid-js @opentui/core @opentui/solid
bun add zod                 # only if you use press/io
```

`solid-js`, `@opentui/core`, and `@opentui/solid` are peer dependencies. `zod` is an optional peer.

In your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@opentui/solid"
  }
}
```

## Contributing

Press only accepts security PRs. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
