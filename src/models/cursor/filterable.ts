import { createCycler, createNavigationCursor } from "@signals"
import { createMemo, createSignal } from "solid-js"

export type SectionKey = string | number

export interface FilterableListSectionConfig<T, K extends SectionKey> {
  key: (item: T) => K
  /** Order sections in the visible list. Default: natural ascending (numeric or lexical). */
  order?: (a: K, b: K) => number
  /** Rows that a section's header occupies. Default 1. */
  headerRows?: (key: K) => number
  /** Blank rows between adjacent sections. Default: 1. */
  spacerRows?: number
}

export interface FilterableListConfig<T, S extends string, F extends string, K extends SectionKey = SectionKey> {
  items: () => readonly T[]
  /** Text-filter predicate. Receives the lowercased query. Empty string applies no text filter. */
  search?: (item: T, query: string) => boolean
  sorts: Record<S, (a: T, b: T) => number>
  sortCycle: readonly S[]
  defaultSort: S
  filters?: Record<F, (item: T) => boolean>
  filterCycle?: readonly F[]
  defaultFilter?: F | null
  section?: FilterableListSectionConfig<T, K>
}

export interface FilterableListState<T, S extends string, F extends string, K extends SectionKey = SectionKey> {
  /** Raw input from `config.items`. */
  items: () => readonly T[]
  cursor: () => number
  setCursor: (value: number | ((previous: number) => number)) => void
  filterText: () => string
  setFilterText: (value: string) => void
  sortBy: () => S
  setSortBy: (value: S) => void
  cycleSortBy: () => void
  statusFilter: () => F | null
  setStatusFilter: (value: F | null) => void
  /**
   * Advance through `config.filterCycle`. No-op when `filterCycle` is absent
   * or empty. Resets `cursor` to 0 on a successful cycle.
   */
  cycleStatusFilter: () => void
  collapsedSections: () => ReadonlySet<K>
  toggleSection: (id: K) => void
  filteredItems: () => T[]
  visibleItems: () => T[]
  selectedItem: () => T | undefined
  positionLabel: () => string
  /**
   * Y position of the cursor in scrollbox row-coordinate space. Accounts for
   * section header rows and inter-section spacers when `config.section` is
   * set. Feed to `createScrollboxSync` to keep the active row in view.
   */
  scrollRow: () => number
}

function defaultOrder<K extends SectionKey>(a: K, b: K): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

/**
 * Reactive list pipeline: text filter → category filter → sort → section
 * group → collapse → cursor → scroll sync. The caller supplies predicates
 * and comparators. The primitive owns the signals and the scroll math.
 *
 * Section model: items with the same `section.key(item)` form a section.
 * Sections are ordered by `section.order` (default: natural ascending).
 * Within a section, items keep their post-sort order. Toggling a section
 * into `collapsedSections` hides its rows from `visibleItems` and the
 * scroll math.
 *
 * Scroll math accounts for header and spacer rows so the cursor stays in
 * the viewport when headers shift content down.
 */
export function createFilterableListState<
  T,
  const S extends string,
  const F extends string,
  K extends SectionKey = SectionKey,
>(config: FilterableListConfig<T, S, F, K>): FilterableListState<T, S, F, K> {
  const [filterText, setFilterText] = createSignal("")
  const [sortBy, setSortBy] = createSignal<S>(config.defaultSort)
  const [statusFilter, setStatusFilter] = createSignal<F | null>(config.defaultFilter ?? null)
  const [collapsedSections, setCollapsedSections] = createSignal<ReadonlySet<K>>(new Set<K>())

  const sectionOrder = config.section?.order ?? defaultOrder<K>
  const headerRows = config.section?.headerRows ?? (() => 1)
  const spacerRows = config.section?.spacerRows ?? 1

  const filteredItems = createMemo<T[]>(() => {
    const activeFilter = statusFilter()
    const query = filterText().toLowerCase()
    let result: T[] = [...config.items()]
    if (activeFilter !== null && config.filters) {
      const predicate = config.filters[activeFilter]
      if (predicate) result = result.filter(predicate)
    }
    const search = config.search
    if (query && search) {
      result = result.filter((item) => search(item, query))
    }
    const compare = config.sorts[sortBy()]
    if (compare) {
      if (config.section) {
        const sectionKey = config.section.key
        result.sort((a, b) => {
          const sectionA = sectionKey(a)
          const sectionB = sectionKey(b)
          if (sectionA !== sectionB) return sectionOrder(sectionA, sectionB)
          return compare(a, b)
        })
      } else {
        result.sort(compare)
      }
    }
    return result
  })

  const visibleItems = createMemo<T[]>(() => {
    const collapsed = collapsedSections()
    if (collapsed.size === 0 || !config.section) return filteredItems()
    const sectionKey = config.section.key
    return filteredItems().filter((item) => !collapsed.has(sectionKey(item)))
  })

  const nav = createNavigationCursor({ length: () => visibleItems().length, wrap: false })
  const cursor = nav.cursor
  const setCursor = nav.setCursor

  const positionLabel = createMemo(() => {
    const total = visibleItems().length
    if (total === 0) return "0/0"
    return `${cursor() + 1}/${total}`
  })

  const selectedItem = createMemo(() => visibleItems()[cursor()])

  const scrollRow = createMemo(() => {
    const visible = visibleItems()
    const cursorIndex = cursor()
    if (!config.section) return cursorIndex
    const sectionKey = config.section.key

    let row = 0
    let sectionsSoFar = 0
    let lastKey: K | undefined

    for (let index = 0; index <= cursorIndex && index < visible.length; index++) {
      const key = sectionKey(visible[index] as T)
      if (key !== lastKey) {
        if (sectionsSoFar > 0) row += spacerRows
        row += headerRows(key)
        sectionsSoFar++
        lastKey = key
      }
      if (index === cursorIndex) return row
      row++
    }
    return row
  })

  function toggleSection(id: K) {
    setCollapsedSections((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setCursor((current) => current)
  }

  const cycleSortBy = createCycler<S>(config.sortCycle, sortBy, (value) => setSortBy(() => value))

  const cycleStatusFilter = (() => {
    if (!config.filterCycle || config.filterCycle.length === 0) return () => {}
    const cycle = config.filterCycle
    return () => {
      const current = statusFilter()
      const index = current === null ? -1 : cycle.indexOf(current)
      const nextIndex = (index + 1) % cycle.length
      const next = cycle[nextIndex]
      if (next !== undefined) setStatusFilter(() => next)
      setCursor(0)
    }
  })()

  return {
    items: config.items,
    cursor,
    setCursor,
    filterText,
    setFilterText,
    sortBy,
    setSortBy,
    cycleSortBy,
    statusFilter,
    setStatusFilter,
    cycleStatusFilter,
    collapsedSections,
    toggleSection,
    filteredItems,
    visibleItems,
    selectedItem,
    positionLabel,
    scrollRow,
  }
}
