/**
 * Primitive types safe to use as key slots. Strict-equal on these matches
 * value semantics. Objects, arrays, and functions are excluded because `===`
 * compares by reference and would silently lie on in-place mutation. Convert
 * such state to a stable id at the call site.
 */
export type StaleKeyPrimitive = string | number | bigint | boolean | symbol | null | undefined

/**
 * Race guard for async work. Snapshot a key tuple before awaiting, check
 * `fresh()` after. If the live key has changed, the captured stamp is stale
 * and the result should be discarded.
 *
 *   const guard = createStaleGuard(() => [context(), namespace()])
 *   async function probe() {
 *     const stamp = guard.stamp()
 *     const result = await fetchSomething()
 *     if (!stamp.fresh()) return
 *     applyResult(result)
 *   }
 *
 * Equality is strict-equal on each tuple slot. The key type is constrained
 * to primitives so object-reference traps surface at compile time.
 */
export interface StaleStamp<T extends readonly StaleKeyPrimitive[]> {
  /** Snapshot of the key at stamp time. */
  readonly captured: T
  /** `true` when the live key still matches the captured snapshot. */
  fresh: () => boolean
}

export interface StaleGuard<T extends readonly StaleKeyPrimitive[]> {
  /** Capture the current key. Call before `await`. Check `fresh()` after. */
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
  for (let index = 0; index < a.length; index++) if (a[index] !== b[index]) return false
  return true
}
