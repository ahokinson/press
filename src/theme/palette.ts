import { type CatppuccinColors, flavors } from "@catppuccin/palette"
import type { Intent } from "@theme/intent.ts"

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
    textSub: palette.subtext1.hex,
    textMuted: palette.subtext0.hex,
    textDim: palette.overlay0.hex,
    textFaint: palette.surface2.hex,

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

    background: palette.base.hex,
    backgroundElevated: palette.surface0.hex,
    backgroundSelection: palette.surface1.hex,
    backgroundChrome: palette.mantle.hex,
    border: palette.surface2.hex,
    borderFocused: palette.blue.hex,
    crust: palette.crust.hex,
  }
}

export const defaultTheme: Theme = makeTheme(flavors.frappe.colors)

export type Theme = ReturnType<typeof makeTheme> & {
  /** Per-`Intent` color overrides consulted by `intentColor` before the default mapping. */
  intentColors?: Partial<Record<Intent, string>>
}

/** Build a `Theme` with extra tokens layered on top. Defaults to the Frappé palette. */
export function createTheme<E extends Record<string, string>>(
  extensions: E,
  palette: CatppuccinColors = flavors.frappe.colors,
): Theme & E {
  return { ...makeTheme(palette), ...extensions }
}
