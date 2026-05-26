/**
 * Coalesce concurrent async calls keyed by `K`. While a flight for a key is
 * pending, additional `run(key, …)` calls share the same promise instead of
 * invoking the factory again.
 *
 *   const coalesce = createCoalescer<string, Quote>()
 *   async function quote(symbol: string) {
 *     return coalesce.run(symbol, () => fetchQuote(symbol))
 *   }
 *
 * Each entry clears once its promise settles (success or failure). Failures
 * are not cached. Related: `createStaleGuard` discards a stale result after
 * the await; this primitive prevents the duplicate await in the first place.
 */
export interface Coalescer<K, V> {
  /**
   * Run `factory()` if no flight is in progress for `key`, otherwise return
   * the existing in-flight promise. Factory is invoked synchronously on the
   * first call. Synchronous throws from `factory` surface as a rejected
   * promise from `run`.
   */
  run: (key: K, factory: () => Promise<V>) => Promise<V>
  /**
   * Drop any in-flight entry for `key`. Rarely needed: entries clear on
   * settle. Forces the next call to start a fresh flight even while the
   * current one is still pending.
   */
  forget: (key: K) => void
  /** Number of in-flight entries. */
  size: () => number
}

export function createCoalescer<K, V>(): Coalescer<K, V> {
  const inflight = new Map<K, Promise<V>>()

  return {
    run(key, factory) {
      const existing = inflight.get(key)
      if (existing) return existing
      let promise: Promise<V>
      try {
        promise = factory()
      } catch (err) {
        return Promise.reject(err)
      }
      const tracked = promise.finally(() => {
        // Only clear if we're still the registered flight. A `forget(key)`
        // followed by a fresh `run(key, …)` could have replaced us.
        if (inflight.get(key) === tracked) inflight.delete(key)
      })
      inflight.set(key, tracked)
      return tracked
    },
    forget(key) {
      inflight.delete(key)
    },
    size() {
      return inflight.size
    },
  }
}
