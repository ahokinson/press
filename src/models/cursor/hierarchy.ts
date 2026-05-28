import { createNavigationCursor } from "@signals"
import { type Accessor, batch, createMemo, createSignal } from "solid-js"

export interface HierarchyLevelConfig {
  /** How many items live at this level given the current selection above. Reactive. */
  length: () => number
}

export interface HierarchyState {
  /** How many levels were configured. */
  levelCount: number
  /** Which level the user is currently focused on (0-indexed). */
  focus: Accessor<number>
  /** Out-of-range levels are silently ignored. */
  setFocus: (level: number) => void
  focusNext: () => void
  focusPrev: () => void
  /**
   * Clamped index at `level`. Reads `lengthAt` reactively, so deletions snap
   * into range. Out-of-range levels return a stable `() => 0` accessor
   * (non-reactive).
   */
  indexAt: (level: number) => Accessor<number>
  /**
   * Update the index at `level`. Mutating a level resets every deeper level
   * to 0 (cascade reset), so a new parent reveals the first child rather than
   * a stale offset. Out-of-range levels are silently ignored.
   */
  setIndexAt: (level: number, update: (previous: number) => number) => void
}

function clamp(value: number, max: number): number {
  if (max <= 0) return 0
  return Math.max(0, Math.min(value, max - 1))
}

const ZERO_ACCESSOR: Accessor<number> = () => 0

/**
 * N-level cursor with cascade reset. The shape for tree-pane TUIs
 * (db → coll → doc, ns → pod → envvar). Each level has its own clamped
 * index. Setting a parent resets children to 0.
 *
 * Lengths are reactive accessors supplied by the caller. The state primitive
 * owns the cursor, not the data.
 */
export function createHierarchyState(levels: HierarchyLevelConfig[]): HierarchyState {
  if (levels.length === 0) {
    throw new Error("createHierarchyState requires at least one level")
  }

  const raws = levels.map(() => createSignal(0))
  const focusNav = createNavigationCursor({ length: () => levels.length, wrap: true })

  const memos: Accessor<number>[] = levels.map((config, index) => {
    const [read] = raws[index]!
    return createMemo(() => clamp(read(), config.length()))
  })

  function setFocus(level: number): void {
    if (level < 0 || level >= levels.length) return
    focusNav.setCursor(level)
  }

  function setIndexAt(level: number, update: (previous: number) => number): void {
    if (level < 0 || level >= levels.length) return
    batch(() => {
      const [read, write] = raws[level]!
      const max = levels[level]!.length()
      write(clamp(update(read()), max))
      for (let deeperLevel = level + 1; deeperLevel < levels.length; deeperLevel++) {
        raws[deeperLevel]![1](0)
      }
    })
  }

  return {
    levelCount: levels.length,
    focus: focusNav.cursor,
    setFocus,
    focusNext: focusNav.next,
    focusPrev: focusNav.prev,
    indexAt: (level) => memos[level] ?? ZERO_ACCESSOR,
    setIndexAt,
  }
}
