import { type Accessor, createSignal } from "solid-js"

export interface ToggleSet<T> {
  has: (key: T) => boolean
  size: Accessor<number>
  values: Accessor<ReadonlySet<T>>
  toggle: (key: T) => void
  add: (key: T) => void
  delete: (key: T) => void
  clear: () => void
}

/**
 * Reactive Set of keys with toggle/clear. The UI re-renders when membership
 * changes. Stores keys structurally; pass strings or other stable values.
 */
export function createToggleSet<T>(initial?: Iterable<T>): ToggleSet<T> {
  const [set, setSet] = createSignal<Set<T>>(new Set(initial ?? []), { equals: false })

  function mutate(fn: (next: Set<T>) => void): void {
    setSet((prev) => {
      const next = new Set(prev)
      fn(next)
      return next
    })
  }

  return {
    has: (key) => set().has(key),
    size: () => set().size,
    values: () => set(),
    toggle: (key) =>
      mutate((next) => {
        if (next.has(key)) next.delete(key)
        else next.add(key)
      }),
    add: (key) => mutate((next) => next.add(key)),
    delete: (key) => mutate((next) => next.delete(key)),
    clear: () => {
      if (set().size === 0) return
      setSet(new Set<T>())
    },
  }
}
