import { describe, expect, test } from "bun:test"
import { createRoot } from "solid-js"
import { createDataLoader } from "./index.ts"

describe("createDataLoader", () => {
  test("starts in idle status with no data", () => {
    createRoot((dispose) => {
      const loader = createDataLoader({ fetch: async (_signal) => 42 })
      expect(loader.status()).toBe("idle")
      expect(loader.data()).toBeUndefined()
      expect(loader.error()).toBeUndefined()
      dispose()
    })
  })

  test("load() transitions through loading to success", async () => {
    await createRoot(async (dispose) => {
      const loader = createDataLoader({ fetch: async (_signal) => "hello" })
      const promise = loader.load()
      expect(loader.status()).toBe("loading")
      await promise
      expect(loader.status()).toBe("success")
      expect(loader.data()).toBe("hello")
      dispose()
    })
  })

  test("load() transitions to error on rejection", async () => {
    await createRoot(async (dispose) => {
      const loader = createDataLoader({
        fetch: async (_signal) => {
          throw new Error("boom")
        },
      })
      await loader.load()
      expect(loader.status()).toBe("error")
      expect(loader.data()).toBeUndefined()
      expect((loader.error() as Error).message).toBe("boom")
      dispose()
    })
  })

  test("refresh() transitions through refreshing while keeping stale data", async () => {
    await createRoot(async (dispose) => {
      let call = 0
      const loader = createDataLoader({ fetch: async (_signal) => ++call })
      await loader.load()
      expect(loader.data()).toBe(1)
      const promise = loader.refresh()
      expect(loader.status()).toBe("refreshing")
      expect(loader.data()).toBe(1) // stale data remains visible
      await promise
      expect(loader.status()).toBe("success")
      expect(loader.data()).toBe(2)
      dispose()
    })
  })

  test("refresh() behaves like load() when status is idle", async () => {
    await createRoot(async (dispose) => {
      const loader = createDataLoader({ fetch: async (_signal) => 99 })
      await loader.refresh()
      expect(loader.status()).toBe("success")
      expect(loader.data()).toBe(99)
      dispose()
    })
  })

  test("refresh() from error state shows loading skeleton (no stale data to keep)", async () => {
    await createRoot(async (dispose) => {
      const loader = createDataLoader({
        fetch: async (_signal) => {
          throw new Error("bad")
        },
      })
      await loader.load()
      expect(loader.status()).toBe("error")
      // Calling refresh() on an error state falls back to load() — status goes to "loading"
      const refreshing = loader.refresh()
      expect(loader.status()).toBe("loading")
      await refreshing
      dispose()
    })
  })

  test("only the last concurrent load() lands", async () => {
    await createRoot(async (dispose) => {
      let resolve1!: (v: string) => void
      let resolve2!: (v: string) => void
      const p1 = new Promise<string>((r) => {
        resolve1 = r
      })
      const p2 = new Promise<string>((r) => {
        resolve2 = r
      })
      let call = 0
      const loader = createDataLoader({
        fetch: (_signal) => (++call === 1 ? p1 : p2),
      })
      // Start both loads so the second supersedes the first
      const first = loader.load()
      const second = loader.load()
      // Resolve the first (stale) request first to confirm its result is dropped
      resolve1("stale")
      await first
      expect(loader.data()).toBeUndefined() // stale result discarded
      // Now resolve the second (winning) request
      resolve2("fresh")
      await second
      expect(loader.data()).toBe("fresh")
      dispose()
    })
  })

  test("reset() returns to idle and clears data and error", async () => {
    await createRoot(async (dispose) => {
      const loader = createDataLoader({ fetch: async (_signal) => "value" })
      await loader.load()
      expect(loader.status()).toBe("success")
      loader.reset()
      expect(loader.status()).toBe("idle")
      expect(loader.data()).toBeUndefined()
      expect(loader.error()).toBeUndefined()
      dispose()
    })
  })

  test("data() retains stale value after a failed refresh", async () => {
    await createRoot(async (dispose) => {
      let call = 0
      const loader = createDataLoader({
        fetch: async (_signal) => {
          if (++call === 1) return "original"
          throw new Error("refresh failed")
        },
      })
      await loader.load()
      expect(loader.data()).toBe("original")
      await loader.refresh()
      expect(loader.status()).toBe("error")
      expect(loader.data()).toBe("original")
      dispose()
    })
  })

  test("reset() cancels an in-flight load", async () => {
    await createRoot(async (dispose) => {
      let resolve!: (v: string) => void
      const p = new Promise<string>((r) => {
        resolve = r
      })
      const loader = createDataLoader({ fetch: (_signal) => p })
      const loading = loader.load()
      loader.reset()
      resolve("too late")
      await loading
      // The result should not land because reset() incremented gen
      expect(loader.status()).toBe("idle")
      expect(loader.data()).toBeUndefined()
      dispose()
    })
  })
})
