import { describe, expect, test } from "bun:test"
import { createFilterableListState } from "@models/cursor/filterable.ts"
import { createRoot, createSignal } from "solid-js"

const tick = () => new Promise<void>((r) => queueMicrotask(r))

interface Row {
  name: string
  group: "a" | "b"
  rank: number
}

type SortField = "name" | "rank"
type FilterKey = "high"
type GroupKey = "a" | "b"

const rows: Row[] = [
  { name: "alpha", group: "a", rank: 3 },
  { name: "bravo", group: "a", rank: 1 },
  { name: "charlie", group: "b", rank: 2 },
  { name: "delta", group: "b", rank: 4 },
]

function build() {
  return createFilterableListState<Row, SortField, FilterKey, GroupKey>({
    items: () => rows,
    search: (item, q) => item.name.includes(q),
    sorts: {
      name: (a, b) => a.name.localeCompare(b.name),
      rank: (a, b) => a.rank - b.rank,
    },
    sortCycle: ["name", "rank"],
    defaultSort: "name",
    filters: { high: (item) => item.rank >= 3 },
    filterCycle: ["high"],
    section: { key: (item) => item.group },
  })
}

describe("createFilterableListState", () => {
  test("sorts items by default sort with section grouping", () => {
    createRoot(() => {
      const s = build()
      expect(s.visibleItems().map((i) => i.name)).toEqual(["alpha", "bravo", "charlie", "delta"])
    })
  })

  test("filterText narrows via search predicate", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const s = build()
        s.setFilterText("a")
        await tick()
        expect(s.visibleItems().map((i) => i.name)).toEqual(["alpha", "bravo", "charlie", "delta"])
        s.setFilterText("delta")
        await tick()
        expect(s.visibleItems().map((i) => i.name)).toEqual(["delta"])
        dispose()
        resolve()
      })
    })
  })

  test("cycleSortBy steps through sortCycle and changes order within sections", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const s = build()
        s.cycleSortBy()
        await tick()
        expect(s.sortBy()).toBe("rank")
        // group a: bravo(1) before alpha(3); group b: charlie(2) before delta(4)
        expect(s.visibleItems().map((i) => i.name)).toEqual(["bravo", "alpha", "charlie", "delta"])
        s.cycleSortBy()
        await tick()
        expect(s.sortBy()).toBe("name")
        dispose()
        resolve()
      })
    })
  })

  test("setStatusFilter applies the category filter; null clears it", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const s = build()
        s.setStatusFilter("high")
        await tick()
        expect(s.visibleItems().map((i) => i.name)).toEqual(["alpha", "delta"])
        s.setStatusFilter(null)
        await tick()
        expect(s.visibleItems().length).toBe(4)
        dispose()
        resolve()
      })
    })
  })

  test("cycleStatusFilter wraps and resets cursor to 0", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const s = build()
        s.setCursor(3)
        await tick()
        expect(s.cursor()).toBe(3)
        s.cycleStatusFilter()
        await tick()
        expect(s.statusFilter()).toBe("high")
        expect(s.cursor()).toBe(0)
        dispose()
        resolve()
      })
    })
  })

  test("toggleSection collapses items and updates visibleItems", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const s = build()
        s.toggleSection("a")
        await tick()
        expect(s.visibleItems().map((i) => i.name)).toEqual(["charlie", "delta"])
        expect(s.collapsedSections().has("a")).toBe(true)
        s.toggleSection("a")
        await tick()
        expect(s.visibleItems().length).toBe(4)
        dispose()
        resolve()
      })
    })
  })

  test("cursor clamps to visibleItems length when items shrink", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const s = build()
        s.setCursor(3)
        await tick()
        expect(s.cursor()).toBe(3)
        s.setStatusFilter("high") // shrinks to 2 items
        await tick()
        s.setCursor((c) => c) // re-clamps
        await tick()
        expect(s.cursor()).toBeLessThanOrEqual(1)
        dispose()
        resolve()
      })
    })
  })

  test("selectedItem tracks cursor over visibleItems", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const s = build()
        s.setCursor(0)
        await tick()
        expect(s.selectedItem()?.name).toBe("alpha")
        s.setCursor(2)
        await tick()
        expect(s.selectedItem()?.name).toBe("charlie")
        dispose()
        resolve()
      })
    })
  })

  test("scroll-sync accounts for section header + spacer rows", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const [items, setItems] = createSignal<Row[]>(rows)
        const scrolls: { x: number; y: number }[] = []
        const s = createFilterableListState<Row, "name", "none", "a" | "b">({
          items,
          sorts: { name: (a, b) => a.name.localeCompare(b.name) },
          sortCycle: ["name"],
          defaultSort: "name",
          section: { key: (item) => item.group },
        })
        s.setScrollRef({ scrollTo: (p) => scrolls.push(typeof p === "number" ? { x: 0, y: p } : p) })
        s.setScrollViewportHeight(3)
        await tick()
        // visible layout: [hdr a][alpha][bravo][space][hdr b][charlie][delta]
        // cursor 3 (delta) sits at row 6 → must scroll down.
        s.setCursor(3)
        await tick()
        setItems([...rows])
        await tick()
        expect(scrolls.some((p) => p.y > 0)).toBe(true)
        dispose()
        resolve()
      })
    })
  })

  test("positionLabel reflects cursor and visible count", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const s = build()
        expect(s.positionLabel()).toBe("1/4")
        s.setCursor(2)
        await tick()
        expect(s.positionLabel()).toBe("3/4")
        s.setStatusFilter("high")
        await tick()
        expect(s.positionLabel()).toMatch(/\/2$/)
        dispose()
        resolve()
      })
    })
  })

  test("cycleStatusFilter is a no-op when filterCycle is absent", () => {
    createRoot((dispose) => {
      const s = createFilterableListState<Row, SortField, FilterKey, GroupKey>({
        items: () => rows,
        sorts: { name: (a, b) => a.name.localeCompare(b.name), rank: (a, b) => a.rank - b.rank },
        sortCycle: ["name"],
        defaultSort: "name",
        // intentionally no filterCycle
      })
      expect(s.statusFilter()).toBeNull()
      s.cycleStatusFilter()
      expect(s.statusFilter()).toBeNull()
      dispose()
    })
  })

  test("cycleStatusFilter is a no-op when filterCycle is empty", () => {
    createRoot((dispose) => {
      const s = createFilterableListState<Row, SortField, FilterKey, GroupKey>({
        items: () => rows,
        sorts: { name: (a, b) => a.name.localeCompare(b.name), rank: (a, b) => a.rank - b.rank },
        sortCycle: ["name"],
        defaultSort: "name",
        filterCycle: [],
      })
      s.cycleStatusFilter()
      expect(s.statusFilter()).toBeNull()
      dispose()
    })
  })
})
