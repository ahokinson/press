import { describe, expect, test } from "bun:test"
import { createFilterableListState } from "@models/cursor/filterable.ts"
import { createSearchMode } from "@models/cursor/search.ts"
import { createRoot } from "solid-js"

const tick = () => new Promise<void>((resolve) => queueMicrotask(resolve))

interface Row {
  name: string
}

const rows: Row[] = [{ name: "alpha" }, { name: "bravo" }, { name: "charlie" }, { name: "delta" }]

function buildList() {
  // S and F are inferred from defaultSort / sortCycle thanks to `const` generics.
  return createFilterableListState({
    items: () => rows,
    search: (item, q) => item.name.includes(q),
    sorts: { name: (a: Row, b: Row) => a.name.localeCompare(b.name) },
    sortCycle: ["name"],
    defaultSort: "name",
  })
}

describe("createSearchMode", () => {
  test("starts inactive with empty label", () => {
    createRoot((dispose) => {
      const list = buildList()
      const search = createSearchMode(list)
      expect(search.active()).toBe(false)
      expect(search.label()).toBe("")
      expect(search.matchCount()).toBe(4)
      expect(search.totalCount()).toBe(4)
      dispose()
    })
  })

  test("open / close lifecycle keeps the committed filter text", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const list = buildList()
        const search = createSearchMode(list)
        search.open()
        expect(search.active()).toBe(true)
        list.setFilterText("a")
        await tick()
        search.close()
        expect(search.active()).toBe(false)
        expect(list.filterText()).toBe("a")
        dispose()
        resolve()
      })
    })
  })

  test("cancel restores the snapshotted filter text", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const list = buildList()
        list.setFilterText("delta")
        await tick()
        const search = createSearchMode(list)
        search.open()
        list.setFilterText("alpha")
        await tick()
        search.cancel()
        expect(search.active()).toBe(false)
        expect(list.filterText()).toBe("delta")
        dispose()
        resolve()
      })
    })
  })

  test("label reflects match count over total while active", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const list = buildList()
        const search = createSearchMode(list)
        search.open()
        list.setFilterText("a")
        await tick()
        // "alpha", "bravo", "charlie", "delta" all contain 'a'
        expect(search.matchCount()).toBe(4)
        expect(search.totalCount()).toBe(4)
        expect(search.label()).toBe("4/4")
        list.setFilterText("delta")
        await tick()
        expect(search.matchCount()).toBe(1)
        expect(search.label()).toBe("1/4")
        search.close()
        expect(search.label()).toBe("")
        dispose()
        resolve()
      })
    })
  })

  test("custom formatLabel is used when provided", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const list = buildList()
        const search = createSearchMode(list, {
          formatLabel: (matched, total) => `${matched} of ${total} matches`,
        })
        search.open()
        list.setFilterText("delta")
        await tick()
        expect(search.label()).toBe("1 of 4 matches")
        dispose()
        resolve()
      })
    })
  })

  test("open while already active is a no-op (snapshot is preserved)", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const list = buildList()
        list.setFilterText("first")
        await tick()
        const search = createSearchMode(list)
        search.open()
        list.setFilterText("second")
        await tick()
        // Second open() must NOT overwrite the snapshot to "second".
        search.open()
        list.setFilterText("third")
        await tick()
        search.cancel()
        expect(list.filterText()).toBe("first")
        dispose()
        resolve()
      })
    })
  })

  test("close/cancel are no-ops when not active", () => {
    createRoot((dispose) => {
      const list = buildList()
      const search = createSearchMode(list)
      list.setFilterText("kept")
      search.close()
      search.cancel()
      expect(list.filterText()).toBe("kept")
      expect(search.active()).toBe(false)
      dispose()
    })
  })
})
