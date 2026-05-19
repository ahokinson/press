import { describe, expect, test } from "bun:test"
import { Progress } from "@components/atom/progress.tsx"
import { testRender } from "@opentui/solid"

describe("Progress", () => {
  test("renders a half-filled bar at the requested width", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Progress value={() => 5} max={() => 10} width={10} />,
      { width: 20, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("█████")
    expect(frame).toContain("░░░░░")
  })

  test("max <= 0 paints fully filled", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Progress value={() => 0} max={() => 0} width={6} />,
      { width: 10, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("██████")
  })

  test("respects custom characters and colors", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Progress
          value={() => 1}
          max={() => 2}
          width={4}
          filledChar="X"
          unfilledChar="-"
          filledColor="#00ff00"
          unfilledColor="#444444"
        />
      ),
      { width: 10, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("XX")
    expect(frame).toContain("--")
  })

  test("default width is 16 columns", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Progress value={() => 16} max={() => 16} />, {
      width: 20,
      height: 1,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain("████████████████")
  })
})
