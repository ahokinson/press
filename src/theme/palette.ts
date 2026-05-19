import { type CatppuccinColors, flavors } from "@catppuccin/palette"

/**
 * Map a Catppuccin palette (any of the four flavors) onto the press theme
 * token names. Use this to switch flavors at the root of your app:
 *
 * ```ts
 * <ThemeProvider value={makeTheme(flavors.mocha.colors)}>...</ThemeProvider>
 * ```
 */
export function makeTheme(p: CatppuccinColors) {
  return {
    text: p.text.hex,
    subtext: p.subtext1.hex,
    muted: p.subtext0.hex,
    dim: p.overlay0.hex,
    faint: p.surface2.hex,

    accent: p.blue.hex,
    ok: p.green.hex,
    warn: p.yellow.hex,
    err: p.red.hex,
    info: p.sapphire.hex,

    teal: p.teal.hex,
    lavender: p.lavender.hex,
    flamingo: p.flamingo.hex,
    maroon: p.maroon.hex,
    peach: p.peach.hex,
    sky: p.sky.hex,
    mauve: p.mauve.hex,

    bg: p.base.hex,
    bgAlt: p.surface0.hex,
    bgHighlight: p.surface1.hex,
    headerBg: p.mantle.hex,
    border: p.surface1.hex,
    crust: p.crust.hex,
  }
}

export const defaultTheme = makeTheme(flavors.frappe.colors)

export type Theme = ReturnType<typeof makeTheme>

/**
 * Add custom tokens to the default (Frappé) theme. Pass a different palette as
 * the second argument to swap base flavors and add tokens in one call.
 */
export function createTheme<E extends Record<string, string>>(
  extensions: E,
  palette: CatppuccinColors = flavors.frappe.colors,
): Theme & E {
  return { ...makeTheme(palette), ...extensions }
}
