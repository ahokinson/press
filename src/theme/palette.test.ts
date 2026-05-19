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
      "teal",
      "lavender",
      "flamingo",
      "maroon",
      "peach",
      "sky",
      "mauve",
      "bg",
      "bgAlt",
      "bgHighlight",
      "headerBg",
      "border",
      "crust",
    ] as const
    for (const t of tokens) {
      expect(typeof theme[t]).toBe("string")
      expect(theme[t]).toMatch(/^#[0-9a-f]{6}$/i)
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
    const t = createTheme({ brand: "#deadbe" })
    expect(t.brand).toBe("#deadbe")
    expect(t.bg).toBe(flavors.frappe.colors.base.hex)
  })

  test("accepts a custom palette", () => {
    const t = createTheme({ brand: "#abcdef" }, flavors.macchiato.colors)
    expect(t.brand).toBe("#abcdef")
    expect(t.bg).toBe(flavors.macchiato.colors.base.hex)
  })

  test("extension keys can shadow base tokens", () => {
    const t = createTheme({ ok: "#000000" })
    expect(t.ok).toBe("#000000")
  })
})
