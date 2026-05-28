import { describe, expect, test } from "bun:test"
import { createRoot, createSignal } from "solid-js"
import { createMultiSelectState } from "./index.ts"

const items = [
  { id: "a", label: "Alpha" },
  { id: "b", label: "Beta" },
  { id: "c", label: "Gamma" },
]

describe("createMultiSelectState", () => {
  test("starts with empty selection and cursor at 0", () => {
    createRoot((dispose) => {
      const state = createMultiSelectState({ items: () => items, key: (i) => i.id })
      expect(state.cursor()).toBe(0)
      expect(state.selectedCount()).toBe(0)
      expect(state.selectedItems()).toEqual([])
      dispose()
    })
  })

  test("toggleCursor selects the item at the cursor", () => {
    createRoot((dispose) => {
      const state = createMultiSelectState({ items: () => items, key: (i) => i.id })
      state.toggleCursor()
      expect(state.isSelected(items[0]!)).toBe(true)
      expect(state.selectedCount()).toBe(1)
      dispose()
    })
  })

  test("toggleCursor again deselects the item", () => {
    createRoot((dispose) => {
      const state = createMultiSelectState({ items: () => items, key: (i) => i.id })
      state.toggleCursor()
      state.toggleCursor()
      expect(state.isSelected(items[0]!)).toBe(false)
      expect(state.selectedCount()).toBe(0)
      dispose()
    })
  })

  test("next / prev move the cursor", () => {
    createRoot((dispose) => {
      const state = createMultiSelectState({ items: () => items, key: (i) => i.id })
      state.next()
      expect(state.cursor()).toBe(1)
      state.prev()
      expect(state.cursor()).toBe(0)
      dispose()
    })
  })

  test("next stops at the last item", () => {
    createRoot((dispose) => {
      const state = createMultiSelectState({ items: () => items, key: (i) => i.id })
      state.next()
      state.next()
      state.next() // already at last
      expect(state.cursor()).toBe(2)
      dispose()
    })
  })

  test("toggle selects a specific item regardless of cursor", () => {
    createRoot((dispose) => {
      const state = createMultiSelectState({ items: () => items, key: (i) => i.id })
      state.toggle(items[2]!)
      expect(state.isSelected(items[2]!)).toBe(true)
      expect(state.isSelected(items[0]!)).toBe(false)
      dispose()
    })
  })

  test("selectAll marks every item as selected", () => {
    createRoot((dispose) => {
      const state = createMultiSelectState({ items: () => items, key: (i) => i.id })
      state.selectAll()
      expect(state.selectedCount()).toBe(3)
      expect(state.selectedItems()).toEqual(items)
      dispose()
    })
  })

  test("clearAll removes all selections", () => {
    createRoot((dispose) => {
      const state = createMultiSelectState({ items: () => items, key: (i) => i.id })
      state.selectAll()
      state.clearAll()
      expect(state.selectedCount()).toBe(0)
      expect(state.selectedItems()).toEqual([])
      dispose()
    })
  })

  test("selectedItems returns items in original order", () => {
    createRoot((dispose) => {
      const state = createMultiSelectState({ items: () => items, key: (i) => i.id })
      state.toggle(items[2]!)
      state.toggle(items[0]!)
      expect(state.selectedItems()).toEqual([items[0]!, items[2]!])
      dispose()
    })
  })

  test("stale keys are preserved when items list narrows, and restored when items return", () => {
    createRoot((dispose) => {
      const [visible, setVisible] = createSignal(items)
      const state = createMultiSelectState({ items: visible, key: (i) => i.id })
      state.selectAll()
      expect(state.selectedCount()).toBe(3)

      // Narrow the list — Alpha disappears
      setVisible(items.slice(1))
      // selectedItems() only includes currently visible items
      expect(state.selectedItems()).toEqual([items[1]!, items[2]!])
      // But the raw key set still holds Alpha's key
      expect(state.selectedKeys().has("a")).toBe(true)

      // Restore Alpha — it is still selected
      setVisible(items)
      expect(state.selectedItems()).toEqual(items)
      dispose()
    })
  })

  test("selectAll after narrowing selects only visible items", () => {
    createRoot((dispose) => {
      const [visible, setVisible] = createSignal(items)
      const state = createMultiSelectState({ items: visible, key: (i) => i.id })

      // Select all three, then narrow and re-select-all
      state.selectAll()
      setVisible(items.slice(0, 1)) // only Alpha visible
      state.selectAll()

      // The selection is now ONLY Alpha (setAll replaces)
      expect(state.selectedKeys().size).toBe(1)
      expect(state.selectedKeys().has("a")).toBe(true)
      dispose()
    })
  })
})
