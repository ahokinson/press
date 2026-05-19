import { createEffect } from "solid-js"

export { createIndexedStore, type IndexedStore } from "./store.ts"

export interface ScrollRef {
  scrollTo(position: number | { x: number; y: number }): void
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

/** Wrap a numeric setter so writes are clamped to [0, maxIndex()]. */
export function createClampedSetter(
  setRaw: (v: number | ((prev: number) => number)) => void,
  maxIndex: () => number,
): (v: number | ((prev: number) => number)) => void {
  return (v) => {
    if (typeof v === "function") {
      setRaw((prev) => {
        const next = v(prev)
        const max = Math.max(0, maxIndex())
        return Math.max(0, Math.min(next, max))
      })
    } else {
      const max = Math.max(0, maxIndex())
      setRaw(Math.max(0, Math.min(v, max)))
    }
  }
}

/**
 * Drive a scroll container so the cursor at `cursorY()` stays inside the
 * viewport. `cursorY` is a **Y position in the scrollbox's row coordinate
 * space** — not a row index. For uniform 1-row-per-item lists the two are
 * the same, but for lists with section headers, expandable rows, or
 * non-selectable separators the caller must compute Y from row heights
 * (see `cumulativeOffsets`).
 *
 * `contextRows` is how many rows of margin to keep above the cursor (top)
 * and below it (bottom) before scrolling.
 *
 * The helper owns the scroll position internally — it assumes the consumer
 * does not scroll the same `scrollRef` through any other path (mouse wheel,
 * page-down hotkeys handled outside this sync). If you need bidirectional
 * sync, drive scroll yourself and use this only as a reference implementation.
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

/**
 * Sum row heights into cumulative Y offsets. Pair with `createScrollSync` for
 * lists that mix selectable and non-selectable rows, or whose rows vary in
 * height (section headers with margin, expanded/revealed sub-lines, etc).
 *
 * Returns an array `offsets` where `offsets[i]` is the Y position of the
 * **top** of row `i` in the scrollbox coordinate space; `offsets[rows.length]`
 * is the total content height.
 *
 * Pass a row-key resolver if the cursor is tracked by something other than
 * its row index (e.g. a stable id). Then `cursorY = offsets[indexOf(key)]`.
 */
export function cumulativeOffsets<T>(rows: readonly T[], heightOf: (row: T, index: number) => number): number[] {
  const out = new Array<number>(rows.length + 1)
  let y = 0
  for (let i = 0; i < rows.length; i++) {
    out[i] = y
    y += heightOf(rows[i]!, i)
  }
  out[rows.length] = y
  return out
}
