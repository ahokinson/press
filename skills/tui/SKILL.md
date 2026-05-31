---
name: press
description: Load the press API reference, architecture guide, and pattern library into context for building press TUIs.
---

!`cat "${CLAUDE_SKILL_DIR}/../../docs/architecture.md"`

!`cat "${CLAUDE_SKILL_DIR}/../../docs/api-reference.md"`

!`cat "${CLAUDE_SKILL_DIR}/../../docs/patterns.md"`

## Install

`@ahokinson/press` is published to GitHub Packages, not the public npm registry. Users must configure their package manager to authenticate with GitHub Packages for the `@ahokinson` scope before installing.

**Bun** — add to `bunfig.toml`:

```toml
[install.scopes]
"@ahokinson" = { token = "$GITHUB_TOKEN", url = "https://npm.pkg.github.com/" }
```

**npm / pnpm** — add to `.npmrc`:

```
@ahokinson:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` must be a GitHub personal access token (classic or fine-grained) with at least `read:packages` scope. Once the registry is configured:

```sh
bun add @ahokinson/press
bun add solid-js @opentui/core @opentui/solid
bun add zod   # only if using press/io
```

Also add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@opentui/solid"
  }
}
```

## Usage rules

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
