export interface CollapsibleGroup<H, C> {
  /** Stable identifier. Used to look up expansion state and as the row key. */
  key: string
  header: H
  children: readonly C[]
}

export enum CollapsibleRowKind {
  Header = "header",
  Child = "child",
}

export type CollapsibleRow<H, C> =
  | {
      kind: CollapsibleRowKind.Header
      key: string
      header: H
      childCount: number
      expanded: boolean
    }
  | {
      kind: CollapsibleRowKind.Child
      child: C
      parentKey: string
    }

/**
 * Flatten a list of groups into a renderable row stream: one header per
 * group, plus each group's children iff its key is in `expanded`. Pure. Pass
 * a fresh `expanded` set when membership changes and the output rebuilds.
 *
 * A key in `expanded` means "this header is open". An empty set collapses
 * every group.
 */
export function flattenGroups<H, C>(
  groups: readonly CollapsibleGroup<H, C>[],
  expanded: ReadonlySet<string>,
): CollapsibleRow<H, C>[] {
  const rows: CollapsibleRow<H, C>[] = []
  for (const group of groups) {
    const isExpanded = expanded.has(group.key)
    rows.push({
      kind: CollapsibleRowKind.Header,
      key: group.key,
      header: group.header,
      childCount: group.children.length,
      expanded: isExpanded,
    })
    if (isExpanded) {
      for (const child of group.children) {
        rows.push({ kind: CollapsibleRowKind.Child, child, parentKey: group.key })
      }
    }
  }
  return rows
}
