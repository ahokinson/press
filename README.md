# press

[![CI](https://github.com/ahokinson/press/actions/workflows/test.yml/badge.svg)](https://github.com/ahokinson/press/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/ahokinson/press/branch/develop/graph/badge.svg)](https://codecov.io/gh/ahokinson/press)

Solid's reactivity, opentui's renderer, and the layer between them you'd otherwise write every time. Press is for people who care how the terminal feels.

## Why?

Nothing else looked right.

## Modules

| Module             |                                                                                 |
| ------------------ | ------------------------------------------------------------------------------- |
| `press/async`      | Async polling with lifecycle control and race-condition guards                  |
| `press/charts`     | Braille-based sparklines and chart renderables                                  |
| `press/clipboard`  | Clipboard write with SSH-compatible OSC 52 and platform-native fallback         |
| `press/components` | UI building blocks: atoms, containers, controls, dialogs, and feedback surfaces |
| `press/context`    | Type-safe required context for Solid                                            |
| `press/format`     | String formatting for terminal display                                          |
| `press/icons`      | Nerd Font glyph constants                                                       |
| `press/io`         | File I/O with atomic writes and optional schema validation                      |
| `press/keyboard`   | Keyboard input handling and modal keymaps                                       |
| `press/link`       | Clickable terminal hyperlinks via OSC 8                                         |
| `press/markdown`   | Markdown rendering for the terminal                                             |
| `press/models`     | Headless UI state machines                                                      |
| `press/signals`    | Reactive primitives for scroll, cycling, and clamped cursors                    |
| `press/terminal`   | Screen layout, stack navigation, and subprocess handover                        |
| `press/theme`      | Theming, palette management, and a Catppuccin default                           |

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

## Claude Code

Press ships with a Claude Code plugin. Install it once, then invoke `/press` in any session to load the full API reference, architecture guide, and pattern library into context.

```sh
claude plugin install ahokinson/press
```

## Contributing

Press only accepts security PRs. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
