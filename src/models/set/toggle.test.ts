import { describe, expect, test } from "bun:test"
import { createToggleSet } from "@models/set/toggle.ts"
import { createRoot } from "solid-js"

describe("createToggleSet", () => {
  test("starts empty by default", () => {
    createRoot((dispose) => {
      const s = createToggleSet<string>()
      expect(s.size()).toBe(0)
      expect(s.has("a")).toBe(false)
      dispose()
    })
  })

  test("respects initial iterable", () => {
    createRoot((dispose) => {
      const s = createToggleSet<string>(["a", "b"])
      expect(s.size()).toBe(2)
      expect(s.has("a")).toBe(true)
      expect(s.has("b")).toBe(true)
      dispose()
    })
  })

  test("toggle adds then removes", () => {
    createRoot((dispose) => {
      const s = createToggleSet<string>()
      s.toggle("x")
      expect(s.has("x")).toBe(true)
      s.toggle("x")
      expect(s.has("x")).toBe(false)
      dispose()
    })
  })

  test("add and delete are idempotent", () => {
    createRoot((dispose) => {
      const s = createToggleSet<number>()
      s.add(1)
      s.add(1)
      expect(s.size()).toBe(1)
      s.delete(1)
      s.delete(1)
      expect(s.size()).toBe(0)
      dispose()
    })
  })

  test("clear empties everything", () => {
    createRoot((dispose) => {
      const s = createToggleSet<string>(["a", "b", "c"])
      s.clear()
      expect(s.size()).toBe(0)
      expect(s.has("a")).toBe(false)
      dispose()
    })
  })

  test("clear on empty set is a no-op", () => {
    createRoot((dispose) => {
      const s = createToggleSet<string>()
      const before = s.values()
      s.clear()
      expect(s.values()).toBe(before)
      dispose()
    })
  })

  test("values returns a fresh reference per change", () => {
    createRoot((dispose) => {
      const s = createToggleSet<string>()
      const before = s.values()
      s.add("a")
      expect(s.values()).not.toBe(before)
      dispose()
    })
  })
})
