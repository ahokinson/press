import { describe, expect, test } from "bun:test"
import { type CollapsibleGroup, flattenGroups } from "@models/group/collapsible.ts"

function group<H>(key: string, header: H, children: string[]): CollapsibleGroup<H, string> {
  return { key, header, children }
}

describe("flattenGroups", () => {
  test("emits one header per group plus children only when expanded", () => {
    const groups = [group("a", { label: "A" }, ["a1", "a2"]), group("b", { label: "B" }, ["b1"])]
    const rows = flattenGroups(groups, new Set(["a"]))
    expect(rows).toHaveLength(4)
    expect(rows[0]).toMatchObject({ kind: "header", key: "a", expanded: true, childCount: 2 })
    expect(rows[1]).toMatchObject({ kind: "child", child: "a1", parentKey: "a" })
    expect(rows[2]).toMatchObject({ kind: "child", child: "a2", parentKey: "a" })
    expect(rows[3]).toMatchObject({ kind: "header", key: "b", expanded: false, childCount: 1 })
  })

  test("empty input yields no rows", () => {
    expect(flattenGroups([], new Set())).toEqual([])
  })

  test("childCount reflects underlying length regardless of expansion", () => {
    const groups = [group("a", null, ["x", "y", "z"])]
    const collapsed = flattenGroups(groups, new Set())
    const expanded = flattenGroups(groups, new Set(["a"]))
    if (collapsed[0]?.kind === "header") expect(collapsed[0].childCount).toBe(3)
    if (expanded[0]?.kind === "header") expect(expanded[0].childCount).toBe(3)
    expect(expanded).toHaveLength(4)
  })

  test("group order is preserved", () => {
    const groups = [group("z", null, []), group("a", null, []), group("m", null, [])]
    const rows = flattenGroups(groups, new Set())
    expect(rows.map((r) => (r.kind === "header" ? r.key : null))).toEqual(["z", "a", "m"])
  })

  test("expanded key with no children still emits a header (no orphan child rows)", () => {
    const groups = [group("a", null, [])]
    const rows = flattenGroups(groups, new Set(["a"]))
    expect(rows).toHaveLength(1)
    expect(rows[0]?.kind).toBe("header")
  })
})
