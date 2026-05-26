import { describe, expect, test } from "bun:test"
import { OSC8_CLOSE, OSC8_OPEN, OSC8_ST, supportsOsc8, wrapOsc8 } from "@link/osc8.ts"

describe("wrapOsc8", () => {
  test("wraps label in OSC 8 open + close sequences", () => {
    const wrapped = wrapOsc8("https://example.com", "click here")
    expect(wrapped).toBe(`${OSC8_OPEN}https://example.com${OSC8_ST}click here${OSC8_CLOSE}`)
  })

  test("emits the standard close sequence (empty params + ST)", () => {
    expect(OSC8_CLOSE).toBe(`${OSC8_OPEN}${OSC8_ST}`)
  })

  test("preserves label characters verbatim, including unicode", () => {
    const wrapped = wrapOsc8("https://x", "日本語")
    expect(wrapped).toContain("日本語")
  })
})

describe("supportsOsc8", () => {
  test("true for iTerm2", () => {
    expect(supportsOsc8({ TERM_PROGRAM: "iTerm.app" })).toBe(true)
  })

  test("true for WezTerm", () => {
    expect(supportsOsc8({ TERM_PROGRAM: "WezTerm" })).toBe(true)
  })

  test("true for VS Code integrated terminal", () => {
    expect(supportsOsc8({ TERM_PROGRAM: "vscode" })).toBe(true)
  })

  test("true for Ghostty", () => {
    expect(supportsOsc8({ TERM_PROGRAM: "ghostty" })).toBe(true)
  })

  test("true for Windows Terminal (WT_SESSION present)", () => {
    expect(supportsOsc8({ WT_SESSION: "abc-123" })).toBe(true)
  })

  test("true for Kitty (KITTY_WINDOW_ID present)", () => {
    expect(supportsOsc8({ KITTY_WINDOW_ID: "1" })).toBe(true)
  })

  test("true for Alacritty (ALACRITTY_WINDOW_ID present)", () => {
    expect(supportsOsc8({ ALACRITTY_WINDOW_ID: "0x123" })).toBe(true)
  })

  test("false for plain xterm without TERM_PROGRAM", () => {
    expect(supportsOsc8({ TERM: "xterm-256color" })).toBe(false)
  })

  test("false for empty environment", () => {
    expect(supportsOsc8({})).toBe(false)
  })

  test("NO_HYPERLINKS forces false regardless of terminal", () => {
    expect(supportsOsc8({ TERM_PROGRAM: "iTerm.app", NO_HYPERLINKS: "1" })).toBe(false)
  })

  test("FORCE_HYPERLINKS=1 forces true even on unknown terminal", () => {
    expect(supportsOsc8({ FORCE_HYPERLINKS: "1" })).toBe(true)
  })

  test("FORCE_HYPERLINKS=0 forces false", () => {
    expect(supportsOsc8({ TERM_PROGRAM: "iTerm.app", FORCE_HYPERLINKS: "0" })).toBe(false)
  })
})
