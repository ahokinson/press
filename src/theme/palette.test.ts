import { describe, expect, test } from "bun:test"
import { flavors } from "@catppuccin/palette"
import { createTheme, defaultTheme, makeTheme } from "@theme/palette.ts"

describe("makeTheme", () => {
  test("maps every documented token to a hex string", () => {
    const theme = makeTheme(flavors.mocha.colors)
    const tokens = [
      "text",
      "textSub",
      "textMuted",
      "textDim",
      "textFaint",
      "accent",
      "ok",
      "warn",
      "err",
      "info",
      "syntaxKey",
      "syntaxNum",
      "syntaxBool",
      "syntaxType",
      "syntaxSubheading",
      "syntaxInlineCode",
      "background",
      "backgroundElevated",
      "backgroundSelection",
      "backgroundChrome",
      "border",
      "borderFocused",
      "crust",
    ] as const
    for (const token of tokens) {
      expect(typeof theme[token]).toBe("string")
      expect(theme[token]).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  test("returns palette-specific values (mocha differs from frappé)", () => {
    const mocha = makeTheme(flavors.mocha.colors)
    const frappe = makeTheme(flavors.frappe.colors)
    expect(mocha.background).not.toBe(frappe.background)
  })
})

describe("defaultTheme", () => {
  test("matches the Frappé palette", () => {
    expect(defaultTheme.background).toBe(flavors.frappe.colors.base.hex)
    expect(defaultTheme.accent).toBe(flavors.frappe.colors.blue.hex)
  })
})

describe("createTheme", () => {
  test("merges extensions onto the default Frappé palette", () => {
    const theme = createTheme({ brand: "#deadbe" })
    expect(theme.brand).toBe("#deadbe")
    expect(theme.background).toBe(flavors.frappe.colors.base.hex)
  })

  test("accepts a custom palette", () => {
    const theme = createTheme({ brand: "#abcdef" }, flavors.macchiato.colors)
    expect(theme.brand).toBe("#abcdef")
    expect(theme.background).toBe(flavors.macchiato.colors.base.hex)
  })

  test("extension keys can shadow base tokens", () => {
    const theme = createTheme({ ok: "#000000" })
    expect(theme.ok).toBe("#000000")
  })
})
