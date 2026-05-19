import { describe, expect, test } from "bun:test"
import { createStaleGuard } from "@async/guard/stale.ts"

describe("createStaleGuard", () => {
  test("stamp captures the current key", () => {
    const ctx = "dev"
    const guard = createStaleGuard(() => [ctx] as const)
    const stamp = guard.stamp()
    expect(stamp.captured).toEqual(["dev"])
    expect(stamp.fresh()).toBe(true)
  })

  test("fresh() returns false once any tuple slot changes", () => {
    const ctx = "dev"
    let ns = "default"
    const guard = createStaleGuard(() => [ctx, ns] as const)
    const stamp = guard.stamp()
    expect(stamp.fresh()).toBe(true)
    ns = "kube-system"
    expect(stamp.fresh()).toBe(false)
  })

  test("independent stamps track their own captured value", () => {
    let ctx = "dev"
    const guard = createStaleGuard(() => [ctx] as const)
    const first = guard.stamp()
    ctx = "stag"
    const second = guard.stamp()
    expect(first.fresh()).toBe(false)
    expect(second.fresh()).toBe(true)
  })

  test("re-equalising the key revives an earlier stamp", () => {
    let ctx = "dev"
    const guard = createStaleGuard(() => [ctx] as const)
    const stamp = guard.stamp()
    ctx = "stag"
    expect(stamp.fresh()).toBe(false)
    ctx = "dev"
    expect(stamp.fresh()).toBe(true)
  })

  test("tuples of different length compare unequal", () => {
    let key: readonly string[] = ["a", "b"]
    const guard = createStaleGuard(() => key)
    const stamp = guard.stamp()
    key = ["a"]
    expect(stamp.fresh()).toBe(false)
  })
})
