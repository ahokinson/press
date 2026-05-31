import { Skeleton } from "@components/atom/skeleton.tsx"
import { padLeft, padRight } from "@format"
import { Icon, placeholder } from "@icons"
import type { SortState } from "@models/table/query.ts"
import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { For, type JSX, Show } from "solid-js"

export type { SortState } from "@models/table/query.ts"

/** Horizontal alignment for a `Column`'s header and skeleton placeholder. */
export enum ColumnAlign {
  Left = "left",
  Right = "right",
}

export interface Column<T> {
  /** Stable identifier for sort/selection lookups. */
  key: string
  /** Header label text. */
  label: string
  /** Column width in terminal columns. Headers + cells are clipped/padded to fit. */
  width: number
  /** Header and skeleton-placeholder alignment. Cell rendering is up to `render`. */
  align?: ColumnAlign
  /** Cell renderer. Receives the row. Returns `<text>` or compatible JSX. */
  render: (row: T, selected: boolean) => JSX.Element
  /** When true, the header participates in sort UI (gets the active accent + ▲/▼ indicator). */
  sortable?: boolean
}

export interface TableProps<T> {
  columns: Column<T>[]
  rows: () => readonly T[]
  /** Reactive predicate: returns true for the currently selected row. */
  selected?: (row: T) => boolean
  /** Reactive accessor for the active sort column + direction. */
  sort?: () => SortState | undefined
  /** Called when the user clicks a sortable header. */
  onHeaderClick?: (key: string) => void
  /** Called when the user clicks a data row. */
  onRowClick?: (row: T) => void
  /**
   * When `rows()` is empty and this is set, paint `loadingRows` skeleton
   * rows built from `placeholder()`.
   */
  loadingRows?: number
}

const SORT_ASC = Icon.triangleUp.char
const SORT_DESC = Icon.triangleDown.char

/**
 * Sortable column-aligned data table. The active sort column's header paints
 * in `theme.accent` bold with a trailing ▲/▼. Other headers render in
 * `theme.textMuted`. The selected row (per `selected()`) gets
 * `theme.backgroundSelection`. When `rows()` is empty and `loadingRows` is set,
 * paints dashed placeholders via `Skeleton`.
 *
 * The caller owns the sort signal, selection signal, and the keymap. Click
 * handlers on headers and rows are optional. Keyboard-only callers need
 * their own sort-cycle binding, since there's no keyboard equivalent for
 * activating a header from a focused row.
 */
export function Table<T>(props: TableProps<T>): JSX.Element {
  const theme = useTheme()
  const activeSort = () => props.sort?.()
  const isLoading = () => props.rows().length === 0 && (props.loadingRows ?? 0) > 0

  const headerText = (column: Column<T>): string => {
    const sort = activeSort()
    const arrow = sort && sort.key === column.key ? ` ${sort.desc ? SORT_DESC : SORT_ASC}` : ""
    const label = `${column.label}${arrow}`
    return column.align === ColumnAlign.Right ? padLeft(label, column.width) : padRight(label, column.width)
  }

  const headerFg = (column: Column<T>): string => {
    const sort = activeSort()
    return sort && sort.key === column.key ? theme.accent : theme.textMuted
  }

  const headerBold = (column: Column<T>): 0 | 1 => {
    const sort = activeSort()
    return sort && sort.key === column.key ? BOLD : 0
  }

  return (
    <box flexDirection="column">
      <box flexDirection="row" height={1}>
        <For each={props.columns}>
          {(column) => (
            // biome-ignore lint/a11y/noStaticElementInteractions: opentui <box> is the sole TUI interaction primitive
            <box
              width={column.width}
              onMouseDown={column.sortable ? () => props.onHeaderClick?.(column.key) : undefined}
            >
              <text fg={headerFg(column)} attributes={headerBold(column)}>
                {headerText(column)}
              </text>
            </box>
          )}
        </For>
      </box>

      <Show
        when={!isLoading()}
        fallback={
          <Skeleton
            rows={() => props.loadingRows ?? 0}
            renderRow={() => (
              <box flexDirection="row" height={1}>
                <For each={props.columns}>
                  {(column) => (
                    <box width={column.width}>
                      <text fg={theme.textFaint}>
                        {column.align === ColumnAlign.Right
                          ? padLeft(placeholder(Math.max(0, column.width - 1)), column.width)
                          : padRight(placeholder(Math.max(0, column.width - 1)), column.width)}
                      </text>
                    </box>
                  )}
                </For>
              </box>
            )}
          />
        }
      >
        <For each={props.rows()}>
          {(row) => {
            const isSelected = () => props.selected?.(row) ?? false
            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: opentui <box> is the sole TUI interaction primitive
              <box
                flexDirection="row"
                height={1}
                backgroundColor={isSelected() ? theme.backgroundSelection : undefined}
                onMouseDown={props.onRowClick ? () => props.onRowClick!(row) : undefined}
              >
                <For each={props.columns}>
                  {(column) => <box width={column.width}>{column.render(row, isSelected())}</box>}
                </For>
              </box>
            )
          }}
        </For>
      </Show>
    </box>
  )
}
