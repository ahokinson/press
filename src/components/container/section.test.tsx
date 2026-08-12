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

  test("hides the count when undefined", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Section label="NoCount" />, {
      width: 20,
      height: 1,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain("NoCount")
  })

  test("collapsible={false} renders a plain colored label with no chevron", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Section label="critical" color="#ff0000" count={9} collapsible={false} />,
      { width: 20, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("critical")
    expect(frame).toContain("9")
    expect(frame).not.toContain(Icon.chevronDown.char)
    expect(frame).not.toContain(Icon.chevronRight.char)
  })

  test("icon variant leads with the glyph and no chevron", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Section label="risk" icon={Icon.circleError.char} color="#ff0000" count={3} />,
      { width: 20, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("risk")
    expect(frame).toContain(Icon.circleError.char)
    expect(frame).toContain("3")
    expect(frame).not.toContain(Icon.chevronDown.char)
  })
})
