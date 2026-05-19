import { describe, expect, test } from "bun:test"
import { cumulativeOffsets } from "@signals"

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
    const offsets = cumulativeOffsets(rows, (r) => {
      if (r.kind === "header") return 2
      return r.expanded ? 2 : 1
    })
    expect(offsets).toEqual([0, 2, 3, 5, 6])
  })

  test("empty rows yields [0]", () => {
    expect(cumulativeOffsets([], () => 1)).toEqual([0])
  })

  test("zero-height row leaves offset unchanged", () => {
    const offsets = cumulativeOffsets([1, 2, 3], (_r, i) => (i === 1 ? 0 : 1))
    expect(offsets).toEqual([0, 1, 1, 2])
  })
})
