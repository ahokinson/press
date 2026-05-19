import { describe, expect, test } from "bun:test"
import { Highlight } from "@components/atom/highlight.tsx"
import { testRender } from "@opentui/solid"

describe("Highlight", () => {
  test("renders the whole text when query is empty", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Highlight text="hello world" query="" fg="#ffffff" matchFg="#ffff00" />,
      { width: 20, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("hello world")
  })

  test("renders matched and unmatched segments", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Highlight text="hello world" query="world" fg="#ffffff" matchFg="#ffff00" />,
      { width: 20, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("hello world")
  })

  test("supports bold and matchBg props", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Highlight
          text="hello world"
          query="hello"
          fg="#ffffff"
          matchFg="#ffff00"
          matchBg="#000088"
          bold
          caseSensitive
        />
      ),
      { width: 20, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("hello world")
  })
})
