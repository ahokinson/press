import { createMemo, createSignal } from "solid-js"

/**
 * Minimal contract `createSearchMode` needs from a list. `FilterableListState`
 * satisfies it directly. Any other list with a reactive filter signal and
 * item accessors works too.
 */
export interface SearchableList<T> {
  /** Current filter text. */
  filterText: () => string
  /** Apply a new filter text. */
  setFilterText: (value: string) => void
  /** Items that pass the filter — used for `matchCount`. */
  filteredItems: () => readonly T[]
  /** Raw items before filtering — used for `totalCount`. */
  items: () => readonly T[]
}

export interface SearchModeOptions {
  /**
   * Formatter for `label()`. Receives match and total counts. Default
   * `"${matched}/${total}"`. Called only when `active()` is `true`. When
   * inactive, `label()` returns `""`.
   */
  formatLabel?: (matched: number, total: number) => string
}

export interface SearchModeState {
  /** `true` between `open()` and `close()`/`cancel()`. */
  active: () => boolean
  /** Snapshot the current filter text, then enter search mode. */
  open: () => void
  /**
   * Leave search mode without restoring. The current `filterText` stays as
   * the committed filter. Use on Enter to keep the narrowed view.
   */
  close: () => void
  /**
   * Leave search mode and restore the filter text that was active before
   * `open()`. Use on Escape to abort the search.
   */
  cancel: () => void
  /**
   * Items that pass both the active category filter and the search text.
   * Tracks `list.filteredItems().length`. Excludes section-collapse, since
   * collapsed rows are still matches that happen to be hidden.
   */
  matchCount: () => number
  /** Raw input size before any filtering — tracks `list.items().length`. */
  totalCount: () => number
  /** Formatted match label, e.g. `"3/27"`. Empty string when inactive. */
  label: () => string
}

const defaultFormat = (matched: number, total: number) => `${matched}/${total}`

/**
 * Wrap a `SearchableList` with a search-bar lifecycle:
 *
 *   - `open()` snapshots `filterText` and flips the active flag.
 *   - `close()` leaves the filter in place (Enter to keep results).
 *   - `cancel()` restores the snapshot (Escape to abort).
 *
 * The underlying list owns `filterText`/`setFilterText`; this primitive
 * doesn't introduce a parallel signal. Match and total counts read from
 * `list.filteredItems()` and `list.items()`.
 *
 * Counts include the effect of any active category filter. For search-only
 * counts, compute them directly off `list.items()` and the search predicate.
 */
export function createSearchMode<T>(list: SearchableList<T>, options: SearchModeOptions = {}): SearchModeState {
  const format = options.formatLabel ?? defaultFormat
  const [active, setActive] = createSignal(false)
  let snapshot = ""

  const matchCount = createMemo(() => list.filteredItems().length)
  const totalCount = createMemo(() => list.items().length)
  const label = createMemo(() => (active() ? format(matchCount(), totalCount()) : ""))

  function open() {
    if (active()) return
    snapshot = list.filterText()
    setActive(true)
  }

  function close() {
    if (!active()) return
    setActive(false)
  }

  function cancel() {
    if (!active()) return
    list.setFilterText(snapshot)
    setActive(false)
  }

  return {
    active,
    open,
    close,
    cancel,
    matchCount,
    totalCount,
    label,
  }
}
