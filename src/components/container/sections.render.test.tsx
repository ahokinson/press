import { describe, expect, test } from "bun:test"
import { type SectionEntry, Sections } from "@components/container/sections.tsx"
import { testRender } from "@opentui/solid"

function entries(): SectionEntry<string, string>[] {
  return [
    { id: "open", label: "Open", count: 2, items: ["a", "b"], collapsed: false, startIndex: 0 },
    { id: "done", label: "Done", count: 1, items: ["c"], collapsed: false, startIndex: 2 },
  ]
}

describe("Sections (render)", () => {
  test("renders section headers and items", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Sections sections={() => entries()} cursor={() => 0} renderItem={(item) => <text>{item}</text>} />,
      { width: 30, height: 10 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("Open")
    expect(frame).toContain("Done")
    expect(frame).toContain("a")
    expect(frame).toContain("b")
    expect(frame).toContain("c")
  })

  test("collapsed sections hide their items", async () => {
    const data: SectionEntry<string, string>[] = [
      { id: "open", label: "Open", count: 2, items: [], collapsed: true, startIndex: 0 },
      { id: "done", label: "Done", count: 1, items: ["c"], collapsed: false, startIndex: 0 },
    ]
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Sections sections={() => data} cursor={() => 0} renderItem={(item) => <text>{item}</text>} />,
      { width: 30, height: 10 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("Open")
    expect(frame).toContain("Done")
    expect(frame).toContain("c")
    expect(frame).not.toContain("\na\n")
  })

  test("loading skeleton path renders when loading() is true", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Sections
          sections={() => entries()}
          cursor={() => 0}
          renderItem={(item) => <text>{item}</text>}
          loading={() => true}
          skeleton={{ rows: () => 2, renderRow: (index) => <text>{`skel-${index}`}</text> }}
        />
      ),
      { width: 30, height: 10 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("skel-0")
    expect(frame).toContain("skel-1")
  })

  test("empty state when total items is zero", async () => {
    const data: SectionEntry<string, string>[] = [
      { id: "k", label: "K", count: 0, items: [], collapsed: false, startIndex: 0 },
    ]
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Sections
          sections={() => data}
          cursor={() => 0}
          renderItem={(item) => <text>{item}</text>}
          emptyState={<text>nothing here</text>}
        />
      ),
      { width: 30, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("nothing here")
  })

  test("custom renderSectionHeader is used", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Sections
          sections={() => entries()}
          cursor={() => 0}
          renderItem={(item) => <text>{item}</text>}
          renderSectionHeader={(entry) => <text>{`H:${entry.id}`}</text>}
          spacerBetweenSections={false}
        />
      ),
      { width: 30, height: 10 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("H:open")
    expect(frame).toContain("H:done")
  })
})
