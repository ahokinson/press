# press

[![CI](https://github.com/ahokinson/press/actions/workflows/test.yml/badge.svg)](https://github.com/ahokinson/press/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/ahokinson/press/branch/develop/graph/badge.svg)](https://codecov.io/gh/ahokinson/press)

A toolkit for building terminal apps that look and feel good. Solid's reactivity, opentui's renderer, and the layer between them you'd otherwise write yourself.

## Why this exists

Nothing else looked right. Press is for people who care how the terminal feels.

## What's in the box

Each module is a separate import path. Pull only what you use.

- **`press/async`** — Polling controller with active/paused/disabled modes, plus stale-stamp and coalesce guards for race-prone work.
- **`press/charts`** — Braille rasterizer, sparkline, and a chart renderable that registers as an opentui element.
- **`press/clipboard`** — `copy(text)` with a discriminated `CopyResult`. OSC 52 first when stdout is a TTY (works over SSH), platform-native command otherwise. Size-capped.
- **`press/components`** — Rendered building blocks. Atoms, containers, controls, dialogs, and feedback surfaces. No app logic.
- **`press/context`** — `createRequiredContext`: a Solid `Provider` and `use()` hook bundled together. `use()` throws outside its `Provider`.
- **`press/format`** — Terminal-aware string utilities. Column-width, truncate/pad, compact numbers, relative time, range bars.
- **`press/icons`** — Nerd Font glyph constants with their column widths. Plus a placeholder generator.
- **`press/io`** — Atomic file writes and JSON load/save with optional zod validation.
- **`press/keyboard`** — Key matching, binding dispatch, modal keymap layers, and a cheatsheet projection into the help overlay.
- **`press/link`** — Themed `Link` component, plus `wrapOsc8` / `supportsOsc8` for clickable terminal hyperlinks.
- **`press/markdown`** — A `Markdown` component, a parser, and word-wrap helpers. ATX headings, paragraphs, fenced code, lists, blockquotes, and the usual inline forms.
- **`press/models`** — Headless state machines: filterable lists, fuzzy pickers, tree expansion, table sort/filter, confirm dialogs, undo/redo, focus rings, numeric editors.
- **`press/signals`** — Reactive helpers around scroll sync, value cycling, and clamped cursors.
- **`press/terminal`** — Responsive layout, screen-stack navigation, and renderer handover for subprocesses (editors, pagers).
- **`press/theme`** — Catppuccin-based palette, `ThemeProvider`, `useTheme`. Build your own with `createTheme`.

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
