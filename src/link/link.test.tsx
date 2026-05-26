import { describe, expect, test } from "bun:test"
import { Link } from "@link/link.tsx"
import { testRender } from "@opentui/solid"

describe("Link", () => {
  test("renders the label text inside its parent text element", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <text>
          <Link href="https://example.com">click me</Link>
        </text>
      ),
      { width: 30, height: 3 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("click me")
  })

  test("does not surface the URL in the rendered char grid", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <text>
          <Link href="https://example.com/path">label</Link>
        </text>
      ),
      { width: 60, height: 3 },
    )
    await renderOnce()
    expect(captureCharFrame()).not.toContain("https://example.com/path")
  })

  test("composes alongside plain spans in the same text element", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <text>
          <span>before </span>
          <Link href="https://x">middle</Link>
          <span> after</span>
        </text>
      ),
      { width: 40, height: 3 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("before")
    expect(frame).toContain("middle")
    expect(frame).toContain("after")
  })
})
