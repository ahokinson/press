import { describe, expect, test } from "bun:test"
import { Truncated } from "@components/atom/truncated.tsx"
import { testRender } from "@opentui/solid"

describe("Truncated", () => {
  test("renders the first N items only", async () => {
    const items = ["a", "b", "c", "d", "e"]
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Truncated items={() => items} max={3} renderItem={(item) => <text>{item}</text>} />,
      { width: 10, height: 6 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("a")
    expect(frame).toContain("b")
    expect(frame).toContain("c")
  })

  test("renders default overflow row when more items remain", async () => {
    const items = ["a", "b", "c", "d", "e"]
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Truncated items={() => items} max={2} renderItem={(item) => <text>{item}</text>} />,
      { width: 15, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("+3 more")
  })

  test("omits overflow row when nothing is hidden", async () => {
    const items = ["a", "b"]
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Truncated items={() => items} max={5} renderItem={(item) => <text>{item}</text>} />,
      { width: 15, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).not.toContain("more")
  })

  test("renderMore returning a string is wrapped in a themed text", async () => {
    const items = ["a", "b", "c", "d"]
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Truncated
          items={() => items}
          max={1}
          renderItem={(item) => <text>{item}</text>}
          renderMore={(n) => `${n} hidden`}
        />
      ),
      { width: 15, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("3 hidden")
  })

  test("renderMore returning a node is used directly", async () => {
    const items = ["a", "b", "c"]
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Truncated
          items={() => items}
          max={1}
          renderItem={(item) => <text>{item}</text>}
          renderMore={(n) => <text>{`x${n}`}</text>}
        />
      ),
      { width: 10, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("x2")
  })
})
