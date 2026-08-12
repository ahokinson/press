import { describe, expect, test } from "bun:test"
import { defaultTheme } from "@theme/palette.ts"
import { createScale } from "@theme/scale.ts"

const severity = createScale({
  levels: ["critical", "high", "medium", "low", "info"] as const,
  color: (t, l) => ({ critical: t.err, high: t.warn, medium: t.warn, low: t.ok, info: t.textDim })[l],
})

describe("createScale", () => {
  test("weight ranks top level highest and unknown as 0", () => {
    expect(severity.weight("critical")).toBe(5)
    expect(severity.weight("info")).toBe(1)
    expect(severity.weight("bogus")).toBe(0)
    expect(severity.weight(undefined)).toBe(0)
  })

  test("weight orders a desc sort worst-first", () => {
    const sorted = ["low", "critical", "medium"].sort((a, b) => severity.weight(b) - severity.weight(a))
    expect(sorted).toEqual(["critical", "medium", "low"])
  })

  test("indexOf is case-insensitive; unknown is -1", () => {
    expect(severity.indexOf("CRITICAL")).toBe(0)
    expect(severity.indexOf("nope")).toBe(-1)
  })

  test("color resolves per level and falls back for unknown", () => {
    expect(severity.color(defaultTheme, "critical")).toBe(defaultTheme.err)
    expect(severity.color(defaultTheme, "low")).toBe(defaultTheme.ok)
    expect(severity.color(defaultTheme, "unknown")).toBe(defaultTheme.textMuted)
  })
})
