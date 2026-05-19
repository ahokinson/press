import { describe, expect, test } from "bun:test"
import { Separated } from "@components/container/separated.tsx"
import { testRender } from "@opentui/solid"

describe("Separated", () => {
  test("inserts a string separator between items", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <box flexDirection="row">
          <Separated items={() => [<text>a</text>, <text>b</text>, <text>c</text>]} separator=" | " />
        </box>
      ),
      { width: 20, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("a")
    expect(frame).toContain("|")
    expect(frame).toContain("b")
  })

  test("inserts a JSX separator", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <box flexDirection="row">
          <Separated items={() => [<text>x</text>, <text>y</text>]} separator={<text>—</text>} />
        </box>
      ),
      { width: 10, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("x")
    expect(frame).toContain("—")
    expect(frame).toContain("y")
  })

  test("no separator before the first item", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <box flexDirection="row">
          <Separated items={() => [<text>only</text>]} separator="•" />
        </box>
      ),
      { width: 10, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("only")
    expect(frame).not.toContain("•")
  })
})
