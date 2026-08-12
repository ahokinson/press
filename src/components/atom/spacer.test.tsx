import { describe, expect, test } from "bun:test"
import { Spacer } from "@components/atom/spacer.tsx"
import { testRender } from "@opentui/solid"

describe("Spacer", () => {
  test("pushes trailing content to the far edge of a row", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <box flexDirection="row" width={20}>
          <text>L</text>
          <Spacer />
          <text>R</text>
        </box>
      ),
      { width: 20, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    // L stays at the start, R is pushed toward the end (a gap between them).
    expect(frame).toContain("L")
    expect(frame).toContain("R")
    expect(frame).toMatch(/L\s{2,}.*R/)
  })
})
