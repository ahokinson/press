import { describe, expect, test } from "bun:test"
import { createCoalescer } from "@async/guard/coalesce.ts"

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void } {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((resolveExecutor, rejectExecutor) => {
    resolve = resolveExecutor
    reject = rejectExecutor
  })
  return { promise, resolve, reject }
}

describe("createCoalescer", () => {
  test("concurrent calls for the same key share one flight", async () => {
    const coalesce = createCoalescer<string, number>()
    let calls = 0
    const pending = deferred<number>()
    const factory = () => {
      calls++
      return pending.promise
    }
    const first = coalesce.run("k", factory)
    const second = coalesce.run("k", factory)
    expect(calls).toBe(1)
    expect(coalesce.size()).toBe(1)
    pending.resolve(42)
    expect(await first).toBe(42)
    expect(await second).toBe(42)
  })

  test("entry clears after the flight settles", async () => {
    const coalesce = createCoalescer<string, number>()
    let calls = 0
    const factory = () => {
      calls++
      return Promise.resolve(calls)
    }
    expect(await coalesce.run("k", factory)).toBe(1)
    // Wait a microtask so the `finally` cleanup runs before we check size.
    await Promise.resolve()
    expect(coalesce.size()).toBe(0)
    expect(await coalesce.run("k", factory)).toBe(2)
    expect(calls).toBe(2)
  })

  test("distinct keys do not share flights", async () => {
    const coalesce = createCoalescer<string, string>()
    let calls = 0
    const factory = (label: string) => {
      calls++
      return Promise.resolve(label)
    }
    const [first, second] = await Promise.all([
      coalesce.run("x", () => factory("x")),
      coalesce.run("y", () => factory("y")),
    ])
    expect(first).toBe("x")
    expect(second).toBe("y")
    expect(calls).toBe(2)
  })

  test("rejected flight propagates to all callers and clears", async () => {
    const coalesce = createCoalescer<string, number>()
    const pending = deferred<number>()
    const first = coalesce.run("k", () => pending.promise)
    const second = coalesce.run("k", () => pending.promise)
    pending.reject(new Error("boom"))
    await expect(first).rejects.toThrow("boom")
    await expect(second).rejects.toThrow("boom")
    await Promise.resolve()
    expect(coalesce.size()).toBe(0)
  })

  test("factory that throws synchronously surfaces as rejection", async () => {
    const coalesce = createCoalescer<string, number>()
    const result = coalesce.run("k", () => {
      throw new Error("sync")
    })
    await expect(result).rejects.toThrow("sync")
    expect(coalesce.size()).toBe(0)
  })

  test("forget allows a new flight to start while the old one is pending", async () => {
    const coalesce = createCoalescer<string, number>()
    const firstPending = deferred<number>()
    const secondPending = deferred<number>()
    let calls = 0
    const first = coalesce.run("k", () => {
      calls++
      return firstPending.promise
    })
    coalesce.forget("k")
    const second = coalesce.run("k", () => {
      calls++
      return secondPending.promise
    })
    expect(calls).toBe(2)
    firstPending.resolve(1)
    secondPending.resolve(2)
    expect(await first).toBe(1)
    expect(await second).toBe(2)
  })
})
