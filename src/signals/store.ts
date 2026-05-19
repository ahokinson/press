import { createStore, produce } from "solid-js/store"

export interface IndexedStore<K extends string, V extends object> {
  /** Snapshot of the underlying record. Reactive. */
  entries: () => Readonly<Record<K, V>>
  get: (key: K) => V | undefined
  /** All current keys. Reactive. */
  keys: () => K[]
  /** Number of entries. Reactive. */
  size: () => number
  /** Insert (or overwrite) the entry at `key` with a full `V`. */
  set: (key: K, value: V) => void
  /** Shallow-merge into the entry at `key`. No-op when the key is missing. */
  update: (key: K, partial: Partial<V>) => void
  /**
   * Insert-or-merge: when the key is missing, behaves like `set`; when present,
   * shallow-merges like `update`. Matches the common "fetch then apply" shape
   * for symbol-/id-indexed caches.
   */
  upsert: (key: K, value: V) => void
  /** Delete an entry. No-op when key is missing. */
  remove: (key: K) => void
  /** Replace the entire map wholesale. */
  replace: (next: Record<K, V>) => void
  /** Drop every entry. */
  clear: () => void
}

/**
 * Reactive wrapper around `createStore<Record<K, V>>()` for the common
 * "indexed by key" pattern (quote-by-symbol, holding-by-symbol, request-by-id).
 *
 * `set` overwrites; `update` shallow-merges into an existing entry (no-op if
 * missing). Reactive reads go through `entries()` / `keys()` / `size()`; the
 * underlying store is hidden so callers don't accidentally mutate it via
 * shared reference.
 */
export function createIndexedStore<K extends string, V extends object>(
  initial: Record<K, V> = {} as Record<K, V>,
): IndexedStore<K, V> {
  const [state, setState] = createStore<Record<K, V>>({ ...initial })

  function set(key: K, value: V): void {
    setState(
      produce((draft) => {
        draft[key] = value
      }),
    )
  }

  function update(key: K, partial: Partial<V>): void {
    setState(
      produce((draft) => {
        const existing = draft[key]
        if (existing === undefined) return
        Object.assign(existing, partial)
      }),
    )
  }

  function upsert(key: K, value: V): void {
    setState(
      produce((draft) => {
        const existing = draft[key]
        if (existing === undefined) {
          draft[key] = value
        } else {
          Object.assign(existing, value)
        }
      }),
    )
  }

  function remove(key: K): void {
    setState(
      produce((draft) => {
        delete draft[key]
      }),
    )
  }

  function replace(next: Record<K, V>): void {
    setState(
      produce((draft) => {
        for (const k of Object.keys(draft) as K[]) {
          delete draft[k]
        }
        Object.assign(draft, next)
      }),
    )
  }

  function clear(): void {
    setState(
      produce((draft) => {
        for (const k of Object.keys(draft) as K[]) {
          delete draft[k]
        }
      }),
    )
  }

  return {
    entries: () => state,
    get: (key) => state[key],
    keys: () => Object.keys(state) as K[],
    size: () => Object.keys(state).length,
    set,
    update,
    upsert,
    remove,
    replace,
    clear,
  }
}
