import { createToggleSet } from "@models/set/toggle.ts"
import { type Accessor, createMemo, createSignal } from "solid-js"

export interface TreeNode<T> {
  id: string
  data: T
  children?: TreeNode<T>[]
}

export interface VisibleTreeRow<T> {
  node: TreeNode<T>
  depth: number
  hasChildren: boolean
  isExpanded: boolean
}

export interface TreeState<T> {
  roots: Accessor<TreeNode<T>[]>
  expanded: Accessor<ReadonlySet<string>>
  isExpanded: (id: string) => boolean
  toggle: (id: string) => void
  expand: (id: string) => void
  collapse: (id: string) => void
  /**
   * Flattened, currently-visible rows in display order. Recomputes when roots
   * or the expanded set change.
   */
  visible: Accessor<VisibleTreeRow<T>[]>
  /** Cursor index into `visible()`. Clamped to [0, visible.length - 1]. */
  cursor: Accessor<number>
  setCursor: (index: number) => void
  /** Move cursor down; wraps at the bottom. No-op when no rows. */
  focusNext: () => void
  /** Move cursor up; wraps at the top. No-op when no rows. */
  focusPrev: () => void
}

export interface TreeStateOptions {
  /** IDs that should start expanded. */
  initialExpanded?: Iterable<string>
}

/**
 * Hierarchical expand/collapse + cursor state for a recursive `TreeNode<T>`
 * structure. Pair with `<Tree>` for rendering.
 *
 * The expanded set is reactive (via `createToggleSet`); `visible()` is a
 * memo that walks the tree depth-first, skipping subtrees whose parent is
 * collapsed.
 */
export function createTreeState<T>(roots: Accessor<TreeNode<T>[]>, opts: TreeStateOptions = {}): TreeState<T> {
  const expandedSet = createToggleSet<string>(opts.initialExpanded)
  const [cursorRaw, setCursorRaw] = createSignal(0)

  const visible = createMemo<VisibleTreeRow<T>[]>(() => {
    const set = expandedSet.values()
    const out: VisibleTreeRow<T>[] = []
    function walk(nodes: TreeNode<T>[], depth: number): void {
      for (const node of nodes) {
        const hasChildren = (node.children?.length ?? 0) > 0
        const isExpanded = hasChildren && set.has(node.id)
        out.push({ node, depth, hasChildren, isExpanded })
        if (isExpanded) walk(node.children!, depth + 1)
      }
    }
    walk(roots(), 0)
    return out
  })

  const cursor = createMemo(() => {
    const rows = visible()
    if (rows.length === 0) return 0
    const raw = cursorRaw()
    if (raw < 0) return 0
    if (raw >= rows.length) return rows.length - 1
    return raw
  })

  function setCursor(index: number): void {
    setCursorRaw(index)
  }

  function focusNext(): void {
    const rows = visible()
    if (rows.length === 0) return
    setCursorRaw((c) => (c + 1) % rows.length)
  }

  function focusPrev(): void {
    const rows = visible()
    if (rows.length === 0) return
    setCursorRaw((c) => (c - 1 + rows.length) % rows.length)
  }

  return {
    roots,
    expanded: expandedSet.values,
    isExpanded: (id) => expandedSet.has(id),
    toggle: (id) => expandedSet.toggle(id),
    expand: (id) => expandedSet.add(id),
    collapse: (id) => expandedSet.delete(id),
    visible,
    cursor,
    setCursor,
    focusNext,
    focusPrev,
  }
}
