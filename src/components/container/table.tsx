import { Skeleton } from "@components/atom/skeleton.tsx"
import { padLeft, padRight } from "@format"
import { placeholder } from "@icons"
import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { For, type JSX, Show } from "solid-js"

export interface Column<T> {
  /** Stable identifier for sort/selection lookups. */
  key: string
  /** Header label text. */
  label: string
  /** Column width in terminal columns. Headers + cells are clipped/padded to fit. */
  width: number
  /** Header and skeleton-placeholder alignment. Cell rendering is up to `render`. */
  align?: "left" | "right"
  /** Cell renderer. Receives the row; should produce a `<text>` or compatible JSX. */
  render: (row: T, selected: boolean) => JSX.Element
  /** When true, the header participates in sort UI (gets the active accent + ▲/▼ indicator). */
  sortable?: boolean
}

export interface SortState {
  key: string
  desc: boolean
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
   * When `rows()` is empty and this is set, paint `loadingRows` skeleton rows
   * built from `placeholder()` so column widths match the real data layout.
   */
  loadingRows?: number
}

const SORT_ASC = "▲"
const SORT_DESC = "▼"

/**
 * Sortable column-aligned data table. Header row paints the active sort column
 * in `theme.accent` bold with a trailing ▲/▼ glyph; other headers render in
 * `theme.muted`. The selected row (per `selected()`) gets `theme.bgHighlight`.
 * Empty rows + `loadingRows` falls back to dashed placeholders via `Skeleton`.
 *
 * Pure paint: the caller owns the sort signal, selection signal, and the
 * keymap that updates them. Click handlers on headers/rows are optional —
 * because there is no keyboard equivalent for activating a header from a
 * focused row, callers wiring keyboard-only navigation must surface a sort
 * cycle (e.g. an `s` binding that calls `onHeaderClick(nextSortableKey)`).
 */
export function Table<T>(props: TableProps<T>): JSX.Element {
  const theme = useTheme()
  const activeSort = () => props.sort?.()
  const isLoading = () => props.rows().length === 0 && (props.loadingRows ?? 0) > 0

  const headerText = (col: Column<T>): string => {
    const sort = activeSort()
    const arrow = sort && sort.key === col.key ? ` ${sort.desc ? SORT_DESC : SORT_ASC}` : ""
    const label = `${col.label}${arrow}`
    return col.align === "right" ? padLeft(label, col.width) : padRight(label, col.width)
  }

  const headerFg = (col: Column<T>): string => {
    const sort = activeSort()
    return sort && sort.key === col.key ? theme.accent : theme.muted
  }

  const headerBold = (col: Column<T>): 0 | 1 => {
    const sort = activeSort()
    return sort && sort.key === col.key ? BOLD : 0
  }

  return (
    <box flexDirection="column">
      <box flexDirection="row" height={1}>
        <For each={props.columns}>
          {(col) => (
            // biome-ignore lint/a11y/noStaticElementInteractions: opentui <box> is the sole TUI interaction primitive
            <box width={col.width} onMouseDown={col.sortable ? () => props.onHeaderClick?.(col.key) : undefined}>
              <text fg={headerFg(col)} attributes={headerBold(col)}>
                {headerText(col)}
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
                  {(col) => (
                    <box width={col.width}>
                      <text fg={theme.faint}>
                        {col.align === "right"
                          ? padLeft(placeholder(Math.max(0, col.width - 1)), col.width)
                          : padRight(placeholder(Math.max(0, col.width - 1)), col.width)}
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
                backgroundColor={isSelected() ? theme.bgHighlight : undefined}
                onMouseDown={props.onRowClick ? () => props.onRowClick!(row) : undefined}
              >
                <For each={props.columns}>{(col) => <box width={col.width}>{col.render(row, isSelected())}</box>}</For>
              </box>
            )
          }}
        </For>
      </Show>
    </box>
  )
}
