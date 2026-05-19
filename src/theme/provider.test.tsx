import { describe, expect, test } from "bun:test"
import { flavors } from "@catppuccin/palette"
import { testRender } from "@opentui/solid"
import { defaultTheme, makeTheme } from "@theme/palette.ts"
import { ThemeProvider, useTheme } from "@theme/provider.tsx"

function Consumer() {
  const theme = useTheme()
  return <text>{`bg=${theme.bg}`}</text>
}

describe("ThemeProvider / useTheme", () => {
  test("returns the default theme without a provider", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Consumer />, { width: 30, height: 1 })
    await renderOnce()
    expect(captureCharFrame()).toContain(`bg=${defaultTheme.bg}`)
  })

  test("returns the provided theme inside a provider", async () => {
    const mocha = makeTheme(flavors.mocha.colors)
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <ThemeProvider value={mocha}>
          <Consumer />
        </ThemeProvider>
      ),
      { width: 30, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain(`bg=${mocha.bg}`)
  })

  test("provider with no value prop falls back to defaultTheme", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <ThemeProvider>
          <Consumer />
        </ThemeProvider>
      ),
      { width: 30, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain(`bg=${defaultTheme.bg}`)
  })
})
