import { createSignal } from "solid-js"

export interface NumericEditorConfig {
  initial: () => number
  min?: number
  max?: number
  step?: number
  onCommit: (value: number) => void
}

export interface NumericEditor {
  /** The current buffer (a string so partial edits like "" or "1" are addressable). */
  editing: () => string
  setEditing: (v: string) => void
  /** Increment the buffered number by `step`, clamped to [min, max]. */
  increment: () => void
  /** Decrement the buffered number by `step`, clamped to [min, max]. */
  decrement: () => void
  /**
   * Parse the buffer as an integer; if valid and changed, call `onCommit` with
   * the clamped value. Buffer is rewritten to the canonical clamped string.
   * If invalid, buffer is reset from `initial()`.
   */
  commit: () => void
  /** Reload the buffer from `initial()`. Use when the editor is (re)opened. */
  reset: () => void
}

/**
 * Buffered numeric field for inline TUI editors. The buffer is a string so
 * partial states ("", "1") are observable; `commit()` is the only path that
 * parses, clamps, and reports a final value. Wire j/k (or up/down) to
 * `increment`/`decrement`, enter/esc to `commit`.
 */
export function createNumericEditor(config: NumericEditorConfig): NumericEditor {
  const step = config.step ?? 1
  const min = config.min ?? Number.NEGATIVE_INFINITY
  const max = config.max ?? Number.POSITIVE_INFINITY

  const [editing, setEditing] = createSignal(String(clamp(config.initial(), min, max)))

  function adjust(delta: number) {
    const current = parseInt(editing(), 10)
    const base = Number.isNaN(current) ? config.initial() : current
    setEditing(String(clamp(base + delta, min, max)))
  }

  function reset() {
    setEditing(String(clamp(config.initial(), min, max)))
  }

  function commit() {
    const parsed = parseInt(editing(), 10)
    if (Number.isNaN(parsed)) {
      reset()
      return
    }
    const clamped = clamp(parsed, min, max)
    const previous = config.initial()
    if (clamped !== previous) config.onCommit(clamped)
    setEditing(String(clamped))
  }

  return {
    editing,
    setEditing,
    increment: () => adjust(step),
    decrement: () => adjust(-step),
    commit,
    reset,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
