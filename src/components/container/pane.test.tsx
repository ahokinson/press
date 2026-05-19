import { describe, expect, test } from "bun:test"
import { Pane } from "@components/container/pane.tsx"
import { testRender } from "@opentui/solid"

describe("Pane", () => {
  test("renders children", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Pane>
          <text>inside</text>
        </Pane>
      ),
      { width: 20, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("inside")
  })

  test("renders the title in the border", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Pane title="files">
          <text>x</text>
        </Pane>
      ),
      { width: 20, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("files")
  })

  test("focused() drives a focus-aware border", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Pane focused={() => true} padding={1} gap={1}>
          <text>focused</text>
        </Pane>
      ),
      { width: 20, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("focused")
  })

  test("explicit borderColor bypasses focus derivation", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Pane focused={() => true} borderColor="#ff0000" paddingX={2} paddingY={1}>
          <text>bordered</text>
        </Pane>
      ),
      { width: 20, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("bordered")
  })
})
