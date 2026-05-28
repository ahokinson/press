import { type CatppuccinColors, flavors } from "@catppuccin/palette"
import type { Severity } from "@theme/severity.ts"

/**
 * Build a `Theme` from a Catppuccin palette.
 *
 * ```ts
 * <ThemeProvider value={makeTheme(flavors.mocha.colors)}>...</ThemeProvider>
 * ```
 */
export function makeTheme(palette: CatppuccinColors) {
  return {
    text: palette.text.hex,
    subtext: palette.subtext1.hex,
    muted: palette.subtext0.hex,
    dim: palette.overlay0.hex,
    faint: palette.surface2.hex,

    accent: palette.blue.hex,
    ok: palette.green.hex,
    warn: palette.yellow.hex,
    err: palette.red.hex,
    info: palette.sapphire.hex,

    syntaxKey: palette.lavender.hex,
    syntaxNum: palette.peach.hex,
    syntaxBool: palette.maroon.hex,
    syntaxType: palette.teal.hex,
    syntaxSubheading: palette.mauve.hex,
    syntaxInlineCode: palette.peach.hex,

    bg: palette.base.hex,
    bgAlt: palette.surface0.hex,
    bgHighlight: palette.surface1.hex,
    headerBg: palette.mantle.hex,
    border: palette.surface1.hex,
    crust: palette.crust.hex,
  }
}

export const defaultTheme: Theme = makeTheme(flavors.frappe.colors)

export type Theme = ReturnType<typeof makeTheme> & {
  /** Per-`Severity` color overrides consulted by `severityColor` before the default mapping. */
  severityColors?: Partial<Record<Severity, string>>
}

/** Build a `Theme` with extra tokens layered on top. Defaults to the Frappé palette. */
export function createTheme<E extends Record<string, string>>(
  extensions: E,
  palette: CatppuccinColors = flavors.frappe.colors,
): Theme & E {
  return { ...makeTheme(palette), ...extensions }
}
