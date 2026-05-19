/**
 * Primitive types safe to use as key slots: strict-equal on these matches
 * value semantics. Objects/arrays/functions are excluded because `===` would
 * compare by reference and silently lie when the object mutates in place;
 * convert such state to a stable id (string/number) at the call site.
 */
export type StaleKeyPrimitive = string | number | bigint | boolean | symbol | null | undefined

/**
 * Race guard for async work: snapshot a "key" tuple before awaiting, then
 * check `fresh()` after. If the live key has changed, the captured stamp is
 * stale and the result should be discarded.
 *
 * Common case: a TUI that has a current context+namespace and runs async
 * probes. While the probe is in flight the user switches context; the probe's
 * resolution must not write into the new context's state.
 *
 *   const guard = createStaleGuard(() => [context(), namespace()])
 *   async function probe() {
 *     const stamp = guard.stamp()
 *     const result = await fetchSomething()
 *     if (!stamp.fresh()) return   // user navigated away — drop
 *     applyResult(result)
 *   }
 *
 * Equality is strict-equal on each tuple slot. The key type is constrained to
 * primitives so object-reference traps surface at compile time.
 */
export interface StaleStamp<T extends readonly StaleKeyPrimitive[]> {
  /** Snapshot of the key at stamp time. */
  readonly captured: T
  /** `true` when the live key still matches the captured snapshot. */
  fresh: () => boolean
}

export interface StaleGuard<T extends readonly StaleKeyPrimitive[]> {
  /** Capture the current key. Call before `await`; check `fresh()` after. */
  stamp: () => StaleStamp<T>
}

export function createStaleGuard<T extends readonly StaleKeyPrimitive[]>(key: () => T): StaleGuard<T> {
  return {
    stamp: () => {
      const captured = key()
      return {
        captured,
        fresh: () => tupleEqual(key(), captured),
      }
    },
  }
}

function tupleEqual(a: readonly StaleKeyPrimitive[], b: readonly StaleKeyPrimitive[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}
