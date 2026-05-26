import { describe, expect, test } from "bun:test"
import { createIndexedStore } from "@signals"
import { createEffect, createRoot } from "solid-js"

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

interface Quote {
  symbol: string
  price: number
}

const aapl: Quote = { symbol: "AAPL", price: 180 }
const msft: Quote = { symbol: "MSFT", price: 410 }

describe("createIndexedStore", () => {
  test("starts empty by default", () => {
    createRoot(() => {
      const store = createIndexedStore<string, Quote>()
      expect(store.size()).toBe(0)
      expect(store.keys()).toEqual([])
      expect(store.get("AAPL")).toBeUndefined()
    })
  })

  test("seeds from initial map", () => {
    createRoot(() => {
      const store = createIndexedStore<string, Quote>({ AAPL: aapl })
      expect(store.size()).toBe(1)
      expect(store.get("AAPL")?.price).toBe(180)
    })
  })

  test("set inserts a new key", () => {
    createRoot(() => {
      const store = createIndexedStore<string, Quote>()
      store.set("AAPL", aapl)
      expect(store.get("AAPL")).toEqual(aapl)
      expect(store.size()).toBe(1)
    })
  })

  test("set overwrites an existing key wholesale", () => {
    createRoot(() => {
      const store = createIndexedStore<string, Quote>({ AAPL: aapl })
      store.set("AAPL", { symbol: "AAPL", price: 200 })
      expect(store.get("AAPL")?.price).toBe(200)
    })
  })

  test("update shallow-merges into an existing entry", () => {
    createRoot(() => {
      const store = createIndexedStore<string, Quote>({ AAPL: aapl })
      store.update("AAPL", { price: 199 })
      expect(store.get("AAPL")?.symbol).toBe("AAPL")
      expect(store.get("AAPL")?.price).toBe(199)
    })
  })

  test("update is a no-op for missing keys", () => {
    createRoot(() => {
      const store = createIndexedStore<string, Quote>()
      store.update("AAPL", { price: 199 })
      expect(store.get("AAPL")).toBeUndefined()
      expect(store.size()).toBe(0)
    })
  })

  test("upsert inserts when missing", () => {
    createRoot(() => {
      const store = createIndexedStore<string, Quote>()
      store.upsert("AAPL", aapl)
      expect(store.get("AAPL")).toEqual(aapl)
      expect(store.size()).toBe(1)
    })
  })

  test("upsert shallow-merges when present", () => {
    createRoot(() => {
      const store = createIndexedStore<string, Quote>({ AAPL: aapl })
      store.upsert("AAPL", { symbol: "AAPL", price: 211 })
      expect(store.get("AAPL")?.price).toBe(211)
    })
  })

  test("remove deletes an entry", () => {
    createRoot(() => {
      const store = createIndexedStore<string, Quote>({ AAPL: aapl })
      store.remove("AAPL")
      expect(store.get("AAPL")).toBeUndefined()
      expect(store.size()).toBe(0)
    })
  })

  test("remove on missing key is a no-op", () => {
    createRoot(() => {
      const store = createIndexedStore<string, Quote>()
      store.remove("AAPL")
      expect(store.size()).toBe(0)
    })
  })

  test("replace swaps the entire map", () => {
    createRoot(() => {
      const store = createIndexedStore<string, Quote>({ AAPL: aapl })
      store.replace({ MSFT: msft })
      expect(store.get("AAPL")).toBeUndefined()
      expect(store.get("MSFT")).toEqual(msft)
      expect(store.size()).toBe(1)
    })
  })

  test("clear empties the store", () => {
    createRoot(() => {
      const store = createIndexedStore<string, Quote>({ AAPL: aapl, MSFT: msft })
      expect(store.size()).toBe(2)
      store.clear()
      expect(store.size()).toBe(0)
      expect(store.keys()).toEqual([])
    })
  })

  test("entries returns the live record", () => {
    createRoot(() => {
      const store = createIndexedStore<string, Quote>({ AAPL: aapl })
      const all = store.entries()
      expect(all.AAPL).toEqual(aapl)
    })
  })

  test("reactivity: createEffect re-runs on set/update/remove", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const store = createIndexedStore<string, Quote>()
        const sizes: number[] = []
        createEffect(() => {
          sizes.push(store.size())
        })
        await tick()
        store.set("AAPL", aapl)
        await tick()
        store.set("MSFT", msft)
        await tick()
        store.update("AAPL", { price: 199 })
        await tick()
        store.remove("AAPL")
        await tick()
        expect(store.size()).toBe(1)
        // Effect ran for at least: initial + each mutation that changed dependencies.
        expect(sizes.length).toBeGreaterThan(1)
        dispose()
        resolve()
      })
    })
  })
})
