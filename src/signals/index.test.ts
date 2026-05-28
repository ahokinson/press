import { describe, expect, test } from "bun:test"
import { createClampedSetter, cumulativeOffsets } from "@signals"
import { createRoot, createSignal } from "solid-js"

describe("createClampedSetter", () => {
  test("clamps a raw numeric value into [0, maxIndex]", () => {
    createRoot((dispose) => {
      const [raw, setRaw] = createSignal(0)
      const clamped = createClampedSetter(setRaw, () => 4)
      clamped(10)
      expect(raw()).toBe(4)
      clamped(-1)
      expect(raw()).toBe(0)
      clamped(2)
      expect(raw()).toBe(2)
      dispose()
    })
  })

  test("clamps an updater function result into [0, maxIndex]", () => {
    createRoot((dispose) => {
      const [raw, setRaw] = createSignal(2)
      const clamped = createClampedSetter(setRaw, () => 4)
      clamped((prev) => prev + 10)
      expect(raw()).toBe(4)
      clamped((prev) => prev - 10)
      expect(raw()).toBe(0)
      clamped((prev) => prev + 2)
      expect(raw()).toBe(2)
      dispose()
    })
  })
})

describe("cumulativeOffsets", () => {
  test("returns 0 followed by running sum for uniform rows", () => {
    const offsets = cumulativeOffsets([1, 2, 3], () => 1)
    expect(offsets).toEqual([0, 1, 2, 3])
  })

  test("handles variable-height rows", () => {
    const rows = [
      { kind: "header" as const },
      { kind: "item" as const },
      { kind: "item" as const, expanded: true },
      { kind: "item" as const },
    ]
    const offsets = cumulativeOffsets(rows, (row) => {
      if (row.kind === "header") return 2
      return row.expanded ? 2 : 1
    })
    expect(offsets).toEqual([0, 2, 3, 5, 6])
  })

  test("empty rows yields [0]", () => {
    expect(cumulativeOffsets([], () => 1)).toEqual([0])
  })

  test("zero-height row leaves offset unchanged", () => {
    const offsets = cumulativeOffsets([1, 2, 3], (_row, index) => (index === 1 ? 0 : 1))
    expect(offsets).toEqual([0, 1, 1, 2])
  })
})
