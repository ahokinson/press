import { describe, expect, test } from "bun:test"
import { RangeBar } from "@components/atom/rangebar.tsx"
import { RANGE_BAR_LEFT_CAP, RANGE_BAR_MARKER, RANGE_BAR_RIGHT_CAP, RANGE_BAR_TRACK } from "@format"
import { testRender } from "@opentui/solid"

describe("RangeBar", () => {
  test("renders caps and marker", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <RangeBar current={5} low={0} high={10} width={7} />,
      { width: 10, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain(RANGE_BAR_LEFT_CAP)
    expect(frame).toContain(RANGE_BAR_RIGHT_CAP)
    expect(frame).toContain(RANGE_BAR_MARKER)
  })

  test("flat track when high === low (no marker)", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <RangeBar current={5} low={5} high={5} width={5} />,
      { width: 10, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain(RANGE_BAR_TRACK.repeat(5))
    expect(frame).not.toContain(RANGE_BAR_MARKER)
  })

  test("respects custom marker and track colors", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <RangeBar current={3} low={0} high={10} width={5} markerColor="#ff0000" trackColor="#0000ff" />,
      { width: 10, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain(RANGE_BAR_MARKER)
  })
})
