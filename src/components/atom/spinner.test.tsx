import { describe, expect, test } from "bun:test"
import { DEFAULT_SPINNER_FRAMES, Spinner } from "@components/atom/spinner.tsx"
import { testRender } from "@opentui/solid"

describe("Spinner", () => {
  test("renders the first frame plus the label", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Spinner label="loading" />, {
      width: 20,
      height: 1,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("loading")
    // First frame is one of the defaults
    const seen = DEFAULT_SPINNER_FRAMES.some((g) => frame.includes(g))
    expect(seen).toBe(true)
  })

  test("renders without a label", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Spinner color="#ff00ff" />, {
      width: 10,
      height: 1,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).not.toContain("loading")
  })

  test("accepts custom frames", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Spinner frames={["X", "Y", "Z"]} label="hi" />, {
      width: 10,
      height: 1,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("hi")
    expect(["X", "Y", "Z"].some((g) => frame.includes(g))).toBe(true)
  })
})
