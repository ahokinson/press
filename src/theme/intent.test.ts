import { describe, expect, test } from "bun:test"
import { Change, changeColor, changeOf, Intent, intentColor } from "@theme/intent.ts"
import { defaultTheme } from "@theme/palette.ts"

describe("intentColor", () => {
  test("maps each enum value to a distinct theme token", () => {
    expect(intentColor(defaultTheme, Intent.Info)).toBe(defaultTheme.accent)
    expect(intentColor(defaultTheme, Intent.Success)).toBe(defaultTheme.ok)
    expect(intentColor(defaultTheme, Intent.Warning)).toBe(defaultTheme.warn)
    expect(intentColor(defaultTheme, Intent.Error)).toBe(defaultTheme.err)
    expect(intentColor(defaultTheme, Intent.Neutral)).toBe(defaultTheme.textMuted)
  })

  test("theme.intentColors overrides the default mapping for that bucket only", () => {
    const overridden = { ...defaultTheme, intentColors: { [Intent.Warning]: "#ff8800" } }
    expect(intentColor(overridden, Intent.Warning)).toBe("#ff8800")
    expect(intentColor(overridden, Intent.Error)).toBe(defaultTheme.err)
    expect(intentColor(overridden, Intent.Info)).toBe(defaultTheme.accent)
  })

  test("unset entries in intentColors fall through to the default mapping", () => {
    const partial = { ...defaultTheme, intentColors: {} }
    expect(intentColor(partial, Intent.Warning)).toBe(defaultTheme.warn)
  })
})

describe("changeOf", () => {
  test("strict sign by default", () => {
    expect(changeOf(0)).toBe(Change.Flat)
    expect(changeOf(0.0001)).toBe(Change.Up)
    expect(changeOf(-0.0001)).toBe(Change.Down)
  })

  test("epsilon collapses near-zero deltas to Flat", () => {
    expect(changeOf(0.5, 1)).toBe(Change.Flat)
    expect(changeOf(-0.5, 1)).toBe(Change.Flat)
    expect(changeOf(1, 1)).toBe(Change.Flat)
    expect(changeOf(-1, 1)).toBe(Change.Flat)
    expect(changeOf(1.0001, 1)).toBe(Change.Up)
    expect(changeOf(-1.0001, 1)).toBe(Change.Down)
  })

  test("NaN is Flat, infinities follow sign", () => {
    expect(changeOf(Number.NaN)).toBe(Change.Flat)
    expect(changeOf(Number.POSITIVE_INFINITY)).toBe(Change.Up)
    expect(changeOf(Number.NEGATIVE_INFINITY)).toBe(Change.Down)
  })
})

describe("changeColor", () => {
  test("Up → ok, Down → err, Flat → textMuted", () => {
    expect(changeColor(defaultTheme, Change.Up)).toBe(defaultTheme.ok)
    expect(changeColor(defaultTheme, Change.Down)).toBe(defaultTheme.err)
    expect(changeColor(defaultTheme, Change.Flat)).toBe(defaultTheme.textMuted)
  })
})
