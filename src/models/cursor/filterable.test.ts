import { describe, expect, test } from "bun:test"
import { createFilterableListState } from "@models/cursor/filterable.ts"
import { createRoot } from "solid-js"

const tick = () => new Promise<void>((resolve) => queueMicrotask(resolve))

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
    search: (item, query) => item.name.includes(query),
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
      const list = build()
      expect(list.visibleItems().map((item) => item.name)).toEqual(["alpha", "bravo", "charlie", "delta"])
    })
  })

  test("filterText narrows via search predicate", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const list = build()
        list.setFilterText("a")
        await tick()
        expect(list.visibleItems().map((item) => item.name)).toEqual(["alpha", "bravo", "charlie", "delta"])
        list.setFilterText("delta")
        await tick()
        expect(list.visibleItems().map((item) => item.name)).toEqual(["delta"])
        dispose()
        resolve()
      })
    })
  })

  test("cycleSortBy steps through sortCycle and changes order within sections", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const list = build()
        list.cycleSortBy()
        await tick()
        expect(list.sortBy()).toBe("rank")
        // group a: bravo(1) before alpha(3); group b: charlie(2) before delta(4)
        expect(list.visibleItems().map((item) => item.name)).toEqual(["bravo", "alpha", "charlie", "delta"])
        list.cycleSortBy()
        await tick()
        expect(list.sortBy()).toBe("name")
        dispose()
        resolve()
      })
    })
  })

  test("setStatusFilter applies the category filter; null clears it", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const list = build()
        list.setStatusFilter("high")
        await tick()
        expect(list.visibleItems().map((item) => item.name)).toEqual(["alpha", "delta"])
        list.setStatusFilter(null)
        await tick()
        expect(list.visibleItems().length).toBe(4)
        dispose()
        resolve()
      })
    })
  })

  test("cycleStatusFilter wraps and resets cursor to 0", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const list = build()
        list.setCursor(3)
        await tick()
        expect(list.cursor()).toBe(3)
        list.cycleStatusFilter()
        await tick()
        expect(list.statusFilter()).toBe("high")
        expect(list.cursor()).toBe(0)
        dispose()
        resolve()
      })
    })
  })

  test("toggleSection collapses items and updates visibleItems", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const list = build()
        list.toggleSection("a")
        await tick()
        expect(list.visibleItems().map((item) => item.name)).toEqual(["charlie", "delta"])
        expect(list.collapsedSections().has("a")).toBe(true)
        list.toggleSection("a")
        await tick()
        expect(list.visibleItems().length).toBe(4)
        dispose()
        resolve()
      })
    })
  })

  test("cursor clamps to visibleItems length when items shrink", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const list = build()
        list.setCursor(3)
        await tick()
        expect(list.cursor()).toBe(3)
        list.setStatusFilter("high") // shrinks to 2 items
        await tick()
        list.setCursor((current) => current) // re-clamps
        await tick()
        expect(list.cursor()).toBeLessThanOrEqual(1)
        dispose()
        resolve()
      })
    })
  })

  test("selectedItem tracks cursor over visibleItems", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const list = build()
        list.setCursor(0)
        await tick()
        expect(list.selectedItem()?.name).toBe("alpha")
        list.setCursor(2)
        await tick()
        expect(list.selectedItem()?.name).toBe("charlie")
        dispose()
        resolve()
      })
    })
  })

  test("scrollRow accounts for section header + spacer rows", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const list = createFilterableListState<Row, "name", "none", "a" | "b">({
          items: () => rows,
          sorts: { name: (a, b) => a.name.localeCompare(b.name) },
          sortCycle: ["name"],
          defaultSort: "name",
          section: { key: (item) => item.group },
        })
        await tick()
        // visible layout: [hdr a][alpha][bravo][space][hdr b][charlie][delta]
        // cursor 0 = first alpha = row 1 (just past the "a" header).
        list.setCursor(0)
        await tick()
        expect(list.scrollRow()).toBe(1)
        // cursor 3 = delta = row 6 (after a-hdr + 2 items + spacer + b-hdr + charlie).
        list.setCursor(3)
        await tick()
        expect(list.scrollRow()).toBe(6)
        dispose()
        resolve()
      })
    })
  })

  test("positionLabel reflects cursor and visible count", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const list = build()
        expect(list.positionLabel()).toBe("1/4")
        list.setCursor(2)
        await tick()
        expect(list.positionLabel()).toBe("3/4")
        list.setStatusFilter("high")
        await tick()
        expect(list.positionLabel()).toMatch(/\/2$/)
        dispose()
        resolve()
      })
    })
  })

  test("cycleStatusFilter is a no-op when filterCycle is absent", () => {
    createRoot((dispose) => {
      const list = createFilterableListState<Row, SortField, FilterKey, GroupKey>({
        items: () => rows,
        sorts: { name: (a, b) => a.name.localeCompare(b.name), rank: (a, b) => a.rank - b.rank },
        sortCycle: ["name"],
        defaultSort: "name",
        // intentionally no filterCycle
      })
      expect(list.statusFilter()).toBeNull()
      list.cycleStatusFilter()
      expect(list.statusFilter()).toBeNull()
      dispose()
    })
  })

  test("cycleStatusFilter is a no-op when filterCycle is empty", () => {
    createRoot((dispose) => {
      const list = createFilterableListState<Row, SortField, FilterKey, GroupKey>({
        items: () => rows,
        sorts: { name: (a, b) => a.name.localeCompare(b.name), rank: (a, b) => a.rank - b.rank },
        sortCycle: ["name"],
        defaultSort: "name",
        filterCycle: [],
      })
      list.cycleStatusFilter()
      expect(list.statusFilter()).toBeNull()
      dispose()
    })
  })
})
