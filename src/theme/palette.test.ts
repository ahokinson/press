import { describe, expect, test } from "bun:test"
import { flavors } from "@catppuccin/palette"
import { createTheme, defaultTheme, makeTheme } from "@theme/palette.ts"

describe("makeTheme", () => {
  test("maps every documented token to a hex string", () => {
    const theme = makeTheme(flavors.mocha.colors)
    const tokens = [
      "text",
      "subtext",
      "muted",
      "dim",
      "faint",
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
      "bg",
      "bgAlt",
      "bgHighlight",
      "headerBg",
      "border",
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
    expect(mocha.bg).not.toBe(frappe.bg)
  })
})

describe("defaultTheme", () => {
  test("matches the Frappé palette", () => {
    expect(defaultTheme.bg).toBe(flavors.frappe.colors.base.hex)
    expect(defaultTheme.accent).toBe(flavors.frappe.colors.blue.hex)
  })
})

describe("createTheme", () => {
  test("merges extensions onto the default Frappé palette", () => {
    const theme = createTheme({ brand: "#deadbe" })
    expect(theme.brand).toBe("#deadbe")
    expect(theme.bg).toBe(flavors.frappe.colors.base.hex)
  })

  test("accepts a custom palette", () => {
    const theme = createTheme({ brand: "#abcdef" }, flavors.macchiato.colors)
    expect(theme.brand).toBe("#abcdef")
    expect(theme.bg).toBe(flavors.macchiato.colors.base.hex)
  })

  test("extension keys can shadow base tokens", () => {
    const theme = createTheme({ ok: "#000000" })
    expect(theme.ok).toBe("#000000")
  })
})
