import { createToggleSet } from "@models/set/toggle.ts"
import { createNavigationCursor } from "@signals"
import { type Accessor, createMemo } from "solid-js"

export interface MultiSelectConfig<T> {
  items: () => readonly T[]
  /** Stable string key for each item, used to track selection across re-renders. */
  key: (item: T) => string
  /** Pre-selected keys. Passed to the underlying ToggleSet as initial state. */
  initialSelection?: Iterable<string>
  /**
   * Wrap navigation past the list ends. Default `false` — stops at first/last
   * item (typical for multi-select UIs). Set to `true` for palette-style lists.
   */
  wrap?: boolean
}

export interface MultiSelectState<T> {
  items: () => readonly T[]
  cursor: Accessor<number>
  setCursor: (value: number | ((previous: number) => number)) => void
  /** Move cursor down one row (no-op at end when wrap is false). */
  next: () => void
  /** Move cursor up one row (no-op at start when wrap is false). */
  prev: () => void
  selectedKeys: Accessor<ReadonlySet<string>>
  selectedCount: Accessor<number>
  isSelected: (item: T) => boolean
  /** Toggle selection of a specific item. */
  toggle: (item: T) => void
  /** Toggle selection of the item at the current cursor. */
  toggleCursor: () => void
  selectAll: () => void
  clearAll: () => void
  selectedItems: Accessor<readonly T[]>
}

/**
 * Cursor + multi-selection state for a flat list. Tracks which items are
 * checked by their key. Wrap with a filterable or searchable cursor model
 * when you need filtering on top.
 *
 * Selection is key-based: keys for items that leave `config.items()` (e.g.
 * due to filtering) are kept in the selection set and reactivate if those
 * items return. `selectedItems()` always reflects only currently visible
 * items. `selectAll()` replaces the selection with all keys in
 * `config.items()` at call time — it does not merge with the existing set.
 */
export function createMultiSelectState<T>(config: MultiSelectConfig<T>): MultiSelectState<T> {
  const nav = createNavigationCursor({ length: () => config.items().length, wrap: config.wrap ?? false })
  const selection = createToggleSet<string>(config.initialSelection)

  const selectedItems = createMemo<readonly T[]>(() => {
    const sel = selection.set()
    return config.items().filter((item) => sel.has(config.key(item)))
  })

  function isSelected(item: T): boolean {
    return selection.has(config.key(item))
  }

  function toggle(item: T): void {
    selection.toggle(config.key(item))
  }

  function toggleCursor(): void {
    const item = config.items()[nav.cursor()]
    if (item !== undefined) toggle(item)
  }

  function selectAll(): void {
    selection.setAll(config.items().map(config.key))
  }

  return {
    items: config.items,
    cursor: nav.cursor,
    setCursor: nav.setCursor,
    next: nav.next,
    prev: nav.prev,
    selectedKeys: selection.set,
    selectedCount: selection.size,
    isSelected,
    toggle,
    toggleCursor,
    selectAll,
    clearAll: selection.clear,
    selectedItems,
  }
}
