import { describe, expect, test } from "bun:test"
import { createScreenStack } from "@terminal/screen.ts"
import { createRoot } from "solid-js"

type Screen = { kind: "list" } | { kind: "detail"; id: string } | { kind: "editor"; file: string }

const list: Screen = { kind: "list" }
const detail = (id: string): Screen => ({ kind: "detail", id })
const editor = (file: string): Screen => ({ kind: "editor", file })

describe("createScreenStack", () => {
  test("starts at depth 1 with the initial screen on top", () => {
    createRoot(() => {
      const stack = createScreenStack<Screen>(list)
      expect(stack.depth()).toBe(1)
      expect(stack.top()).toEqual(list)
      expect(stack.stack()).toEqual([list])
    })
  })

  test("push grows the stack and updates top", () => {
    createRoot(() => {
      const stack = createScreenStack<Screen>(list)
      stack.push(detail("42"))
      expect(stack.depth()).toBe(2)
      expect(stack.top()).toEqual(detail("42"))
      expect(stack.stack()).toEqual([list, detail("42")])
    })
  })

  test("pop drops the top and reveals the previous screen", () => {
    createRoot(() => {
      const stack = createScreenStack<Screen>(list)
      stack.push(detail("7"))
      stack.push(editor("readme.md"))
      stack.pop()
      expect(stack.depth()).toBe(2)
      expect(stack.top()).toEqual(detail("7"))
    })
  })

  test("pop at depth 1 is a no-op", () => {
    createRoot(() => {
      const stack = createScreenStack<Screen>(list)
      stack.pop()
      stack.pop()
      expect(stack.depth()).toBe(1)
      expect(stack.top()).toEqual(list)
    })
  })

  test("replace swaps the top without changing depth", () => {
    createRoot(() => {
      const stack = createScreenStack<Screen>(list)
      stack.push(detail("1"))
      stack.replace(detail("2"))
      expect(stack.depth()).toBe(2)
      expect(stack.top()).toEqual(detail("2"))
      expect(stack.stack()).toEqual([list, detail("2")])
    })
  })

  test("replace at depth 1 swaps the root", () => {
    createRoot(() => {
      const stack = createScreenStack<Screen>(list)
      stack.replace(editor("notes.md"))
      expect(stack.depth()).toBe(1)
      expect(stack.top()).toEqual(editor("notes.md"))
    })
  })

  test("reset collapses to a single-entry stack with the given screen", () => {
    createRoot(() => {
      const stack = createScreenStack<Screen>(list)
      stack.push(detail("a"))
      stack.push(editor("x"))
      stack.reset(detail("z"))
      expect(stack.depth()).toBe(1)
      expect(stack.top()).toEqual(detail("z"))
      expect(stack.stack()).toEqual([detail("z")])
    })
  })

  test("stack accessor returns entries in bottom-to-top order", () => {
    createRoot(() => {
      const stack = createScreenStack<Screen>(list)
      stack.push(detail("1"))
      stack.push(detail("2"))
      stack.push(editor("e"))
      expect(stack.stack()).toEqual([list, detail("1"), detail("2"), editor("e")])
    })
  })
})
