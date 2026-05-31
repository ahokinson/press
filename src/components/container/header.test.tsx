import { describe, expect, test } from "bun:test"
import { Header } from "@components/container/header.tsx"
import { testRender } from "@opentui/solid"

describe("Header", () => {
  test("renders both slots", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Header left={() => <text>LEFT</text>} right={() => <text>RIGHT</text>} />,
      { width: 30, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("LEFT")
    expect(frame).toContain("RIGHT")
  })

  test("renders only the right slot when left is omitted", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Header right={() => <text>RIGHT</text>} />, {
      width: 20,
      height: 1,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("RIGHT")
  })

  test("renders blank when both slots are omitted", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Header />, {
      width: 10,
      height: 1,
    })
    await renderOnce()
    expect(captureCharFrame()).not.toContain("RIGHT")
  })
})
