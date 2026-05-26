import { createMemo, createSignal } from "solid-js"

/**
 * In-memory screen history. `top()` is the current view. Render it with a
 * Solid `<Switch>` to mount the right component. The stack lives until
 * process exit.
 *
 * `T` is caller-defined. Declare a discriminated union of your screens
 * (`{ kind: "list" } | { kind: "detail"; id: string }`) and the stack carries
 * them as-is. The stack is for whole-screen swaps. Modals are not screens.
 * Use `createOverlayState` for those.
 *
 * `pop()` at the root is a no-op so the app decides whether Escape on the
 * root quits.
 */
export interface ScreenStack<T> {
  /** The current top of the stack. Always defined. */
  top: () => T
  /** Number of entries in the stack. Minimum 1. */
  depth: () => number
  /** Bottom-to-top view of the stack. */
  stack: () => readonly T[]
  /** Push a new screen on top of the current one. */
  push: (screen: T) => void
  /** Drop the top screen. No-op when `depth() === 1`. */
  pop: () => void
  /** Swap the current top without changing depth. */
  replace: (screen: T) => void
  /** Discard the entire stack and start over with `screen` at the root. */
  reset: (screen: T) => void
}

export function createScreenStack<T>(initial: T): ScreenStack<T> {
  const [stack, setStack] = createSignal<readonly T[]>([initial])

  const top = createMemo<T>(() => {
    const current = stack()
    return current[current.length - 1]!
  })

  const depth = createMemo<number>(() => stack().length)

  return {
    top,
    depth,
    stack,
    push: (screen) => setStack((previous) => [...previous, screen]),
    pop: () => setStack((previous) => (previous.length <= 1 ? previous : previous.slice(0, -1))),
    replace: (screen) =>
      setStack((previous) => {
        const next = previous.slice(0, -1)
        next.push(screen)
        return next
      }),
    reset: (screen) => setStack(() => [screen]),
  }
}
