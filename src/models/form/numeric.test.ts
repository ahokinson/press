import { describe, expect, test } from "bun:test"
import { createNumericEditor } from "@models/form/numeric.ts"

describe("createNumericEditor", () => {
  test("starts with clamped initial value", () => {
    const editor = createNumericEditor({ initial: () => 7, min: 0, max: 5, onCommit: () => {} })
    expect(editor.editing()).toBe("5")
  })

  test("increment / decrement clamp to bounds", () => {
    const editor = createNumericEditor({ initial: () => 3, min: 0, max: 5, onCommit: () => {} })
    editor.increment()
    expect(editor.editing()).toBe("4")
    editor.increment()
    expect(editor.editing()).toBe("5")
    editor.increment()
    expect(editor.editing()).toBe("5") // bounded
    editor.decrement()
    editor.decrement()
    editor.decrement()
    editor.decrement()
    editor.decrement()
    editor.decrement()
    expect(editor.editing()).toBe("0")
  })

  test("custom step is respected", () => {
    const editor = createNumericEditor({ initial: () => 0, min: 0, max: 100, step: 10, onCommit: () => {} })
    editor.increment()
    expect(editor.editing()).toBe("10")
    editor.increment()
    expect(editor.editing()).toBe("20")
  })

  test("commit fires onCommit only when value changed; resets buffer to canonical form", () => {
    const committed: number[] = []
    let stored = 5
    const editor = createNumericEditor({
      initial: () => stored,
      min: 0,
      max: 100,
      onCommit: (value) => {
        committed.push(value)
        stored = value
      },
    })
    editor.commit()
    expect(committed).toEqual([])

    editor.setEditing("12")
    editor.commit()
    expect(committed).toEqual([12])
    expect(editor.editing()).toBe("12")
  })

  test("commit clamps and persists the canonical value", () => {
    let last = 0
    const editor = createNumericEditor({
      initial: () => 0,
      min: 0,
      max: 10,
      onCommit: (value) => {
        last = value
      },
    })
    editor.setEditing("999")
    editor.commit()
    expect(last).toBe(10)
    expect(editor.editing()).toBe("10")
  })

  test("commit on garbage input resets from initial()", () => {
    const initial = 4
    const editor = createNumericEditor({ initial: () => initial, min: 0, max: 10, onCommit: () => {} })
    editor.setEditing("not a number")
    editor.commit()
    expect(editor.editing()).toBe("4")
  })

  test("reset reloads from initial()", () => {
    let initial = 2
    const editor = createNumericEditor({ initial: () => initial, onCommit: () => {} })
    editor.setEditing("99")
    initial = 5
    editor.reset()
    expect(editor.editing()).toBe("5")
  })

  test("increment from NaN buffer uses initial() as base", () => {
    const editor = createNumericEditor({ initial: () => 3, min: 0, max: 100, onCommit: () => {} })
    editor.setEditing("garbage")
    editor.increment()
    expect(editor.editing()).toBe("4")
  })
})
