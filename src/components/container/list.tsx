import { Empty } from "@components/atom/empty.tsx"
import { Box } from "@components/container/box.tsx"
import { createScrollboxOptions } from "@components/container/scroll/index.ts"
import { createScrollboxSync } from "@signals"
import type { Dimension, DimensionFixed } from "@terminal/dimension.ts"
import { useTheme } from "@theme/provider.tsx"
import { createEffect, createMemo, For, type JSX, Show } from "solid-js"

export interface ListProps<T> {
  title?: string
  items: () => readonly T[]
  cursor: () => number
  focused?: () => boolean
  /**
   * Render a row given the item, its index, and an accessor for whether this
   * row is under the cursor. Pass `active` as an accessor (not a value) into
   * JSX so cursor-driven styling updates reactively when the cursor moves.
   *
   * @example
   * renderItem={(item, _i, active) => <text bold={active()}>{item.name}</text>}
   */
  renderItem: (item: T, index: number, active: () => boolean) => JSX.Element
  /** Primary message shown when the list is empty. */
  emptyMessage?: string
  /** Optional secondary hint shown below the empty message. */
  emptyHint?: string
  flexGrow?: number
  flexBasis?: DimensionFixed
  width?: Dimension
  height?: Dimension
}

/**
 * Focusable list with selection highlighting. Keeps the active row inside the
 * viewport via `createScrollboxSync` and the scrollbox's height. Does not
 * bind keys; wire j/k in the caller and update `cursor`.
 *
 * Rows must be single-line. Multi-line `renderItem` output breaks scroll sync
 * because the cursor is mapped to a row index, not a Y offset. For
 * variable-height rows use `cumulativeOffsets` and wire scroll sync manually.
 */
export function List<T>(props: ListProps<T>): JSX.Element {
  const theme = useTheme()
  // Memo so the createEffect below reads a single stable accessor instead of
  // calling props.items() twice (once in the effect, once in <For>).
  const items = createMemo(() => props.items())
  const scrollboxOptions = createScrollboxOptions(theme)
  const sync = createScrollboxSync({ cursor: () => props.cursor() })

  // Items can change the scrollbox's content extent without firing
  // onSizeChange. Re-read the height when items change to keep viewport
  // tracking in sync.
  createEffect(() => {
    items()
    sync.refresh()
  })

  return (
    <Box
      title={props.title}
      focused={props.focused}
      flexGrow={props.flexGrow}
      flexBasis={props.flexBasis}
      width={props.width}
      height={props.height}
    >
      <Show
        when={items().length > 0}
        fallback={<Empty message={props.emptyMessage ?? "No items"} hint={props.emptyHint} />}
      >
        <scrollbox flexGrow={1} ref={sync.bindRef} {...scrollboxOptions}>
          <For each={items()}>
            {(item, i) => {
              const isActive = createMemo(() => props.cursor() === i())
              return (
                <box
                  flexDirection="row"
                  backgroundColor={isActive() && props.focused?.() ? theme.backgroundSelection : undefined}
                >
                  {props.renderItem(item, i(), isActive)}
                </box>
              )
            }}
          </For>
        </scrollbox>
      </Show>
    </Box>
  )
}
