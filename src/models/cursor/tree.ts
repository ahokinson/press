import { createToggleSet } from "@models/set/toggle.ts"
import { createNavigationCursor } from "@signals"
import { type Accessor, createMemo } from "solid-js"

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
  /** Move cursor down. Wraps at the bottom. No-op when no rows. */
  focusNext: () => void
  /** Move cursor up. Wraps at the top. No-op when no rows. */
  focusPrev: () => void
}

export interface TreeStateOptions {
  /** IDs that should start expanded. */
  initialExpanded?: Iterable<string>
}

/**
 * Hierarchical expand/collapse + cursor state for a recursive `TreeNode<T>`
 * structure.
 *
 * The expanded set is reactive (via `createToggleSet`). `visible()` is a
 * memo that walks the tree depth-first, skipping subtrees whose parent is
 * collapsed.
 */
export function createTreeState<T>(roots: Accessor<TreeNode<T>[]>, opts: TreeStateOptions = {}): TreeState<T> {
  const expandedSet = createToggleSet<string>(opts.initialExpanded)

  const visible = createMemo<VisibleTreeRow<T>[]>(() => {
    const expanded = expandedSet.set()
    const rows: VisibleTreeRow<T>[] = []
    function walk(nodes: TreeNode<T>[], depth: number): void {
      for (const node of nodes) {
        const hasChildren = (node.children?.length ?? 0) > 0
        const isExpanded = hasChildren && expanded.has(node.id)
        rows.push({ node, depth, hasChildren, isExpanded })
        if (isExpanded) walk(node.children!, depth + 1)
      }
    }
    walk(roots(), 0)
    return rows
  })

  const nav = createNavigationCursor({ length: () => visible().length, wrap: true })

  return {
    roots,
    expanded: expandedSet.set,
    isExpanded: (id) => expandedSet.has(id),
    toggle: (id) => expandedSet.toggle(id),
    expand: (id) => expandedSet.add(id),
    collapse: (id) => expandedSet.delete(id),
    visible,
    cursor: nav.cursor,
    setCursor: (index) => nav.setCursor(index),
    focusNext: nav.next,
    focusPrev: nav.prev,
  }
}
