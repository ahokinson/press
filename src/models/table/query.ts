import { type Accessor, createMemo, createSignal } from "solid-js"

/** Active sort column and direction. Consumed by `Table` via its `sort` prop. */
export interface SortState {
  key: string
  desc: boolean
}

/**
 * Predicate applied to each row when filtering. Return `true` to keep the
 * row. Receives the row plus the current query string.
 */
export type FilterPredicate<T> = (row: T, query: string) => boolean

export interface TableQueryOptions<T> {
  rows: Accessor<readonly T[]>
  /**
   * Per-`SortState` comparator. Receives two rows and the active sort.
   * Return <0 if `a` precedes `b`, >0 if `b` precedes `a`, 0 if equal.
   * Comparator results are negated automatically when `desc` is true.
   */
  compare?: (a: T, b: T, sort: SortState) => number
  /** Default sort applied on first read. */
  defaultSort?: SortState
  /** Filter predicate. When unset, the query string has no effect. */
  filter?: FilterPredicate<T>
}

export interface TableQuery<T> {
  /** Visible rows after filter + sort. Reactive. */
  rows: Accessor<readonly T[]>
  sort: Accessor<SortState | undefined>
  setSort: (next: SortState | undefined) => void
  /**
   * Cycle the sort for `key`: `asc → desc → none → asc`. When `key` differs
   * from the active sort, jumps straight to `asc`.
   */
  cycleSort: (key: string) => void
  query: Accessor<string>
  setQuery: (next: string) => void
}

/**
 * Headless state for a sortable, filterable Table. The caller provides the
 * row source plus a comparator. This factory owns the sort and query signals
 * and produces a derived `rows()` for the Table to render. Press's `Table`
 * is purely presentational.
 */
export function createTableQuery<T>(options: TableQueryOptions<T>): TableQuery<T> {
  const [sort, setSortRaw] = createSignal<SortState | undefined>(options.defaultSort)
  const [query, setQuery] = createSignal("")

  function setSort(next: SortState | undefined): void {
    setSortRaw(next)
  }

  function cycleSort(key: string): void {
    const active = sort()
    if (!active || active.key !== key) {
      setSortRaw({ key, desc: false })
      return
    }
    if (!active.desc) {
      setSortRaw({ key, desc: true })
      return
    }
    setSortRaw(undefined)
  }

  const filtered = createMemo<readonly T[]>(() => {
    const predicate = options.filter
    if (!predicate) return options.rows()
    const text = query()
    return options.rows().filter((row) => predicate(row, text))
  })

  const rows = createMemo<readonly T[]>(() => {
    const visible = filtered()
    const compare = options.compare
    const active = sort()
    if (!compare || !active) return visible
    const direction = active.desc ? -1 : 1
    return visible.slice().sort((a, b) => compare(a, b, active) * direction)
  })

  return { rows, sort, setSort, cycleSort, query, setQuery }
}
