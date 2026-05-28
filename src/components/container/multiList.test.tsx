import { describe, expect, test } from "bun:test"
import { MultiList } from "@components/container/multiList.tsx"
import { createMultiSelectState } from "@models/multiselect/index.ts"
import { testRender } from "@opentui/solid"

const items = [
  { id: "a", label: "Alpha" },
  { id: "b", label: "Beta" },
  { id: "c", label: "Gamma" },
]

function makeState() {
  return createMultiSelectState({ items: () => items, key: (i) => i.id })
}

describe("MultiList", () => {
  test("renders each item via renderItem", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const state = makeState()
        return (
          <MultiList
            items={state.items}
            cursor={state.cursor}
            isSelected={state.isSelected}
            renderItem={(item) => <text>{item.label}</text>}
          />
        )
      },
      { width: 40, height: 10 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("Alpha")
    expect(frame).toContain("Beta")
    expect(frame).toContain("Gamma")
  })

  test("renders unchecked boxes for unselected items", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const state = makeState()
        return (
          <MultiList
            items={state.items}
            cursor={state.cursor}
            isSelected={state.isSelected}
            renderItem={(item) => <text>{item.label}</text>}
          />
        )
      },
      { width: 40, height: 10 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("☐")
  })

  test("renders checked box for selected item", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const state = makeState()
        state.toggleCursor()
        return (
          <MultiList
            items={state.items}
            cursor={state.cursor}
            isSelected={state.isSelected}
            renderItem={(item) => <text>{item.label}</text>}
          />
        )
      },
      { width: 40, height: 10 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("☑")
  })

  test("renders the empty message when there are no items", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const state = createMultiSelectState({ items: () => [], key: (i: { id: string }) => i.id })
        return (
          <MultiList
            items={state.items}
            cursor={state.cursor}
            isSelected={state.isSelected}
            renderItem={() => <text />}
            emptyMessage="nothing"
          />
        )
      },
      { width: 30, height: 10 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("nothing")
  })

  // Background highlight can't be asserted via captureCharFrame (no color metadata);
  // these tests verify the component renders without error under each focus state.
  test("applies highlight when focused and cursor is on row", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const state = makeState()
        return (
          <MultiList
            items={state.items}
            cursor={state.cursor}
            isSelected={state.isSelected}
            focused={() => true}
            renderItem={(item) => <text>{item.label}</text>}
          />
        )
      },
      { width: 40, height: 10 },
    )
    await renderOnce()
    // Row 0 is at the cursor; the frame should still contain Alpha
    expect(captureCharFrame()).toContain("Alpha")
  })

  test("no highlight when not focused", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const state = makeState()
        return (
          <MultiList
            items={state.items}
            cursor={state.cursor}
            isSelected={state.isSelected}
            focused={() => false}
            renderItem={(item) => <text>{item.label}</text>}
          />
        )
      },
      { width: 40, height: 10 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("Alpha")
  })

  test("selectAll marks all items checked", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const state = makeState()
        state.selectAll()
        return (
          <MultiList
            items={state.items}
            cursor={state.cursor}
            isSelected={state.isSelected}
            renderItem={(item) => <text>{item.label}</text>}
          />
        )
      },
      { width: 40, height: 10 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    // All three rows should show checked boxes — count occurrences
    const checkedCount = (frame.match(/☑/g) ?? []).length
    expect(checkedCount).toBe(3)
  })

  test("checkbox updates reactively when toggled after initial render", async () => {
    let state!: ReturnType<typeof makeState>
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        state = makeState()
        return (
          <MultiList
            items={state.items}
            cursor={state.cursor}
            isSelected={state.isSelected}
            renderItem={(item) => <text>{item.label}</text>}
          />
        )
      },
      { width: 40, height: 10 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("☐")

    state.toggleCursor()
    await renderOnce()
    expect(captureCharFrame()).toContain("☑")
  })

  test("checked accessor in renderItem updates reactively when selection changes", async () => {
    let state!: ReturnType<typeof makeState>
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        state = makeState()
        return (
          <MultiList
            items={state.items}
            cursor={state.cursor}
            isSelected={state.isSelected}
            renderItem={(item, _i, _active, checked) => <text>{checked() ? `[${item.label}]` : item.label}</text>}
          />
        )
      },
      { width: 40, height: 10 },
    )
    await renderOnce()
    expect(captureCharFrame()).not.toContain("[Alpha]")

    state.toggleCursor()
    await renderOnce()
    expect(captureCharFrame()).toContain("[Alpha]")
  })

  test("clearAll unmarks all items", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const state = makeState()
        state.selectAll()
        state.clearAll()
        return (
          <MultiList
            items={state.items}
            cursor={state.cursor}
            isSelected={state.isSelected}
            renderItem={(item) => <text>{item.label}</text>}
          />
        )
      },
      { width: 40, height: 10 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).not.toContain("☑")
    expect(frame).toContain("☐")
  })
})
