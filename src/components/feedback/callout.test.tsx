import { describe, expect, test } from "bun:test"
import { Callout } from "@components/feedback/callout.tsx"
import { testRender } from "@opentui/solid"

describe("Callout", () => {
  test("renders string children as a colored text row", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Callout color="#ffff00">heads up</Callout>, {
      width: 20,
      height: 1,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain("heads up")
  })

  test("renders the optional icon", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Callout color="#ff0000" icon="!" bold>
          error
        </Callout>
      ),
      { width: 20, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("!")
    expect(frame).toContain("error")
  })

  test("renders JSX children verbatim", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Callout color="#00ff00">
          <text>OK</text>
        </Callout>
      ),
      { width: 10, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("OK")
  })
})
