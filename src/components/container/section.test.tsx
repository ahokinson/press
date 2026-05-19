import { describe, expect, test } from "bun:test"
import { Section } from "@components/container/section.tsx"
import { Icon } from "@icons"
import { testRender } from "@opentui/solid"

describe("Section", () => {
  test("renders label, count, and the expanded chevron by default", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Section label="Open" count={5} />, {
      width: 20,
      height: 1,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("Open")
    expect(frame).toContain("5")
    expect(frame).toContain(Icon.chevronDown.char)
  })

  test("collapsed() switches to the collapsed chevron", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Section label="Closed" collapsed={() => true} />, {
      width: 20,
      height: 1,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("Closed")
    expect(frame).toContain(Icon.chevronRight.char)
  })

  test("custom chevron glyphs are respected", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Section label="X" collapsed={() => true} chevronCollapsed=">" chevronExpanded="v" />,
      { width: 10, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain(">")
  })

  test("hides the count when undefined", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Section label="NoCount" background="#222222" />, {
      width: 20,
      height: 1,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("NoCount")
  })
})
