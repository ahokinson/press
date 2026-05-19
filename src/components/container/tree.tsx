import type { TreeState, VisibleTreeRow } from "@models/cursor/tree.ts"
import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { For, type JSX } from "solid-js"

export interface TreeRenderContext<T> {
  row: VisibleTreeRow<T>
  isCursor: boolean
}

export interface TreeProps<T> {
  state: TreeState<T>
  /**
   * Render the right-hand side of a row (label + any badges). Indent and
   * chevron are owned by the component; the caller paints the data.
   */
  render: (ctx: TreeRenderContext<T>) => JSX.Element
}

const CHEVRON_EXPANDED = "▾"
const CHEVRON_COLLAPSED = "▸"
const LEAF = " "
const INDENT = "  "

/**
 * Renderer for `createTreeState`. Walks the flattened `visible()` rows and
 * paints depth indent + chevron + caller-supplied label. The current cursor
 * row is highlighted; keyboard navigation is the caller's responsibility
 * (wire `state.focusNext` / `state.focusPrev` into your keymap).
 */
export function Tree<T>(props: TreeProps<T>): JSX.Element {
  const theme = useTheme()
  return (
    <box flexDirection="column">
      <For each={props.state.visible()}>
        {(row, index) => {
          const isCursor = (): boolean => index() === props.state.cursor()
          const chevron = (): string => {
            if (!row.hasChildren) return LEAF
            return row.isExpanded ? CHEVRON_EXPANDED : CHEVRON_COLLAPSED
          }
          return (
            <box flexDirection="row" height={1} backgroundColor={isCursor() ? theme.bgHighlight : undefined}>
              <text fg={theme.dim}>{INDENT.repeat(row.depth)}</text>
              <text fg={row.hasChildren ? theme.accent : theme.faint} attributes={isCursor() ? BOLD : 0}>
                {`${chevron()} `}
              </text>
              {props.render({ row, isCursor: isCursor() })}
            </box>
          )
        }}
      </For>
    </box>
  )
}
