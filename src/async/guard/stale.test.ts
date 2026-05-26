import { describe, expect, test } from "bun:test"
import { createStaleGuard } from "@async/guard/stale.ts"

describe("createStaleGuard", () => {
  test("stamp captures the current key", () => {
    const context = "dev"
    const guard = createStaleGuard(() => [context] as const)
    const stamp = guard.stamp()
    expect(stamp.captured).toEqual(["dev"])
    expect(stamp.fresh()).toBe(true)
  })

  test("fresh() returns false once any tuple slot changes", () => {
    const context = "dev"
    let namespace = "default"
    const guard = createStaleGuard(() => [context, namespace] as const)
    const stamp = guard.stamp()
    expect(stamp.fresh()).toBe(true)
    namespace = "kube-system"
    expect(stamp.fresh()).toBe(false)
  })

  test("independent stamps track their own captured value", () => {
    let context = "dev"
    const guard = createStaleGuard(() => [context] as const)
    const first = guard.stamp()
    context = "stag"
    const second = guard.stamp()
    expect(first.fresh()).toBe(false)
    expect(second.fresh()).toBe(true)
  })

  test("re-equalising the key revives an earlier stamp", () => {
    let context = "dev"
    const guard = createStaleGuard(() => [context] as const)
    const stamp = guard.stamp()
    context = "stag"
    expect(stamp.fresh()).toBe(false)
    context = "dev"
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
