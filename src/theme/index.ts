export type { Theme } from "@theme/palette.ts"
export { createTheme, defaultTheme, makeTheme } from "@theme/palette.ts"
export { ThemeProvider, useTheme } from "@theme/provider.tsx"
export { Change, changeColor, changeOf, Severity, severityColor, severityGlyph } from "@theme/severity.ts"

/** opentui's `attributes` bit mask for bold text. */
export const BOLD = 1

/** opentui's `attributes` bit mask for underlined text. */
export const UNDERLINE = 2

/** opentui's `attributes` bit mask for italic text. */
export const ITALIC = 4
