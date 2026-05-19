import { describe, expect, test } from "bun:test"
import { Card } from "@components/container/card.tsx"
import { testRender } from "@opentui/solid"

describe("Card", () => {
  test("renders the title string", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Card title="Settings" />, { width: 20, height: 5 })
    await renderOnce()
    expect(captureCharFrame()).toContain("Settings")
  })

  test("renders the optional description", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Card title="Settings" description="tweak options" />,
      { width: 25, height: 5 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("Settings")
    expect(frame).toContain("tweak options")
  })

  test("accepts a JSX title", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Card title={<text>Custom</text>} color="#ff8800" padding={2} />,
      { width: 25, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("Custom")
  })

  test("paddingX overrides padding", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Card title="X" padding={1} paddingX={3} />, {
      width: 20,
      height: 5,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain("X")
  })
})
