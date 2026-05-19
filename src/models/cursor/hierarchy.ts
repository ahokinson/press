import { type Accessor, batch, createMemo, createSignal } from "solid-js"

export interface HierarchyLevelConfig {
  /** Reactive accessor — how many items live at this level given the current selection above. */
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
   * Clamped index at `level` — reads `lengthAt` reactively, so deletions snap into range.
   * Out-of-range levels return a stable `() => 0` accessor (non-reactive).
   */
  indexAt: (level: number) => Accessor<number>
  /**
   * Update the index at `level`. Mutating a level resets every deeper level to 0
   * (cascade reset) — selecting a new parent should reveal the first child, not
   * an arbitrary stale offset. Out-of-range levels are silently ignored.
   */
  setIndexAt: (level: number, fn: (prev: number) => number) => void
}

function clamp(n: number, max: number): number {
  if (max <= 0) return 0
  return Math.max(0, Math.min(n, max - 1))
}

const ZERO_ACCESSOR: Accessor<number> = () => 0

/**
 * N-level cursor with cascade reset. The classic shape for tree-pane TUIs
 * (db → coll → doc; ns → pod → envvar): each level has its own clamped index;
 * setting a parent resets children to 0.
 *
 * Lengths are reactive accessors supplied by the caller — the state primitive
 * doesn't own the data, just the cursor.
 */
export function createHierarchyState(levels: HierarchyLevelConfig[]): HierarchyState {
  if (levels.length === 0) {
    throw new Error("createHierarchyState requires at least one level")
  }

  const raws = levels.map(() => createSignal(0))
  const [focus, setFocusRaw] = createSignal(0)

  const memos: Accessor<number>[] = levels.map((cfg, i) => {
    const [read] = raws[i]!
    return createMemo(() => clamp(read(), cfg.length()))
  })

  function setFocus(level: number): void {
    if (level < 0 || level >= levels.length) return
    setFocusRaw(level)
  }

  function focusNext(): void {
    setFocusRaw((p) => (p + 1) % levels.length)
  }

  function focusPrev(): void {
    setFocusRaw((p) => (p - 1 + levels.length) % levels.length)
  }

  function setIndexAt(level: number, fn: (prev: number) => number): void {
    if (level < 0 || level >= levels.length) return
    batch(() => {
      const [read, write] = raws[level]!
      const max = levels[level]!.length()
      write(clamp(fn(read()), max))
      for (let i = level + 1; i < levels.length; i++) {
        raws[i]![1](0)
      }
    })
  }

  return {
    levelCount: levels.length,
    focus,
    setFocus,
    focusNext,
    focusPrev,
    indexAt: (level) => memos[level] ?? ZERO_ACCESSOR,
    setIndexAt,
  }
}
