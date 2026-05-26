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
      const tree = createTreeState(() => build())
      const rows = tree.visible()
      expect(rows.map((row) => row.node.id)).toEqual(["a", "b"])
      expect(rows[0]!.depth).toBe(0)
      expect(rows[0]!.hasChildren).toBe(true)
      expect(rows[0]!.isExpanded).toBe(false)
      expect(rows[1]!.hasChildren).toBe(false)
    })
  })

  test("initialExpanded seeds the expanded set", () => {
    createRoot(() => {
      const tree = createTreeState(() => build(), { initialExpanded: ["a"] })
      expect(tree.isExpanded("a")).toBe(true)
      const rows = tree.visible()
      expect(rows.map((row) => row.node.id)).toEqual(["a", "a1", "a2", "b"])
      expect(rows[1]!.depth).toBe(1)
    })
  })

  test("expand reveals children; collapse hides them", () => {
    createRoot(() => {
      const tree = createTreeState(() => build())
      tree.expand("a")
      expect(tree.visible().map((row) => row.node.id)).toEqual(["a", "a1", "a2", "b"])
      tree.collapse("a")
      expect(tree.visible().map((row) => row.node.id)).toEqual(["a", "b"])
    })
  })

  test("toggle flips state", () => {
    createRoot(() => {
      const tree = createTreeState(() => build())
      tree.toggle("a")
      expect(tree.isExpanded("a")).toBe(true)
      tree.toggle("a")
      expect(tree.isExpanded("a")).toBe(false)
    })
  })

  test("nested expansion flattens depth-first", () => {
    createRoot(() => {
      const tree = createTreeState(() => build(), { initialExpanded: ["a", "a1"] })
      expect(tree.visible().map((row) => row.node.id)).toEqual(["a", "a1", "a1a", "a2", "b"])
      expect(tree.visible().map((row) => row.depth)).toEqual([0, 1, 2, 1, 0])
    })
  })

  test("isExpanded is false for leaves even when in the expanded set", () => {
    createRoot(() => {
      const tree = createTreeState(() => build(), { initialExpanded: ["b"] })
      const row = tree.visible().find((row) => row.node.id === "b")!
      expect(row.isExpanded).toBe(false)
      expect(row.hasChildren).toBe(false)
    })
  })

  test("cursor clamps to visible.length and supports setCursor", () => {
    createRoot(() => {
      const tree = createTreeState(() => build())
      expect(tree.cursor()).toBe(0)
      tree.setCursor(99)
      expect(tree.cursor()).toBe(1)
      tree.setCursor(-5)
      expect(tree.cursor()).toBe(0)
    })
  })

  test("focusNext / focusPrev wrap around", () => {
    createRoot(() => {
      const tree = createTreeState(() => build())
      tree.focusNext()
      expect(tree.cursor()).toBe(1)
      tree.focusNext()
      expect(tree.cursor()).toBe(0)
      tree.focusPrev()
      expect(tree.cursor()).toBe(1)
    })
  })

  test("focusNext after the visible list shrinks steps from the clamped cursor", () => {
    createRoot(() => {
      const [roots, setRoots] = createSignal<TreeNode<Folder>[]>([
        { id: "a", data: { name: "A" } },
        { id: "b", data: { name: "B" } },
        { id: "c", data: { name: "C" } },
        { id: "d", data: { name: "D" } },
      ])
      const tree = createTreeState(roots)
      tree.setCursor(3)
      expect(tree.cursor()).toBe(3)
      setRoots([
        { id: "a", data: { name: "A" } },
        { id: "b", data: { name: "B" } },
      ])
      expect(tree.cursor()).toBe(1)
      tree.focusNext()
      expect(tree.cursor()).toBe(0)
    })
  })

  test("focusNext / focusPrev no-op on empty tree", () => {
    createRoot(() => {
      const tree = createTreeState<Folder>(() => [])
      tree.focusNext()
      tree.focusPrev()
      expect(tree.cursor()).toBe(0)
      expect(tree.visible()).toEqual([])
    })
  })

  test("reacts when roots accessor changes", () => {
    createRoot(() => {
      const [roots, setRoots] = createSignal<TreeNode<Folder>[]>(build())
      const tree = createTreeState(roots)
      expect(tree.visible().length).toBe(2)
      setRoots([{ id: "x", data: { name: "X" } }])
      expect(tree.visible().map((row) => row.node.id)).toEqual(["x"])
    })
  })

  test("expanded accessor returns a snapshot of the set", () => {
    createRoot(() => {
      const tree = createTreeState(() => build(), { initialExpanded: ["a"] })
      expect([...tree.expanded()]).toContain("a")
    })
  })
})
