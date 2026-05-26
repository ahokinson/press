import { Pane } from "@components/container/pane.tsx"
import { createScrollboxOptions } from "@components/container/scroll/index.ts"
import { createScrollboxSync } from "@signals"
import type { Dimension, DimensionFixed } from "@terminal/dimension.ts"
import { useTheme } from "@theme/provider.tsx"
import { createEffect, createMemo, For, type JSX, Show } from "solid-js"

export interface ListProps<T> {
  title?: string
  items: () => readonly T[]
  selected: () => number
  focused?: () => boolean
  /** Render a row given the item, its index, and whether it is the active selection. */
  renderItem: (item: T, index: number, selected: boolean) => JSX.Element
  /** Optional empty-state label. */
  emptyLabel?: string
  flexGrow?: number
  flexBasis?: DimensionFixed
  width?: Dimension
  height?: Dimension
}

/**
 * Focusable list with selection highlighting. Keeps the active row inside the
 * viewport via `createScrollboxSync` and the scrollbox's height. Does not
 * bind keys; wire j/k in the caller and update `selected`.
 */
export function List<T>(props: ListProps<T>): JSX.Element {
  const theme = useTheme()
  const items = createMemo(() => props.items())
  const scrollboxOptions = createScrollboxOptions(theme)
  const sync = createScrollboxSync({ cursor: () => props.selected() })

  // Items can change the scrollbox's content extent without firing
  // onSizeChange. Re-read the height when items change to keep viewport
  // tracking in sync.
  createEffect(() => {
    items()
    sync.refresh()
  })

  return (
    <Pane
      title={props.title}
      focused={props.focused}
      flexGrow={props.flexGrow}
      flexBasis={props.flexBasis}
      width={props.width}
      height={props.height}
    >
      <Show when={items().length > 0} fallback={<text fg={theme.faint}>{props.emptyLabel ?? "(empty)"}</text>}>
        <scrollbox flexGrow={1} ref={sync.bindRef} {...scrollboxOptions}>
          <For each={items()}>
            {(item, i) => {
              const isSelected = () => props.selected() === i()
              return (
                <box
                  flexDirection="row"
                  backgroundColor={isSelected() && props.focused?.() ? theme.bgHighlight : undefined}
                >
                  {props.renderItem(item, i(), isSelected())}
                </box>
              )
            }}
          </For>
        </scrollbox>
      </Show>
    </Pane>
  )
}
