import { describe, expect, test } from "bun:test"
import { createTableQuery } from "@models/table/query.ts"
import { createRoot, createSignal } from "solid-js"

interface Row {
  id: string
  name: string
  size: number
}

const fixtures: readonly Row[] = [
  { id: "a", name: "banana", size: 3 },
  { id: "b", name: "apple", size: 1 },
  { id: "c", name: "cherry", size: 2 },
]

function compareByKey(a: Row, b: Row, key: string): number {
  if (key === "name") return a.name.localeCompare(b.name)
  if (key === "size") return a.size - b.size
  return 0
}

describe("createTableQuery", () => {
  test("returns input rows when no sort or filter is active", () => {
    createRoot((dispose) => {
      const query = createTableQuery({ rows: () => fixtures })
      expect(query.rows()).toEqual(fixtures)
      expect(query.sort()).toBeUndefined()
      dispose()
    })
  })

  test("defaultSort orders the initial rows", () => {
    createRoot((dispose) => {
      const query = createTableQuery({
        rows: () => fixtures,
        compare: (a, b, sort) => compareByKey(a, b, sort.key),
        defaultSort: { key: "name", desc: false },
      })
      expect(query.rows().map((row) => row.id)).toEqual(["b", "a", "c"])
      dispose()
    })
  })

  test("desc inverts the comparator result", () => {
    createRoot((dispose) => {
      const query = createTableQuery({
        rows: () => fixtures,
        compare: (a, b, sort) => compareByKey(a, b, sort.key),
        defaultSort: { key: "size", desc: true },
      })
      expect(query.rows().map((row) => row.id)).toEqual(["a", "c", "b"])
      dispose()
    })
  })

  test("cycleSort moves asc → desc → none", () => {
    createRoot((dispose) => {
      const query = createTableQuery({
        rows: () => fixtures,
        compare: (a, b, sort) => compareByKey(a, b, sort.key),
      })
      query.cycleSort("name")
      expect(query.sort()).toEqual({ key: "name", desc: false })
      query.cycleSort("name")
      expect(query.sort()).toEqual({ key: "name", desc: true })
      query.cycleSort("name")
      expect(query.sort()).toBeUndefined()
      dispose()
    })
  })

  test("cycleSort on a different key resets to asc", () => {
    createRoot((dispose) => {
      const query = createTableQuery({
        rows: () => fixtures,
        compare: (a, b, sort) => compareByKey(a, b, sort.key),
        defaultSort: { key: "size", desc: true },
      })
      query.cycleSort("name")
      expect(query.sort()).toEqual({ key: "name", desc: false })
      dispose()
    })
  })

  test("filter predicate narrows rows by the live query", () => {
    createRoot((dispose) => {
      const query = createTableQuery({
        rows: () => fixtures,
        filter: (row, text) => row.name.includes(text),
      })
      query.setQuery("an")
      expect(query.rows().map((row) => row.id)).toEqual(["a"])
      query.setQuery("")
      expect(query.rows().length).toBe(3)
      dispose()
    })
  })

  test("filter runs before sort", () => {
    createRoot((dispose) => {
      const query = createTableQuery({
        rows: () => fixtures,
        compare: (a, b, sort) => compareByKey(a, b, sort.key),
        filter: (row, text) => row.name.includes(text),
        defaultSort: { key: "size", desc: false },
      })
      query.setQuery("e")
      expect(query.rows().map((row) => row.id)).toEqual(["b", "c"])
      dispose()
    })
  })

  test("reactive rows source flows through to output", () => {
    createRoot((dispose) => {
      const [source, setSource] = createSignal<readonly Row[]>(fixtures)
      const query = createTableQuery({
        rows: source,
        compare: (a, b, sort) => compareByKey(a, b, sort.key),
        defaultSort: { key: "size", desc: false },
      })
      expect(query.rows().map((row) => row.id)).toEqual(["b", "c", "a"])
      setSource([...fixtures, { id: "d", name: "date", size: 0 }])
      expect(query.rows().map((row) => row.id)).toEqual(["d", "b", "c", "a"])
      dispose()
    })
  })

  test("setSort replaces the active sort", () => {
    createRoot((dispose) => {
      const query = createTableQuery({
        rows: () => fixtures,
        compare: (a, b, sort) => compareByKey(a, b, sort.key),
      })
      query.setSort({ key: "size", desc: false })
      expect(query.rows().map((row) => row.id)).toEqual(["b", "c", "a"])
      query.setSort(undefined)
      expect(query.rows()).toEqual(fixtures)
      dispose()
    })
  })
})
