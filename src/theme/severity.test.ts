import { describe, expect, test } from "bun:test"
import { defaultTheme } from "@theme/palette.ts"
import { Change, changeColor, changeOf, Severity, severityColor } from "@theme/severity.ts"

describe("severityColor", () => {
  test("maps each enum value to a distinct theme token", () => {
    expect(severityColor(defaultTheme, Severity.Info)).toBe(defaultTheme.accent)
    expect(severityColor(defaultTheme, Severity.Success)).toBe(defaultTheme.ok)
    expect(severityColor(defaultTheme, Severity.Warning)).toBe(defaultTheme.warn)
    expect(severityColor(defaultTheme, Severity.Error)).toBe(defaultTheme.err)
    expect(severityColor(defaultTheme, Severity.Neutral)).toBe(defaultTheme.muted)
  })

  test("theme.severityColors overrides the default mapping for that bucket only", () => {
    const overridden = { ...defaultTheme, severityColors: { [Severity.Warning]: "#ff8800" } }
    expect(severityColor(overridden, Severity.Warning)).toBe("#ff8800")
    expect(severityColor(overridden, Severity.Error)).toBe(defaultTheme.err)
    expect(severityColor(overridden, Severity.Info)).toBe(defaultTheme.accent)
  })

  test("unset entries in severityColors fall through to the default mapping", () => {
    const partial = { ...defaultTheme, severityColors: {} }
    expect(severityColor(partial, Severity.Warning)).toBe(defaultTheme.warn)
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
  test("Up → ok, Down → err, Flat → muted", () => {
    expect(changeColor(defaultTheme, Change.Up)).toBe(defaultTheme.ok)
    expect(changeColor(defaultTheme, Change.Down)).toBe(defaultTheme.err)
    expect(changeColor(defaultTheme, Change.Flat)).toBe(defaultTheme.muted)
  })
})
