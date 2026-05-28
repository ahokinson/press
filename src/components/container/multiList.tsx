import { List } from "@components/container/list.tsx"
import type { Dimension, DimensionFixed } from "@terminal/dimension.ts"
import { useTheme } from "@theme/provider.tsx"
import type { JSX } from "solid-js"

export const CHECKED = "☑"
export const UNCHECKED = "☐"

export interface MultiListProps<T> {
  items: () => readonly T[]
  cursor: () => number
  isSelected: (item: T) => boolean
  title?: string
  focused?: () => boolean
  /**
   * Render a row given the item, its index, an accessor for whether the row is
   * under the cursor, and an accessor for whether it is checked. Matches the
   * parameter order of `List.renderItem` — position 3 is always "cursor active".
   * Use both accessors inside JSX so styling updates reactively.
   *
   * @example
   * renderItem={(item, _i, active, checked) => (
   *   <text color={active() ? "white" : checked() ? "green" : "dim"}>{item.label}</text>
   * )}
   */
  renderItem: (item: T, index: number, cursorActive: () => boolean, checked: () => boolean) => JSX.Element
  emptyMessage?: string
  emptyHint?: string
  /** Override the checked glyph. Default `☑`. Use a Nerd Font glyph if your terminal renders `☑` at the wrong width. */
  checkedChar?: string
  /** Override the unchecked glyph. Default `☐`. */
  uncheckedChar?: string
  flexGrow?: number
  flexBasis?: DimensionFixed
  width?: Dimension
  height?: Dimension
}

/**
 * Scrollable list with cursor navigation and checkbox-style multi-selection.
 * Accepts individual accessors so it works with any cursor and selection
 * source — wire `MultiSelectState`, `FilterableListState` + a separate
 * `ToggleSet`, or bare signals. Key bindings belong in the caller.
 */
export function MultiList<T>(props: MultiListProps<T>): JSX.Element {
  const theme = useTheme()
  return (
    <List
      title={props.title}
      items={props.items}
      cursor={props.cursor}
      focused={props.focused}
      emptyMessage={props.emptyMessage}
      emptyHint={props.emptyHint}
      flexGrow={props.flexGrow}
      flexBasis={props.flexBasis}
      width={props.width}
      height={props.height}
      renderItem={(item, index, active) => {
        const checked = () => props.isSelected(item)
        const on = props.checkedChar ?? CHECKED
        const off = props.uncheckedChar ?? UNCHECKED
        return (
          <>
            <text fg={checked() ? theme.accent : theme.faint}>{`${checked() ? on : off} `}</text>
            {props.renderItem(item, index, active, checked)}
          </>
        )
      }}
    />
  )
}
