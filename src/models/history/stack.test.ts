import { describe, expect, test } from "bun:test"
import { createHistory } from "@models/history/stack.ts"
import { createRoot } from "solid-js"

describe("createHistory", () => {
  test("starts with initial as current", () => {
    createRoot((dispose) => {
      const h = createHistory({ initial: "a" })
      expect(h.current()).toBe("a")
      expect(h.size()).toBe(1)
      expect(h.canUndo()).toBe(false)
      expect(h.canRedo()).toBe(false)
      dispose()
    })
  })

  test("push advances current and enables undo", () => {
    createRoot((dispose) => {
      const h = createHistory({ initial: 0 })
      h.push(1)
      h.push(2)
      expect(h.current()).toBe(2)
      expect(h.size()).toBe(3)
      expect(h.canUndo()).toBe(true)
      expect(h.canRedo()).toBe(false)
      dispose()
    })
  })

  test("undo and redo move the cursor", () => {
    createRoot((dispose) => {
      const h = createHistory({ initial: "a" })
      h.push("b")
      h.push("c")
      h.undo()
      expect(h.current()).toBe("b")
      expect(h.canRedo()).toBe(true)
      h.undo()
      expect(h.current()).toBe("a")
      expect(h.canUndo()).toBe(false)
      h.redo()
      expect(h.current()).toBe("b")
      dispose()
    })
  })

  test("push after undo truncates the redo tail", () => {
    createRoot((dispose) => {
      const h = createHistory({ initial: 1 })
      h.push(2)
      h.push(3)
      h.undo()
      h.undo()
      expect(h.current()).toBe(1)
      h.push(99)
      expect(h.current()).toBe(99)
      expect(h.canRedo()).toBe(false)
      expect(h.size()).toBe(2)
      dispose()
    })
  })

  test("push of identical state is a no-op", () => {
    createRoot((dispose) => {
      const reference = { value: 1 }
      const h = createHistory({ initial: reference })
      h.push(reference)
      expect(h.size()).toBe(1)
      expect(h.canUndo()).toBe(false)
      dispose()
    })
  })

  test("limit trims the oldest state when exceeded", () => {
    createRoot((dispose) => {
      const h = createHistory({ initial: 0, limit: 3 })
      h.push(1)
      h.push(2)
      h.push(3)
      h.push(4)
      expect(h.size()).toBe(3)
      expect(h.current()).toBe(4)
      h.undo()
      h.undo()
      expect(h.current()).toBe(2)
      expect(h.canUndo()).toBe(false)
      dispose()
    })
  })

  test("undo and redo at the boundaries are no-ops", () => {
    createRoot((dispose) => {
      const h = createHistory({ initial: "x" })
      h.undo()
      expect(h.current()).toBe("x")
      h.redo()
      expect(h.current()).toBe("x")
      dispose()
    })
  })

  test("reset clears to initial when no argument is passed", () => {
    createRoot((dispose) => {
      const h = createHistory({ initial: "a" })
      h.push("b")
      h.push("c")
      h.reset()
      expect(h.current()).toBe("a")
      expect(h.size()).toBe(1)
      expect(h.canUndo()).toBe(false)
      expect(h.canRedo()).toBe(false)
      dispose()
    })
  })

  test("reset with argument seeds a new initial", () => {
    createRoot((dispose) => {
      const h = createHistory({ initial: 0 })
      h.push(1)
      h.reset(99)
      expect(h.current()).toBe(99)
      expect(h.size()).toBe(1)
      dispose()
    })
  })

  test("rejects non-positive limit", () => {
    expect(() => createHistory({ initial: 0, limit: 0 })).toThrow(RangeError)
    expect(() => createHistory({ initial: 0, limit: -1 })).toThrow(RangeError)
    expect(() => createHistory({ initial: 0, limit: 1.5 })).toThrow(RangeError)
  })
})
