import { createSignal } from "solid-js"

/**
 * Generic discriminated-overlay state machine. Consumers define their own
 * variant union and pass it as `T`; the engine just owns the current variant
 * and provides `set` / `close` helpers. Render with a Solid `<Switch>` on
 * `overlay().kind` in the consumer — this module intentionally has no UI.
 */
export interface OverlayState<T extends { kind: string }> {
  overlay: () => T
  set: (next: T) => void
  close: () => void
}

export function createOverlayState<T extends { kind: string }>(initial: T): OverlayState<T> {
  const [overlay, setOverlay] = createSignal<T>(initial)
  return {
    overlay,
    set: (next) => setOverlay(() => next),
    close: () => setOverlay(() => initial),
  }
}

/** Narrow a discriminated overlay to a specific variant. Returns null on miss. */
export function asKind<T extends { kind: string }, K extends T["kind"]>(
  value: T,
  kind: K,
): Extract<T, { kind: K }> | null {
  return value.kind === kind ? (value as Extract<T, { kind: K }>) : null
}
