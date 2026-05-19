import { describe, expect, test } from "bun:test"
import { Empty } from "@components/atom/empty.tsx"
import { testRender } from "@opentui/solid"

describe("Empty", () => {
  test("renders the primary message", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Empty message="no items" />, {
      width: 20,
      height: 5,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain("no items")
  })

  test("renders the hint when provided", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Empty message="no items" hint="try a wider filter" />,
      { width: 30, height: 5 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("no items")
    expect(frame).toContain("try a wider filter")
  })

  test("omits the hint when not provided", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Empty message="empty" />, { width: 20, height: 5 })
    await renderOnce()
    expect(captureCharFrame()).not.toContain("try a wider filter")
  })
})
