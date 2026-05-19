import { describe, expect, test } from "bun:test"
import { groupBySection } from "@components/container/sections.tsx"

interface Row {
  name: string
  group: "a" | "b" | "c"
}

const rows: Row[] = [
  { name: "alpha", group: "a" },
  { name: "bravo", group: "a" },
  { name: "charlie", group: "b" },
  { name: "delta", group: "b" },
  { name: "echo", group: "c" },
]

describe("groupBySection", () => {
  test("groups contiguous items into sections with sequential startIndex", () => {
    const sections = groupBySection<Row, "a" | "b" | "c">({
      items: rows,
      sectionKey: (r) => r.group,
      collapsedSections: new Set(),
    })
    expect(sections.map((s) => s.id)).toEqual(["a", "b", "c"])
    expect(sections.map((s) => s.startIndex)).toEqual([0, 2, 4])
    expect(sections[0]!.items.length).toBe(2)
    expect(sections[1]!.items.length).toBe(2)
    expect(sections[2]!.items.length).toBe(1)
  })

  test("collapsed sections show zero visible items but retain count", () => {
    const sections = groupBySection<Row, "a" | "b" | "c">({
      items: rows,
      sectionKey: (r) => r.group,
      collapsedSections: new Set(["a"]),
    })
    expect(sections[0]!.collapsed).toBe(true)
    expect(sections[0]!.items.length).toBe(0)
    expect(sections[0]!.count).toBe(2)
    // After collapse, b/c shift up — startIndex of b is 0 (visible-coord), c is 2.
    expect(sections[1]!.startIndex).toBe(0)
    expect(sections[2]!.startIndex).toBe(2)
  })

  test("sectionOrder reorders entries", () => {
    const sections = groupBySection<Row, "a" | "b" | "c">({
      items: rows,
      sectionKey: (r) => r.group,
      collapsedSections: new Set(),
      sectionOrder: (a, b) => (a > b ? -1 : a < b ? 1 : 0),
    })
    expect(sections.map((s) => s.id)).toEqual(["c", "b", "a"])
  })

  test("sectionLabel callback drives the label", () => {
    const sections = groupBySection<Row, "a" | "b" | "c">({
      items: rows,
      sectionKey: (r) => r.group,
      collapsedSections: new Set(),
      sectionLabel: (key, count) => `${key.toUpperCase()} (${count})`,
    })
    expect(sections[0]!.label).toBe("A (2)")
    expect(sections[2]!.label).toBe("C (1)")
  })

  test("counts derive from allItems when filtering hides some items", () => {
    const filtered = rows.filter((r) => r.group !== "c")
    const sections = groupBySection<Row, "a" | "b" | "c">({
      items: filtered,
      allItems: rows,
      sectionKey: (r) => r.group,
      collapsedSections: new Set(),
    })
    expect(sections.map((s) => s.id)).toEqual(["a", "b"])
    expect(sections[0]!.count).toBe(2)
    expect(sections[1]!.count).toBe(2)
  })
})
