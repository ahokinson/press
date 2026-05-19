import { describe, expect, test } from "bun:test"
import { Icon, icon, placeholder } from "@icons/index.ts"

describe("icon", () => {
  test("packs char and column width", () => {
    const i = icon("X", 1)
    expect(i.char).toBe("X")
    expect(i.columns).toBe(1)
  })
})

describe("Icon registry", () => {
  test("Nerd Font glyphs report two columns", () => {
    expect(Icon.search.columns).toBe(2)
    expect(Icon.check.columns).toBe(2)
    expect(Icon.chevronRight.columns).toBe(2)
  })

  test("ASCII-width markers report one column", () => {
    expect(Icon.selectMarker.columns).toBe(1)
    expect(Icon.dot.columns).toBe(1)
    expect(Icon.bullet.columns).toBe(1)
  })

  test("every entry exposes a non-empty char", () => {
    for (const [, value] of Object.entries(Icon)) {
      expect(value.char.length).toBeGreaterThan(0)
    }
  })
})

describe("placeholder", () => {
  test("renders ⌈n/2⌉ dashes (each glyph occupies two columns)", () => {
    expect(placeholder(0)).toBe("")
    expect(placeholder(1)).toBe("╌")
    expect(placeholder(2)).toBe("╌")
    expect(placeholder(3)).toBe("╌╌")
    expect(placeholder(4)).toBe("╌╌")
    expect(placeholder(10)).toBe("╌╌╌╌╌")
  })
})
