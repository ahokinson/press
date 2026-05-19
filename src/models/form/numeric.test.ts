import { describe, expect, test } from "bun:test"
import { createNumericEditor } from "@models/form/numeric.ts"

describe("createNumericEditor", () => {
  test("starts with clamped initial value", () => {
    const e = createNumericEditor({ initial: () => 7, min: 0, max: 5, onCommit: () => {} })
    expect(e.editing()).toBe("5")
  })

  test("increment / decrement clamp to bounds", () => {
    const e = createNumericEditor({ initial: () => 3, min: 0, max: 5, onCommit: () => {} })
    e.increment()
    expect(e.editing()).toBe("4")
    e.increment()
    expect(e.editing()).toBe("5")
    e.increment()
    expect(e.editing()).toBe("5") // bounded
    e.decrement()
    e.decrement()
    e.decrement()
    e.decrement()
    e.decrement()
    e.decrement()
    expect(e.editing()).toBe("0")
  })

  test("custom step is respected", () => {
    const e = createNumericEditor({ initial: () => 0, min: 0, max: 100, step: 10, onCommit: () => {} })
    e.increment()
    expect(e.editing()).toBe("10")
    e.increment()
    expect(e.editing()).toBe("20")
  })

  test("commit fires onCommit only when value changed; resets buffer to canonical form", () => {
    const committed: number[] = []
    let stored = 5
    const e = createNumericEditor({
      initial: () => stored,
      min: 0,
      max: 100,
      onCommit: (v) => {
        committed.push(v)
        stored = v
      },
    })
    e.commit()
    expect(committed).toEqual([])

    e.setEditing("12")
    e.commit()
    expect(committed).toEqual([12])
    expect(e.editing()).toBe("12")
  })

  test("commit clamps and persists the canonical value", () => {
    let last = 0
    const e = createNumericEditor({
      initial: () => 0,
      min: 0,
      max: 10,
      onCommit: (v) => {
        last = v
      },
    })
    e.setEditing("999")
    e.commit()
    expect(last).toBe(10)
    expect(e.editing()).toBe("10")
  })

  test("commit on garbage input resets from initial()", () => {
    const initial = 4
    const e = createNumericEditor({ initial: () => initial, min: 0, max: 10, onCommit: () => {} })
    e.setEditing("not a number")
    e.commit()
    expect(e.editing()).toBe("4")
  })

  test("reset reloads from initial()", () => {
    let initial = 2
    const e = createNumericEditor({ initial: () => initial, onCommit: () => {} })
    e.setEditing("99")
    initial = 5
    e.reset()
    expect(e.editing()).toBe("5")
  })

  test("increment from NaN buffer uses initial() as base", () => {
    const e = createNumericEditor({ initial: () => 3, min: 0, max: 100, onCommit: () => {} })
    e.setEditing("garbage")
    e.increment()
    expect(e.editing()).toBe("4")
  })
})
