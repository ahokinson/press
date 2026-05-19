import { describe, expect, test } from "bun:test"
import { Badge } from "@components/atom/badge.tsx"
import { testRender } from "@opentui/solid"

describe("Badge", () => {
  test("renders the label with surrounding spaces by default", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Badge text="ok" color="#00ff00" />, {
      width: 20,
      height: 1,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain(" ok ")
    expect(frame).not.toContain("[ok]")
  })

  test("wraps in brackets when active", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Badge text="ok" color="#00ff00" active />, {
      width: 20,
      height: 1,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain("[ok]")
  })
})
