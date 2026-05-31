import { describe, expect, test } from "bun:test"
import { createScrollboxOptions } from "@components/container/scroll/index.ts"
import { MacOSScrollAccel } from "@opentui/core"
import { defaultTheme } from "@theme/palette.ts"

describe("createScrollboxOptions", () => {
  test("uses the theme's backgroundElevated and textFaint tokens for the track", () => {
    const opts = createScrollboxOptions(defaultTheme)
    expect(opts.verticalScrollbarOptions.showArrows).toBe(false)
    expect(opts.verticalScrollbarOptions.trackOptions.backgroundColor).toBe(defaultTheme.backgroundElevated)
    expect(opts.verticalScrollbarOptions.trackOptions.foregroundColor).toBe(defaultTheme.textFaint)
  })

  test("attaches a MacOSScrollAccel instance", () => {
    const opts = createScrollboxOptions(defaultTheme)
    expect(opts.scrollAcceleration).toBeInstanceOf(MacOSScrollAccel)
  })
})
