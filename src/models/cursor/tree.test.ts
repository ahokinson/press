import { describe, expect, test } from "bun:test"
import { createTreeState, type TreeNode } from "@models/cursor/tree.ts"
import { createRoot, createSignal } from "solid-js"

interface Folder {
  name: string
}

function build(): TreeNode<Folder>[] {
  return [
    {
      id: "a",
      data: { name: "A" },
      children: [
        {
          id: "a1",
          data: { name: "A.1" },
          children: [{ id: "a1a", data: { name: "A.1.a" } }],
        },
        { id: "a2", data: { name: "A.2" } },
      ],
    },
    { id: "b", data: { name: "B" } },
  ]
}

describe("createTreeState", () => {
  test("visible shows only roots when nothing is expanded", () => {
    createRoot(() => {
      const t = createTreeState(() => build())
      const rows = t.visible()
      expect(rows.map((r) => r.node.id)).toEqual(["a", "b"])
      expect(rows[0]!.depth).toBe(0)
      expect(rows[0]!.hasChildren).toBe(true)
      expect(rows[0]!.isExpanded).toBe(false)
      expect(rows[1]!.hasChildren).toBe(false)
    })
  })

  test("initialExpanded seeds the expanded set", () => {
    createRoot(() => {
      const t = createTreeState(() => build(), { initialExpanded: ["a"] })
      expect(t.isExpanded("a")).toBe(true)
      const rows = t.visible()
      expect(rows.map((r) => r.node.id)).toEqual(["a", "a1", "a2", "b"])
      expect(rows[1]!.depth).toBe(1)
    })
  })

  test("expand reveals children; collapse hides them", () => {
    createRoot(() => {
      const t = createTreeState(() => build())
      t.expand("a")
      expect(t.visible().map((r) => r.node.id)).toEqual(["a", "a1", "a2", "b"])
      t.collapse("a")
      expect(t.visible().map((r) => r.node.id)).toEqual(["a", "b"])
    })
  })

  test("toggle flips state", () => {
    createRoot(() => {
      const t = createTreeState(() => build())
      t.toggle("a")
      expect(t.isExpanded("a")).toBe(true)
      t.toggle("a")
      expect(t.isExpanded("a")).toBe(false)
    })
  })

  test("nested expansion flattens depth-first", () => {
    createRoot(() => {
      const t = createTreeState(() => build(), { initialExpanded: ["a", "a1"] })
      expect(t.visible().map((r) => r.node.id)).toEqual(["a", "a1", "a1a", "a2", "b"])
      expect(t.visible().map((r) => r.depth)).toEqual([0, 1, 2, 1, 0])
    })
  })

  test("isExpanded is false for leaves even when in the expanded set", () => {
    createRoot(() => {
      const t = createTreeState(() => build(), { initialExpanded: ["b"] })
      const row = t.visible().find((r) => r.node.id === "b")!
      expect(row.isExpanded).toBe(false)
      expect(row.hasChildren).toBe(false)
    })
  })

  test("cursor clamps to visible.length and supports setCursor", () => {
    createRoot(() => {
      const t = createTreeState(() => build())
      expect(t.cursor()).toBe(0)
      t.setCursor(99)
      expect(t.cursor()).toBe(1)
      t.setCursor(-5)
      expect(t.cursor()).toBe(0)
    })
  })

  test("focusNext / focusPrev wrap around", () => {
    createRoot(() => {
      const t = createTreeState(() => build())
      t.focusNext()
      expect(t.cursor()).toBe(1)
      t.focusNext()
      expect(t.cursor()).toBe(0)
      t.focusPrev()
      expect(t.cursor()).toBe(1)
    })
  })

  test("focusNext / focusPrev no-op on empty tree", () => {
    createRoot(() => {
      const t = createTreeState<Folder>(() => [])
      t.focusNext()
      t.focusPrev()
      expect(t.cursor()).toBe(0)
      expect(t.visible()).toEqual([])
    })
  })

  test("reacts when roots accessor changes", () => {
    createRoot(() => {
      const [roots, setRoots] = createSignal<TreeNode<Folder>[]>(build())
      const t = createTreeState(roots)
      expect(t.visible().length).toBe(2)
      setRoots([{ id: "x", data: { name: "X" } }])
      expect(t.visible().map((r) => r.node.id)).toEqual(["x"])
    })
  })

  test("expanded accessor returns a snapshot of the set", () => {
    createRoot(() => {
      const t = createTreeState(() => build(), { initialExpanded: ["a"] })
      expect([...t.expanded()]).toContain("a")
    })
  })
})
