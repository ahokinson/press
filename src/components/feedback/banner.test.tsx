import { describe, expect, test } from "bun:test"
import { Banner } from "@components/feedback/banner.tsx"
import { testRender } from "@opentui/solid"

describe("Banner", () => {
  test("renders inner children", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Banner>
          <text>save complete</text>
        </Banner>
      ),
      { width: 30, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("save complete")
  })

  test("custom background and padding props are accepted", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Banner backgroundColor="#ff0000" padding={2}>
          <text>warn</text>
        </Banner>
      ),
      { width: 20, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("warn")
  })

  test("paddingX overrides padding", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Banner padding={1} paddingX={4}>
          <text>info</text>
        </Banner>
      ),
      { width: 30, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("info")
  })
})
