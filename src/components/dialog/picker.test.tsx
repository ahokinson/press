import { describe, expect, test } from "bun:test"
import { Picker } from "@components/dialog/picker.tsx"
import { createPicker, type Pickable } from "@models/picker/state.ts"
import { testRender } from "@opentui/solid"

interface Command {
  id: string
  label: string
  group?: string
  hint?: string
  run?: () => void
}

const shape = (command: Command): Pickable => ({
  id: command.id,
  label: command.label,
  group: command.group,
  hint: command.hint,
})

describe("Picker", () => {
  test("renders nothing while the picker is closed", async () => {
    const items: Command[] = [{ id: "a", label: "alpha" }]
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const picker = createPicker<Command>({ items: () => items, shape, onAccept: () => {} })
        // do not open
        return <Picker state={picker} />
      },
      { width: 60, height: 20 },
    )
    await renderOnce()
    expect(captureCharFrame()).not.toContain("alpha")
  })

  test("renders one row per visible item with default layout", async () => {
    const items: Command[] = [
      { id: "save", label: "Save", group: "File", hint: "⌃S" },
      { id: "open", label: "Open", group: "File" },
      { id: "find", label: "Find" },
    ]
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const picker = createPicker<Command>({ items: () => items, shape, onAccept: () => {} })
        picker.open()
        return <Picker state={picker} title="Commands" />
      },
      { width: 70, height: 24 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("Commands")
    expect(frame).toContain("Save")
    expect(frame).toContain("Open")
    expect(frame).toContain("Find")
    expect(frame).toContain("File")
    expect(frame).toContain("⌃S")
  })

  test("position label reflects cursor and total", async () => {
    const items: Command[] = [
      { id: "a", label: "alpha" },
      { id: "b", label: "bravo" },
      { id: "c", label: "charlie" },
    ]
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const picker = createPicker<Command>({ items: () => items, shape, onAccept: () => {} })
        picker.open()
        picker.move(1)
        return <Picker state={picker} />
      },
      { width: 60, height: 20 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("2/3")
  })

  test("renders Empty state when no items match the query", async () => {
    const items: Command[] = [{ id: "a", label: "alpha" }]
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const picker = createPicker<Command>({ items: () => items, shape, onAccept: () => {} })
        picker.open()
        picker.setQuery("zzz")
        return <Picker state={picker} />
      },
      { width: 60, height: 20 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("No results")
    expect(frame).toContain("0/0")
    expect(frame).not.toContain("alpha")
  })

  test("renderItem override replaces the default row", async () => {
    const items: Command[] = [{ id: "a", label: "alpha" }]
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const picker = createPicker<Command>({ items: () => items, shape, onAccept: () => {} })
        picker.open()
        return <Picker state={picker} renderItem={(context) => <text>{`>> ${context.shape().label} <<`}</text>} />
      },
      { width: 60, height: 20 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain(">> alpha <<")
  })

  test("renders the placeholder in the query bar when query is empty", async () => {
    const items: Command[] = [{ id: "a", label: "alpha" }]
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const picker = createPicker<Command>({ items: () => items, shape, onAccept: () => {} })
        picker.open()
        return <Picker state={picker} placeholder="Search commands…" />
      },
      { width: 60, height: 20 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("Search commands")
  })
})
