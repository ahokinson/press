import type { KeyEvent, KeymapLayer } from "@keyboard"
import { type Accessor, createMemo, createSignal } from "solid-js"

export interface FocusRingOptions {
  /** Wrap past the ends when stepping. Default true. */
  wrap?: boolean
}

// biome-ignore lint/suspicious/noConfusingVoidType: handlers commonly return implicit void; boolean | void is the intended permissive shape
export type FocusHandler = (event: KeyEvent) => boolean | void

export interface FocusHandle {
  id: string
  isFocused: Accessor<boolean>
  focus: () => void
  blur: () => void
  /**
   * Drop this focusable from the ring. Focus clears if it was the active one.
   * Call from `onCleanup` on unmount.
   */
  release: () => void
}

export interface FocusRing {
  /** Currently focused id, or `null` when nothing is focused. */
  focused: Accessor<string | null>
  /** Registered ids in registration order. Reactive. */
  ids: Accessor<readonly string[]>
  /**
   * Register a focusable. Re-registering the same id updates its handler in
   * place. Returns a handle for focus/blur/release.
   */
  register: (id: string, handler?: FocusHandler) => FocusHandle
  focus: (id: string) => void
  blur: () => void
  /**
   * Move focus to the next registered focusable. When nothing is focused,
   * picks the first id. When at the last id, wraps to the first (or stays
   * put if `wrap: false`).
   */
  next: () => void
  /** Mirror of `next` going the other direction. */
  prev: () => void
  /**
   * Keymap layer that routes events to the focused focusable's handler.
   * Inactive when nothing is focused or the focused focusable has no handler.
   */
  layer: KeymapLayer
}

interface Entry {
  handler: FocusHandler | undefined
}

const WRAP_DEFAULT = true

/**
 * Reactive focus ring across a set of registered focusables. Press doesn't
 * intercept keys. Wire `tab`/`shift-tab`/`escape` to `next`/`prev`/`blur` in
 * your top-level keymap, and drop `ring.layer` into `composeKeymap` so
 * per-focusable handlers fire when their focusable is active.
 */
export function createFocusRing(options: FocusRingOptions = {}): FocusRing {
  const wrap = options.wrap ?? WRAP_DEFAULT
  const [entries, setEntries] = createSignal<ReadonlyMap<string, Entry>>(new Map(), { equals: false })
  const [focused, setFocused] = createSignal<string | null>(null)

  const ids = createMemo<readonly string[]>(() => Array.from(entries().keys()))

  function focus(id: string): void {
    if (!entries().has(id)) return
    setFocused(id)
  }

  function blur(): void {
    setFocused(null)
  }

  function step(delta: 1 | -1): void {
    const list = ids()
    if (list.length === 0) return
    const active = focused()
    if (active === null) {
      setFocused(delta === 1 ? list[0]! : list[list.length - 1]!)
      return
    }
    const index = list.indexOf(active)
    const target = index + delta
    if (target < 0) {
      setFocused(wrap ? list[list.length - 1]! : list[0]!)
      return
    }
    if (target >= list.length) {
      setFocused(wrap ? list[0]! : list[list.length - 1]!)
      return
    }
    setFocused(list[target]!)
  }

  function register(id: string, handler?: FocusHandler): FocusHandle {
    setEntries((previous) => {
      const next = new Map(previous)
      next.set(id, { handler })
      return next
    })

    return {
      id,
      isFocused: () => focused() === id,
      focus: () => focus(id),
      blur: () => {
        if (focused() === id) blur()
      },
      release: () => {
        setEntries((previous) => {
          if (!previous.has(id)) return previous
          const next = new Map(previous)
          next.delete(id)
          return next
        })
        if (focused() === id) setFocused(null)
      },
    }
  }

  const layer: KeymapLayer = {
    active: () => {
      const id = focused()
      if (id === null) return false
      return entries().get(id)?.handler !== undefined
    },
    handler: (event) => {
      const id = focused()
      if (id === null) return false
      const entry = entries().get(id)
      if (!entry?.handler) return false
      return entry.handler(event) === true
    },
  }

  return {
    focused,
    ids,
    register,
    focus,
    blur,
    next: () => step(1),
    prev: () => step(-1),
    layer,
  }
}
