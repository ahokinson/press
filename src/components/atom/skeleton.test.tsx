import { describe, expect, test } from "bun:test"
import { Skeleton } from "@components/atom/skeleton.tsx"
import { testRender } from "@opentui/solid"

describe("Skeleton", () => {
  test("repeats renderRow N times", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Skeleton rows={() => 3} renderRow={(index) => <text>{`row-${index}`}</text>} />,
      { width: 20, height: 5 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("row-0")
    expect(frame).toContain("row-1")
    expect(frame).toContain("row-2")
    expect(frame).not.toContain("row-3")
  })

  test("rounds and clamps row count to non-negative integer", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Skeleton rows={() => -5} renderRow={(index) => <text>{`row-${index}`}</text>} />,
      { width: 20, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).not.toContain("row-")
  })

  test("zero rows renders nothing", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Skeleton rows={() => 0} renderRow={(index) => <text>{`row-${index}`}</text>} />,
      { width: 20, height: 3 },
    )
    await renderOnce()
    expect(captureCharFrame()).not.toContain("row-")
  })
})
