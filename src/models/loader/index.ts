import { type Accessor, batch, createSignal, untrack } from "solid-js"

export type LoaderStatus = "idle" | "loading" | "success" | "error" | "refreshing"

export interface DataLoaderState<T> {
  status: Accessor<LoaderStatus>
  /**
   * Defined once at least one successful load has completed.
   * Retained across a failed `refresh()` — status will be "error" but the
   * last successful value remains available for callers that want to keep
   * the UI populated.
   */
  data: Accessor<T | undefined>
  /**
   * The thrown value from the last failed `load()` or `refresh()`, or
   * `undefined` when no error has occurred. Always `undefined` after
   * `reset()`. Use `AsyncView`'s `formatError` prop to display it, or
   * narrow to `Error` with an `instanceof` check.
   */
  error: Accessor<unknown>
  /** Transition: idle/error → loading → success|error. */
  load: () => Promise<void>
  /**
   * Transition: success|refreshing → refreshing → success|error.
   * Falls back to `load()` (shows skeleton) when status is idle or error,
   * since there is no stale data to preserve in those states.
   * If called while `loading`, the in-flight request is aborted and a fresh
   * load begins (skeleton remains visible).
   */
  refresh: () => Promise<void>
  /** Return to idle, cancelling any in-flight request and clearing data and error. */
  reset: () => void
}

export interface DataLoaderConfig<T> {
  /**
   * Called on each load/refresh. The `signal` is aborted when `reset()` is
   * called or when a newer request supersedes this one, so fetch
   * implementations can propagate it to `fetch(url, { signal })` or similar.
   */
  fetch: (signal: AbortSignal) => Promise<T>
}

/**
 * Async data-fetch state machine. Status transitions:
 *   idle → loading → success | error
 *   success → refreshing → success | error
 *
 * Call `load()` once on mount. Call `refresh()` to reload while keeping
 * stale data visible. Data stays defined across a refresh so the UI doesn't
 * blank out.
 */
export function createDataLoader<T>(config: DataLoaderConfig<T>): DataLoaderState<T> {
  const [status, setStatus] = createSignal<LoaderStatus>("idle")
  // Boxed to prevent Solid from treating a function T as a setter updater.
  const [data, setData] = createSignal<{ value: T } | undefined>(undefined)
  const [error, setError] = createSignal<unknown>(undefined)
  let gen = 0
  let controller: AbortController | null = null

  async function run(isRefresh: boolean): Promise<void> {
    const mine = ++gen
    controller?.abort()
    controller = new AbortController()
    const signal = controller.signal
    setStatus(isRefresh ? "refreshing" : "loading")
    setError(undefined)
    try {
      const result = await config.fetch(signal)
      if (gen !== mine) return
      batch(() => {
        controller = null
        setData({ value: result })
        setStatus("success")
      })
    } catch (err) {
      if (gen !== mine) return
      batch(() => {
        setError(err)
        setStatus("error")
      })
    }
  }

  function reset(): void {
    controller?.abort()
    controller = null
    gen++
    batch(() => {
      setData(undefined)
      setError(undefined)
      setStatus("idle")
    })
  }

  return {
    status,
    data: () => data()?.value,
    error,
    load: () => run(false),
    refresh: () => {
      const s = untrack(status)
      return run(s === "success" || s === "refreshing")
    },
    reset,
  }
}
