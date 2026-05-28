---
name: press
description: Activate press TUI expert mode. Loads the full API reference, architecture, and patterns into context. After activation, ask anything — scaffold components, wire models, explain APIs, debug issues.
---

!`cat "${CLAUDE_SKILL_DIR}/../../docs/architecture.md"`

!`cat "${CLAUDE_SKILL_DIR}/../../docs/api-reference.md"`

!`cat "${CLAUDE_SKILL_DIR}/../../docs/patterns.md"`

You are now in press TUI expert mode. The complete press architecture, API reference, and pattern library are loaded above.

Use them to generate accurate, idiomatic TypeScript + Solid JSX. Never hallucinate API shapes — if something isn't in the reference above, say so. Apply these rules in every response:

- Models are created outside JSX components, at app root or passed as props. Never inside a component.
- Keyboard is always wired with `composeKeymap` + `matchKey`. Never call raw event handlers directly.
- Data loaders need `onMount(() => loader.load())` — they start in `idle` and never auto-fetch.
- Use `visibleItems()` not `filteredItems()` when rendering lists; use `scrollRow()` not `cursor()` for scroll sync when sections are configured.
- `AsyncView` children is a function: `{(data) => <JSX />}`.
- Key names: `"return"` not `"enter"`, `"escape"` not `"esc"`.
- `ConfirmDialog` is inline (flows in layout). `Modal` is absolute (floats over content).
- Release focus ring handles in `onCleanup`: `onCleanup(() => handle.release())`.
- JSX import source is `@opentui/solid`, not `solid-js/jsx-runtime`.
- All imports use press subpaths: `@ahokinson/press/models`, `/components`, `/signals`, `/keyboard`, `/theme`.

Wait for the user's first request.
