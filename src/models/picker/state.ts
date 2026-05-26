import { scorePickable } from "@models/picker/score.ts"
import { createNavigationCursor } from "@signals"
import { createMemo, createSignal } from "solid-js"

export interface Pickable {
  /** Stable id used to dedupe when multiple sources contribute items. */
  id: string
  /** Primary text rendered in the row and the leading search target. */
  label: string
  /** Extra search terms. Not displayed; matched the same as `label`. */
  keywords?: readonly string[]
  /** Right-aligned cluster label rendered in `dim` (e.g. "Edit", "View"). */
  group?: string
  /** Right-aligned chip (e.g. "⌘P"). Pure paint; the picker doesn't bind keys. */
  hint?: string
}

export interface PickerConfig<T> {
  items: () => readonly T[]
  /**
   * Project a domain item into the renderable / searchable shape. Called once
   * per item per `items()` evaluation. Keep it pure and inexpensive; no side
   * effects.
   */
  shape: (item: T) => Pickable
  /**
   * Invoked when the user accepts a row. Returning `false` synchronously
   * keeps the picker open and clears the query. Anything else (void, true,
   * a Promise) closes the picker immediately. A returned Promise is not
   * awaited; its rejection becomes an unhandled rejection.
   */
  // biome-ignore lint/suspicious/noConfusingVoidType: callers commonly write `() => {}`; void + boolean is the intended permissive shape
  onAccept: (item: T) => void | boolean | Promise<undefined | boolean>
}

export interface PickerState<T> {
  isOpen: () => boolean
  open: () => void
  close: () => void
  toggle: () => void

  query: () => string
  /** Setting the query also resets `cursor` to 0 so the top result is preselected. */
  setQuery: (value: string) => void

  /** Filtered + scored items in display order. Reactive. */
  visible: () => readonly T[]
  /** Memoized projection of an item to its `Pickable`. Lookup is O(1) for items in `items()`. */
  shapeOf: (item: T) => Pickable

  cursor: () => number
  setCursor: (value: number) => void
  /** Clamped relative move; pass ±1 for ↑/↓. */
  move: (delta: number) => void
  /** `visible()[cursor()]`. `undefined` when the visible list is empty. */
  active: () => T | undefined

  /**
   * Run `config.onAccept` on the active item. Closes the picker unless
   * `onAccept` returns `false` synchronously. No-op when no item is active.
   * Rethrows synchronous errors from `onAccept` after closing.
   */
  accept: () => Promise<void>
}

interface ProjectedEntry<T> {
  item: T
  pickable: Pickable
  declaredAt: number
}

/**
 * Generic fuzzy-select primitive. A query bar above a filtered list of items.
 * Enter accepts the active row. Powers command palettes, file pickers,
 * branch pickers, recent-items lists; callers adapt their domain type via
 * the `shape` projection.
 *
 * The caller wires keyboard. The picker doesn't subscribe to `useKeyboard`.
 *
 *   const picker = createPicker<MyCommand>({
 *     items: commands,
 *     shape: (c) => ({ id: c.id, label: c.label, hint: c.hint }),
 *     onAccept: (c) => c.run(),
 *   })
 */
export function createPicker<T>(config: PickerConfig<T>): PickerState<T> {
  const [isOpen, setIsOpen] = createSignal(false)
  const [query, setQueryRaw] = createSignal("")

  const projected = createMemo<readonly ProjectedEntry<T>[]>(() => {
    const all = config.items()
    const byId = new Map<string, ProjectedEntry<T>>()
    const ordered: ProjectedEntry<T>[] = []
    for (let index = 0; index < all.length; index++) {
      const item = all[index]!
      const pickable = config.shape(item)
      const previous = byId.get(pickable.id)
      if (previous) {
        const slot = ordered.indexOf(previous)
        if (slot !== -1) ordered.splice(slot, 1)
      }
      const entry: ProjectedEntry<T> = { item, pickable, declaredAt: index }
      byId.set(pickable.id, entry)
      ordered.push(entry)
    }
    return ordered
  })

  const shapeMap = createMemo<Map<T, Pickable>>(() => {
    const map = new Map<T, Pickable>()
    for (const entry of projected()) map.set(entry.item, entry.pickable)
    return map
  })

  function shapeOf(item: T): Pickable {
    const cached = shapeMap().get(item)
    if (cached) return cached
    return config.shape(item)
  }

  const visible = createMemo<readonly T[]>(() => {
    const all = projected()
    const text = query()
    const scored = all
      .map((entry) => ({ entry, score: scorePickable(entry.pickable, text) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score
        return a.entry.declaredAt - b.entry.declaredAt
      })
    return scored.map((row) => row.entry.item)
  })

  const navigation = createNavigationCursor({ length: () => visible().length, wrap: false })

  const active = createMemo<T | undefined>(() => visible()[navigation.cursor()])

  function setQuery(value: string): void {
    setQueryRaw(value)
    navigation.setCursor(0)
  }

  function open(): void {
    setQueryRaw("")
    navigation.setCursor(0)
    setIsOpen(true)
  }

  function close(): void {
    setIsOpen(false)
  }

  function toggle(): void {
    if (isOpen()) close()
    else open()
  }

  function move(delta: number): void {
    navigation.setCursor((previous) => previous + delta)
  }

  async function accept(): Promise<void> {
    const item = active()
    if (item === undefined) return

    // biome-ignore lint/suspicious/noConfusingVoidType: mirrors the onAccept return shape
    let result: void | boolean | Promise<undefined | boolean>
    try {
      result = config.onAccept(item)
    } catch (error) {
      setIsOpen(false)
      throw error
    }

    if (result === false) {
      setQueryRaw("")
      navigation.setCursor(0)
      return
    }

    setIsOpen(false)
  }

  return {
    isOpen,
    open,
    close,
    toggle,
    query,
    setQuery,
    visible,
    shapeOf,
    cursor: navigation.cursor,
    setCursor: navigation.setCursor,
    move,
    active,
    accept,
  }
}
