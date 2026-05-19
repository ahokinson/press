import { describe, expect, test } from "bun:test"
import { StatusBar } from "@components/feedback/status/index.tsx"
import { testRender } from "@opentui/solid"

describe("StatusBar", () => {
  test("renders each hint with key and action", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <StatusBar
          hints={() => [
            { key: "j", action: "down" },
            { key: "k", action: "up" },
          ]}
        />
      ),
      { width: 40, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("j")
    expect(frame).toContain("down")
    expect(frame).toContain("k")
    expect(frame).toContain("up")
  })

  test("renders trailing string", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <StatusBar hints={() => [{ key: "q", action: "quit" }]} trailing={() => "saved"} />,
      { width: 40, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("saved")
  })

  test("paints spinner glyph when busy is true", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <StatusBar
          hints={() => [{ key: "q", action: "quit" }]}
          busy={() => true}
          spinner={() => "⠋"}
          trailing={() => "loading"}
        />
      ),
      { width: 40, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("⠋")
    expect(frame).toContain("loading")
  })

  test("omits spinner when not busy", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <StatusBar hints={() => [{ key: "q", action: "quit" }]} busy={() => false} spinner={() => "⠋"} />,
      { width: 30, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).not.toContain("⠋")
  })
})
