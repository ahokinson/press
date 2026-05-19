export interface CollapsibleGroup<H, C> {
  /** Stable identifier — used to look up expansion state and as the row key. */
  key: string
  header: H
  children: readonly C[]
}

export type CollapsibleRow<H, C> =
  | {
      kind: "header"
      key: string
      header: H
      childCount: number
      expanded: boolean
    }
  | {
      kind: "child"
      child: C
      parentKey: string
    }

/**
 * Flatten a list of groups into a renderable row stream: one header per group,
 * plus each group's children iff its key is in `expanded`. Pure — pass a fresh
 * `expanded` set when membership changes and the output rebuilds.
 *
 * Membership semantics: a key in `expanded` means "this header is open". Empty
 * set ⇒ all groups collapsed. Pair with `createToggleSet<string>()` for the
 * common reactive case.
 */
export function flattenGroups<H, C>(
  groups: readonly CollapsibleGroup<H, C>[],
  expanded: ReadonlySet<string>,
): CollapsibleRow<H, C>[] {
  const out: CollapsibleRow<H, C>[] = []
  for (const g of groups) {
    const isExpanded = expanded.has(g.key)
    out.push({
      kind: "header",
      key: g.key,
      header: g.header,
      childCount: g.children.length,
      expanded: isExpanded,
    })
    if (isExpanded) {
      for (const c of g.children) {
        out.push({ kind: "child", child: c, parentKey: g.key })
      }
    }
  }
  return out
}
