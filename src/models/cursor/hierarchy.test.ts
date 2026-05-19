import { describe, expect, test } from "bun:test"
import { createHierarchyState } from "@models/cursor/hierarchy.ts"
import { createRoot, createSignal } from "solid-js"

describe("createHierarchyState", () => {
  test("starts focused on level 0 with all indices 0", () => {
    createRoot((dispose) => {
      const h = createHierarchyState([{ length: () => 3 }, { length: () => 2 }])
      expect(h.focus()).toBe(0)
      expect(h.indexAt(0)()).toBe(0)
      expect(h.indexAt(1)()).toBe(0)
      dispose()
    })
  })

  test("setIndexAt clamps to [0, length-1]", () => {
    createRoot((dispose) => {
      const h = createHierarchyState([{ length: () => 3 }])
      h.setIndexAt(0, () => 99)
      expect(h.indexAt(0)()).toBe(2)
      h.setIndexAt(0, () => -5)
      expect(h.indexAt(0)()).toBe(0)
      dispose()
    })
  })

  test("setting a parent index resets all deeper levels to 0", () => {
    createRoot((dispose) => {
      const h = createHierarchyState([{ length: () => 5 }, { length: () => 5 }, { length: () => 5 }])
      h.setIndexAt(2, () => 4)
      h.setIndexAt(1, () => 3)
      expect(h.indexAt(2)()).toBe(0)
      h.setIndexAt(1, () => 2)
      h.setIndexAt(2, () => 4)
      h.setIndexAt(0, () => 1)
      expect(h.indexAt(1)()).toBe(0)
      expect(h.indexAt(2)()).toBe(0)
      dispose()
    })
  })

  test("clamps reactively when length shrinks", () => {
    createRoot((dispose) => {
      const [len, setLen] = createSignal(5)
      const h = createHierarchyState([{ length: len }])
      h.setIndexAt(0, () => 4)
      expect(h.indexAt(0)()).toBe(4)
      setLen(2)
      expect(h.indexAt(0)()).toBe(1)
      setLen(0)
      expect(h.indexAt(0)()).toBe(0)
      dispose()
    })
  })

  test("focusNext / focusPrev wrap", () => {
    createRoot((dispose) => {
      const h = createHierarchyState([{ length: () => 1 }, { length: () => 1 }, { length: () => 1 }])
      h.focusNext()
      expect(h.focus()).toBe(1)
      h.focusNext()
      h.focusNext()
      expect(h.focus()).toBe(0)
      h.focusPrev()
      expect(h.focus()).toBe(2)
      dispose()
    })
  })

  test("setFocus ignores out-of-range levels", () => {
    createRoot((dispose) => {
      const h = createHierarchyState([{ length: () => 1 }, { length: () => 1 }])
      h.setFocus(5)
      expect(h.focus()).toBe(0)
      h.setFocus(-1)
      expect(h.focus()).toBe(0)
      h.setFocus(1)
      expect(h.focus()).toBe(1)
      dispose()
    })
  })

  test("setIndexAt on invalid level is a no-op", () => {
    createRoot((dispose) => {
      const h = createHierarchyState([{ length: () => 3 }])
      h.setIndexAt(5, () => 99)
      expect(h.indexAt(0)()).toBe(0)
      dispose()
    })
  })

  test("constructor throws when no levels configured", () => {
    expect(() => createHierarchyState([])).toThrow()
  })

  test("indexAt(out-of-range) returns the stable zero accessor", () => {
    createRoot((dispose) => {
      const state = createHierarchyState([{ length: () => 3 }])
      expect(state.indexAt(5)()).toBe(0)
      expect(state.indexAt(-1)()).toBe(0)
      dispose()
    })
  })
})
