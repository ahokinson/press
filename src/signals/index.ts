import { type Accessor, createEffect, createMemo, createSignal, onCleanup } from "solid-js"

export { createIndexedStore, type IndexedStore } from "./store.ts"

export interface ScrollRef {
  scrollTo(position: number | { x: number; y: number }): void
}

/** A captured `<scrollbox>` ref exposing `scrollTo`, `height`, and an optional `onSizeChange`. */
export interface ScrollboxRef extends ScrollRef {
  readonly height: number
  onSizeChange?: (() => void) | undefined
}

function asScrollboxRef(element: unknown): ScrollboxRef | null {
  if (!element || typeof element !== "object") return null
  if (!("height" in element) || typeof (element as { height: unknown }).height !== "number") return null
  if (!("scrollTo" in element) || typeof (element as { scrollTo: unknown }).scrollTo !== "function") return null
  return element as ScrollboxRef
}

const DEFAULT_SCROLL_CONTEXT_ROWS = 1

/** Step a signal through a fixed cycle of values, wrapping at the end. */
export function createCycler<T>(values: readonly T[], signal: () => T, setter: (value: T) => void): () => void {
  return () => {
    if (values.length === 0) return
    const index = values.indexOf(signal())
    const next = values[(index + 1) % values.length]
    if (next !== undefined) setter(next)
  }
}

export interface NavigationCursor {
  /** Clamped cursor. Reads as 0 when length is 0, else stays in [0, length-1]. */
  cursor: Accessor<number>
  /** Write the cursor, clamped to [0, length-1]. Accepts a value or an updater. */
  setCursor: (value: number | ((previous: number) => number)) => void
  /** Move forward one step. Wraps to 0 when `wrap` is true, otherwise stops at the end. */
  next: () => void
  /** Move back one step. Wraps to the end when `wrap` is true, otherwise stops at 0. */
  prev: () => void
}

export interface NavigationCursorOptions {
  /** Number of selectable rows. Reactive. */
  length: () => number
  /** Initial cursor position, clamped to [0, length-1] on read. Default 0. */
  initial?: number
  /** Wrap past the ends. Default false. */
  wrap?: boolean
}

/**
 * Reactive cursor over a variable-length list. Owns the underlying signal and
 * derives a clamped view so reads stay in range when the list shrinks
 * mid-focus. `next`/`prev` step through the clamped view, not the raw signal.
 * See `models/cursor/tree.ts` for why that matters.
 */
export function createNavigationCursor(options: NavigationCursorOptions): NavigationCursor {
  const wrap = options.wrap ?? false
  const [raw, setRaw] = createSignal(options.initial ?? 0)

  const cursor = createMemo<number>(() => {
    const length = options.length()
    if (length <= 0) return 0
    const value = raw()
    if (value < 0) return 0
    if (value >= length) return length - 1
    return value
  })

  function setCursor(value: number | ((previous: number) => number)): void {
    const length = options.length()
    if (length <= 0) {
      setRaw(0)
      return
    }
    const target = typeof value === "function" ? value(cursor()) : value
    setRaw(Math.max(0, Math.min(target, length - 1)))
  }

  function next(): void {
    const length = options.length()
    if (length <= 0) return
    const current = cursor()
    setRaw(wrap ? (current + 1) % length : Math.min(current + 1, length - 1))
  }

  function prev(): void {
    const length = options.length()
    if (length <= 0) return
    const current = cursor()
    setRaw(wrap ? (current - 1 + length) % length : Math.max(0, current - 1))
  }

  return { cursor, setCursor, next, prev }
}

/** Wrap a numeric setter so writes are clamped to [0, maxIndex()]. */
export function createClampedSetter(
  setRaw: (value: number | ((previous: number) => number)) => void,
  maxIndex: () => number,
): (value: number | ((previous: number) => number)) => void {
  return (value) => {
    if (typeof value === "function") {
      setRaw((previous) => {
        const next = value(previous)
        const maximum = Math.max(0, maxIndex())
        return Math.max(0, Math.min(next, maximum))
      })
    } else {
      const maximum = Math.max(0, maxIndex())
      setRaw(Math.max(0, Math.min(value, maximum)))
    }
  }
}

/**
 * Drive a scroll container so the cursor at `cursorY()` stays inside the
 * viewport. `cursorY` is a Y position in the scrollbox's row coordinate
 * space, not a row index. For uniform 1-row-per-item lists those match. For
 * lists with section headers, expandable rows, or non-selectable separators,
 * compute Y from row heights via `cumulativeOffsets`.
 *
 * `contextRows` is the margin (in rows) above and below the cursor before
 * scrolling.
 *
 * Owns the scroll position. Don't scroll the same `scrollRef` through any
 * other path (mouse wheel, page-down hotkeys outside this sync). For
 * bidirectional sync, drive scroll yourself.
 */
export function createScrollSync(
  cursorY: () => number,
  scrollRef: () => ScrollRef | null,
  viewportHeight: () => number,
  contextRows: number = DEFAULT_SCROLL_CONTEXT_ROWS,
): void {
  let scrollTop = 0

  createEffect(() => {
    const position = cursorY()
    const ref = scrollRef()
    const height = viewportHeight()
    if (!ref || typeof ref.scrollTo !== "function" || height <= 0) return

    const topEdge = scrollTop + contextRows
    const bottomEdge = scrollTop + height - 1 - contextRows

    if (position < topEdge) {
      scrollTop = Math.max(0, position - contextRows)
    } else if (position > bottomEdge) {
      scrollTop = position - height + 1 + contextRows
    }

    ref.scrollTo({ x: 0, y: scrollTop })
  })
}

export interface ScrollboxSync {
  /** Attach to `<scrollbox ref={…}>`. Validates the element and wires viewport tracking. */
  bindRef: (element: unknown) => void
  /** Reactive scrollbox viewport height in rows. Zero until `bindRef` first fires. */
  viewport: Accessor<number>
  /** The captured scrollbox handle. `null` until `bindRef` first fires. */
  scrollRef: Accessor<ScrollboxRef | null>
  /** Re-read `height` and push it into the viewport signal. Use after layout changes that don't fire `onSizeChange`. */
  refresh: () => void
}

export interface ScrollboxSyncOptions {
  /** Y position of the cursor in the scrollbox coordinate space (see `createScrollSync`). */
  cursor: () => number
  /** Rows of margin to keep above/below the cursor before scrolling. */
  contextRows?: number
}

/**
 * Bundle the ref-wiring and reactive scroll-sync for a cursor inside a
 * `<scrollbox>`. Owns the scrollbox handle, the viewport-height signal, the
 * `onSizeChange` subscription, and the `createScrollSync` effect. Cleans up
 * on unmount. Call inside a Solid owner.
 *
 *   const sync = createScrollboxSync({ cursor: () => state.cursor() })
 *   <scrollbox ref={sync.bindRef} {...scrollboxOptions}>…</scrollbox>
 */
export function createScrollboxSync(options: ScrollboxSyncOptions): ScrollboxSync {
  const [viewport, setViewport] = createSignal(0)
  const [scrollRef, setScrollRef] = createSignal<ScrollboxRef | null>(null)

  function bindRef(element: unknown): void {
    const ref = asScrollboxRef(element)
    if (!ref) return
    setScrollRef(() => ref)
    setViewport(ref.height)
    const handler = () => setViewport(ref.height)
    ref.onSizeChange = handler
    onCleanup(() => {
      if (ref.onSizeChange === handler) ref.onSizeChange = undefined
    })
  }

  createScrollSync(options.cursor, scrollRef, viewport, options.contextRows)

  function refresh(): void {
    const ref = scrollRef()
    if (ref) setViewport(ref.height)
  }

  return { bindRef, viewport, scrollRef, refresh }
}

/**
 * Sum row heights into cumulative Y offsets. Use for lists with variable row
 * heights (section headers, expanded sub-lines) or mixed selectable and
 * non-selectable rows.
 *
 * `offsets[i]` is the Y position of the top of row `i` in scrollbox
 * coordinate space. `offsets[rows.length]` is the total content height.
 *
 * If the cursor tracks a stable id rather than an index:
 * `cursorY = offsets[indexOf(key)]`.
 */
export function cumulativeOffsets<T>(rows: readonly T[], heightOf: (row: T, index: number) => number): number[] {
  const offsets = new Array<number>(rows.length + 1)
  let y = 0
  for (let index = 0; index < rows.length; index++) {
    offsets[index] = y
    y += heightOf(rows[index]!, index)
  }
  offsets[rows.length] = y
  return offsets
}
