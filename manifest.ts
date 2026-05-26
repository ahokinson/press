// Shared entry-point map used by `build.ts` (Bun build, JS only) and
// `tsup.config.ts` (tsup, .d.ts only). Adding a new subpath only requires
// updating this file plus `package.json` exports.

export const subpaths = [
  "async",
  "charts",
  "clipboard",
  "components",
  "context",
  "format",
  "icons",
  "io",
  "keyboard",
  "link",
  "markdown",
  "models",
  "signals",
  "terminal",
  "theme",
] as const

export type Subpath = (typeof subpaths)[number]

export const entry: Record<`${Subpath}/index`, string> = Object.fromEntries(
  subpaths.map((s) => [`${s}/index`, `src/${s}/index.ts`]),
) as Record<`${Subpath}/index`, string>

export const entrypoints = subpaths.map((s) => `src/${s}/index.ts`)

export const external = [
  "solid-js",
  "solid-js/web",
  "@opentui/core",
  "@opentui/solid",
  "zod",
  "@catppuccin/palette",
]
