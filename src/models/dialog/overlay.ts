import { createSignal } from "solid-js"

/**
 * Generic discriminated-overlay state machine. Consumers define their own
 * variant union and pass it as `T`. The engine owns the current variant and
 * provides `set`/`close` helpers. Render with a Solid `<Switch>` on
 * `overlay().kind`. This module has no UI.
 */
export interface OverlayState<T extends { kind: string }> {
  overlay: () => T
  set: (next: T) => void
  close: () => void
  /** Return the current value if its `kind` matches, else `null`. */
  asKind: <K extends T["kind"]>(kind: K) => Extract<T, { kind: K }> | null
}

export function createOverlayState<T extends { kind: string }>(initial: T): OverlayState<T> {
  const [overlay, setOverlay] = createSignal<T>(initial)
  return {
    overlay,
    set: (next) => setOverlay(() => next),
    close: () => setOverlay(() => initial),
    asKind<K extends T["kind"]>(kind: K): Extract<T, { kind: K }> | null {
      const current = overlay()
      return current.kind === kind ? (current as Extract<T, { kind: K }>) : null
    },
  }
}
