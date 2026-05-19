import { describe, expect, test } from "bun:test"
import { defaultTheme } from "@theme/palette.ts"
import { Severity, severityColor } from "@theme/severity.ts"

describe("severityColor", () => {
  test("maps each enum value to a distinct theme token", () => {
    expect(severityColor(defaultTheme, Severity.Info)).toBe(defaultTheme.accent)
    expect(severityColor(defaultTheme, Severity.Success)).toBe(defaultTheme.ok)
    expect(severityColor(defaultTheme, Severity.Warning)).toBe(defaultTheme.warn)
    expect(severityColor(defaultTheme, Severity.Error)).toBe(defaultTheme.err)
    expect(severityColor(defaultTheme, Severity.Neutral)).toBe(defaultTheme.muted)
  })
})
