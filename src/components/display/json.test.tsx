import { describe, expect, test } from "bun:test"
import { Json } from "@components/display/json.tsx"
import { testRender } from "@opentui/solid"

describe("Json", () => {
  test("renders a primitive root value", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Json value={() => 42} />, { width: 20, height: 3 })
    await renderOnce()
    expect(captureCharFrame()).toContain("42")
  })

  test("renders nested objects with keys", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Json value={() => ({ name: "press", tags: ["solid", "tui"] })} />,
      { width: 40, height: 10 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("name")
    expect(frame).toContain("press")
    expect(frame).toContain("tags")
    expect(frame).toContain("solid")
  })

  test("collapses past maxDepth", async () => {
    const deep = { a: { b: { c: { d: { e: 1 } } } } }
    const { captureCharFrame, renderOnce } = await testRender(() => <Json value={() => deep} maxDepth={2} />, {
      width: 40,
      height: 10,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain("{…}")
  })

  test("truncates long strings past maxStringLength", async () => {
    const long = "x".repeat(50)
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Json value={() => ({ s: long })} maxStringLength={10} />,
      { width: 50, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("…")
  })

  test("handles empty containers", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Json value={() => ({ a: [], b: {} })} indent={4} />,
      { width: 30, height: 5 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("[]")
    expect(frame).toContain("{}")
  })

  test("handles null and undefined leaves", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Json value={() => ({ n: null, u: undefined, b: true })} />,
      { width: 30, height: 5 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("null")
    expect(frame).toContain("undefined")
    expect(frame).toContain("true")
  })

  test("renders BSON-like classes via their string form", async () => {
    class Tag {
      constructor(public name: string) {}
      toString() {
        return `Tag(${this.name})`
      }
    }
    const { captureCharFrame, renderOnce } = await testRender(() => <Json value={() => ({ t: new Tag("alpha") })} />, {
      width: 30,
      height: 3,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain("Tag(alpha)")
  })
})
