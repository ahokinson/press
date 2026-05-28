import { describe, expect, test } from "bun:test"
import { AsyncView } from "@components/display/asyncView.tsx"
import { createDataLoader, type DataLoaderState } from "@models/loader/index.ts"
import { testRender } from "@opentui/solid"

describe("AsyncView", () => {
  test("renders skeleton rows while idle", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const loader = createDataLoader({ fetch: async (_signal) => "data" })
        return (
          <AsyncView state={loader} skeletonRows={3} renderSkeleton={() => <text>loading…</text>}>
            {(data) => <text>{data}</text>}
          </AsyncView>
        )
      },
      { width: 40, height: 10 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("loading…")
  })

  test("renders skeleton while loading", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const loader = createDataLoader({ fetch: (_signal) => new Promise(() => {}) })
        void loader.load()
        return (
          <AsyncView state={loader} renderSkeleton={() => <text>loading…</text>}>
            {(data) => <text>{data as string}</text>}
          </AsyncView>
        )
      },
      { width: 40, height: 10 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("loading…")
  })

  test("renders children on success", async () => {
    let loadPromise!: Promise<void>
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const loader = createDataLoader({ fetch: async (_signal) => "hello world" })
        loadPromise = loader.load()
        return <AsyncView state={loader}>{(data) => <text>{data}</text>}</AsyncView>
      },
      { width: 40, height: 10 },
    )
    await loadPromise
    await renderOnce()
    expect(captureCharFrame()).toContain("hello world")
  })

  test("renders error callout on failure", async () => {
    let loadPromise!: Promise<void>
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const loader = createDataLoader({
          fetch: async (_signal) => {
            throw new Error("fetch failed")
          },
        })
        loadPromise = loader.load()
        return <AsyncView state={loader}>{() => <text>ok</text>}</AsyncView>
      },
      { width: 60, height: 10 },
    )
    await loadPromise
    await renderOnce()
    expect(captureCharFrame()).toContain("fetch failed")
  })

  test("renders empty message when result is an empty array", async () => {
    let loadPromise!: Promise<void>
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const loader = createDataLoader<string[]>({ fetch: async (_signal) => [] })
        loadPromise = loader.load()
        return (
          <AsyncView state={loader} emptyMessage="Nothing here">
            {(data) => <text>{data.join(", ")}</text>}
          </AsyncView>
        )
      },
      { width: 40, height: 10 },
    )
    await loadPromise
    await renderOnce()
    expect(captureCharFrame()).toContain("Nothing here")
  })

  test("renders data after a successful load", async () => {
    let loadPromise!: Promise<void>
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const loader = createDataLoader({ fetch: async (_signal) => "stale" })
        loadPromise = loader.load()
        return <AsyncView state={loader}>{(data) => <text>{data}</text>}</AsyncView>
      },
      { width: 40, height: 10 },
    )
    await loadPromise
    await renderOnce()
    expect(captureCharFrame()).toContain("stale")
  })

  test("shows stale data (not skeleton) while a refresh is in flight", async () => {
    let call = 0
    let loader!: DataLoaderState<string>
    let loadPromise!: Promise<void>
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        loader = createDataLoader({
          fetch: (_signal) => (++call === 1 ? Promise.resolve("original") : new Promise(() => {})),
        })
        loadPromise = loader.load()
        return (
          <AsyncView state={loader} renderSkeleton={() => <text>loading…</text>}>
            {(data) => <text>{data}</text>}
          </AsyncView>
        )
      },
      { width: 40, height: 10 },
    )
    await loadPromise // initial load settles
    void loader.refresh() // in-flight refresh that never resolves
    await renderOnce()
    expect(captureCharFrame()).toContain("original")
    expect(captureCharFrame()).not.toContain("loading…")
  })

  test("preserves empty state (not skeleton) while a refresh is in flight after empty load", async () => {
    let call = 0
    let loader!: DataLoaderState<string[]>
    let loadPromise!: Promise<void>
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        loader = createDataLoader({
          fetch: (_signal) => (++call === 1 ? Promise.resolve([]) : new Promise(() => {})),
        })
        loadPromise = loader.load()
        return (
          <AsyncView state={loader} emptyMessage="Nothing here" renderSkeleton={() => <text>loading…</text>}>
            {(data) => <text>{data.join(", ")}</text>}
          </AsyncView>
        )
      },
      { width: 40, height: 10 },
    )
    await loadPromise // initial load completes with empty array
    void loader.refresh() // in-flight refresh that never resolves
    await renderOnce()
    expect(captureCharFrame()).toContain("Nothing here")
    expect(captureCharFrame()).not.toContain("loading…")
  })

  test("shows refreshIndicator during a refresh but not during initial load", async () => {
    let call = 0
    let loader!: DataLoaderState<string>
    let loadPromise!: Promise<void>
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        loader = createDataLoader({
          fetch: (_signal) => (++call === 1 ? Promise.resolve("data") : new Promise(() => {})),
        })
        loadPromise = loader.load()
        return (
          <AsyncView state={loader} refreshIndicator={<text>refreshing…</text>}>
            {(data) => <text>{data}</text>}
          </AsyncView>
        )
      },
      { width: 40, height: 10 },
    )
    await loadPromise
    void loader.refresh()
    await renderOnce()
    expect(captureCharFrame()).toContain("refreshing…")
    expect(captureCharFrame()).toContain("data")
  })

  test("renders non-array success data", async () => {
    let loadPromise!: Promise<void>
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const loader = createDataLoader({ fetch: async (_signal) => ({ name: "press" }) })
        loadPromise = loader.load()
        return <AsyncView state={loader}>{(data) => <text>{data.name}</text>}</AsyncView>
      },
      { width: 40, height: 10 },
    )
    await loadPromise
    await renderOnce()
    expect(captureCharFrame()).toContain("press")
  })
})
