import { type Accessor, createSignal } from "solid-js"

export interface HistoryOptions<TState> {
  initial: TState
  /**
   * Maximum number of past states retained behind `current`. Defaults to 100.
   * When the cap is hit, the oldest past state is dropped. Must be a positive
   * integer.
   */
  limit?: number
}

export interface History<TState> {
  current: Accessor<TState>
  /** Number of states retained including `current`. */
  size: Accessor<number>
  canUndo: Accessor<boolean>
  canRedo: Accessor<boolean>
  /**
   * Append a new state at the cursor. Any future states beyond the cursor
   * (redo stack) are discarded. History is linear, no branching. No-op when
   * `next` is referentially identical to `current`.
   */
  push: (next: TState) => void
  /** Step back one state. No-op when `canUndo()` is false. */
  undo: () => void
  /** Step forward one state. No-op when `canRedo()` is false. */
  redo: () => void
  /** Reset history to a single state. Defaults to the original `initial`. */
  reset: (next?: TState) => void
}

const DEFAULT_LIMIT = 100

/**
 * Linear, bounded snapshot history. `push` discards the redo tail. Pressing
 * undo then editing forks off a new line and loses the discarded future,
 * matching most text editors. Keep snapshots immutable; the history does not
 * clone.
 */
export function createHistory<TState>(options: HistoryOptions<TState>): History<TState> {
  const limit = options.limit ?? DEFAULT_LIMIT
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`createHistory: limit must be a positive integer, got ${limit}`)
  }

  const [stack, setStack] = createSignal<readonly TState[]>([options.initial])
  const [cursor, setCursor] = createSignal(0)

  const current = () => stack()[cursor()] as TState
  const size = () => stack().length
  const canUndo = () => cursor() > 0
  const canRedo = () => cursor() < stack().length - 1

  function push(next: TState): void {
    if (Object.is(next, current())) return
    const truncated = stack().slice(0, cursor() + 1)
    truncated.push(next)
    const overflow = truncated.length - limit
    const trimmed = overflow > 0 ? truncated.slice(overflow) : truncated
    setStack(trimmed)
    setCursor(trimmed.length - 1)
  }

  function undo(): void {
    if (!canUndo()) return
    setCursor((value) => value - 1)
  }

  function redo(): void {
    if (!canRedo()) return
    setCursor((value) => value + 1)
  }

  function reset(next?: TState): void {
    setStack([next ?? options.initial])
    setCursor(0)
  }

  return { current, size, canUndo, canRedo, push, undo, redo, reset }
}
