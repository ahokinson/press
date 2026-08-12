import { Empty } from "@components/atom/empty.tsx"
import { Skeleton } from "@components/atom/skeleton.tsx"
import { createScrollboxOptions } from "@components/container/scroll/index.ts"
import { Section } from "@components/container/section.tsx"
import type { SectionKey } from "@models/cursor/filterable.ts"
import { createScrollboxSync, type ScrollRef } from "@signals"
import { useTheme } from "@theme/provider.tsx"
import { createEffect, createMemo, For, type JSX, Show } from "solid-js"

/**
 * Snapshot of one section's rendered slice. Treat as immutable. `<Sections>`
 * reacts to identity changes on the array returned by `props.sections()`. A
 * `SectionEntry` whose `collapsed` flag is flipped in place will not
 * re-render; always rebuild via `groupBySection` on state change.
 */
export interface SectionEntry<T, K extends SectionKey> {
  id: K
  label?: string | null
  count: number
  items: readonly T[]
  collapsed: boolean
  /** Index of this section's first item in the overall visible list (matches `cursor`). */
  startIndex: number
}

export interface SectionsProps<T, K extends SectionKey> {
  sections: () => ReadonlyArray<SectionEntry<T, K>>
  cursor: () => number
  /** Scroll-ref handle so the list can sync to the active cursor row. */
  setScrollRef?: (ref: ScrollRef | null) => void
  renderItem: (item: T, globalIndex: number, selected: boolean) => JSX.Element
  /**
   * Override the section header. Default uses press's `Section` component
   * when `label` is non-null. Return `null` to skip the header for an entry.
   */
  renderSectionHeader?: (entry: SectionEntry<T, K>) => JSX.Element
  /**
   * Whether the list owns focus. When it returns false the selection highlight
   * is suppressed (the cursor row still reports `selected` to `renderItem`).
   * Defaults to always-focused, preserving the highlight for callers that
   * don't track focus. Mirrors `<List>`'s `focused`.
   */
  focused?: () => boolean
  /** Background for the selected row. Defaults to `theme.backgroundSelection`. */
  selectedBg?: string
  /**
   * Per-row background override. Receives the row's global index and whether it is the (focused)
   * selected row; return `undefined` for no fill. When set it fully replaces the default
   * selected-row background, so the caller owns both striping (zebra) and the selection color.
   */
  rowBackground?: (globalIndex: number, selected: boolean) => string | undefined
  /** Rows of context kept above/below the cursor before the list scrolls. Default 1. */
  contextRows?: number
  /** Rendered when `sections()` is empty or has zero total items. */
  emptyState?: JSX.Element
  /** Shown in place of the scrollbox while truthy (e.g., before first data arrives). */
  loading?: () => boolean
  skeleton?: { rows: () => number; renderRow: (i: number) => JSX.Element }
  /** Render a one-row spacer between adjacent sections. Default: true. */
  spacerBetweenSections?: boolean
}

/**
 * Collapsible-sections scrollbox. Consumes a precomputed `sections` accessor
 * and renders one row per item plus an optional header per section.
 *
 * Keeps the active row inside the viewport itself: it knows its own layout
 * (a one-row header per labeled section, optional inter-section spacers), so it
 * maps `cursor` to a visual Y and drives scroll internally — no caller-side
 * offset math. Assumes single-line items and one-row headers. `setScrollRef`
 * still exposes the raw scrollbox for callers that need it; don't scroll it
 * separately. Doesn't bind keys — the caller drives `cursor`.
 */
export function Sections<T, K extends SectionKey>(props: SectionsProps<T, K>): JSX.Element {
  const theme = useTheme()
  const scrollboxOptions = createScrollboxOptions(theme)
  const spacer = () => props.spacerBetweenSections ?? true
  const focused = () => props.focused?.() ?? true
  const selectedBg = () => props.selectedBg ?? theme.backgroundSelection

  const totalItems = createMemo(() => {
    let n = 0
    for (const section of props.sections()) n += section.items.length
    return n
  })

  // Visual Y of the cursor row: sum each preceding section's header (one row
  // when labeled) + inter-section spacer + its visible item count.
  const cursorY = (): number => {
    const secs = props.sections()
    const cur = props.cursor()
    let y = 0
    for (let idx = 0; idx < secs.length; idx++) {
      const entry = secs[idx]!
      if (idx > 0 && spacer()) y += 1
      if (entry.label != null) y += 1
      const len = entry.collapsed ? 0 : entry.items.length
      if (cur >= entry.startIndex && cur < entry.startIndex + len) return y + (cur - entry.startIndex)
      y += len
    }
    return y
  }

  const sync = createScrollboxSync({ cursor: cursorY, contextRows: props.contextRows })
  const bindScroll = (element: unknown): void => {
    sync.bindRef(element)
    props.setScrollRef?.(element as ScrollRef | null)
  }
  // Item/section changes can alter content extent without firing onSizeChange.
  createEffect(() => {
    totalItems()
    sync.refresh()
  })

  const defaultHeader = (entry: SectionEntry<T, K>) =>
    entry.label ? <Section label={entry.label} count={entry.count} collapsed={() => entry.collapsed} /> : null

  return (
    <Show
      when={!props.loading?.()}
      fallback={
        <Show when={props.skeleton}>
          {(skeleton: () => NonNullable<SectionsProps<T, K>["skeleton"]>) => (
            <Skeleton rows={skeleton().rows} renderRow={skeleton().renderRow} />
          )}
        </Show>
      }
    >
      <Show when={totalItems() > 0} fallback={props.emptyState ?? <Empty message="No items" />}>
        <scrollbox flexGrow={1} ref={bindScroll} {...scrollboxOptions}>
          <box flexDirection="column">
            <For each={props.sections()}>
              {(entry, sectionIndex) => (
                <>
                  <Show when={sectionIndex() > 0 && spacer()}>
                    <text height={1}> </text>
                  </Show>
                  {(props.renderSectionHeader ?? defaultHeader)(entry)}
                  <Show when={!entry.collapsed}>
                    <For each={entry.items}>
                      {(item, localIndex) => {
                        const globalIndex = createMemo(() => entry.startIndex + localIndex())
                        const selected = createMemo(() => globalIndex() === props.cursor())
                        const rowBg = createMemo(() => {
                          const isSelected = selected() && focused()
                          return props.rowBackground
                            ? props.rowBackground(globalIndex(), isSelected)
                            : isSelected
                              ? selectedBg()
                              : undefined
                        })
                        return (
                          <box flexDirection="row" backgroundColor={rowBg()}>
                            {props.renderItem(item, globalIndex(), selected())}
                          </box>
                        )
                      }}
                    </For>
                  </Show>
                </>
              )}
            </For>
          </box>
        </scrollbox>
      </Show>
    </Show>
  )
}

export interface GroupBySectionConfig<T, K extends SectionKey> {
  items: readonly T[]
  /** All items: filter-results, NOT collapse-results. Used to compute per-section counts. */
  allItems?: readonly T[]
  sectionKey: (item: T) => K
  collapsedSections: ReadonlySet<K>
  sectionOrder?: (a: K, b: K) => number
  sectionLabel?: (key: K, count: number) => string | null
}

/**
 * Slice an item list into `SectionEntry` records for `<Sections>`. The input
 * `items` must already be sorted so that items sharing a section key are
 * contiguous (`createFilterableListState` arranges this).
 *
 * `startIndex` is computed against the visible (post-collapse) list so it
 * lines up with the cursor from `createFilterableListState`.
 *
 * Pass `allItems` (pre-collapse) for section counts to reflect the total per
 * section instead of just the visible items.
 */
export function groupBySection<T, K extends SectionKey>(config: GroupBySectionConfig<T, K>): SectionEntry<T, K>[] {
  const counts = new Map<K, number>()
  for (const item of config.allItems ?? config.items) {
    const key = config.sectionKey(item)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const order: K[] = []
  const buckets = new Map<K, T[]>()
  for (const item of config.items) {
    const key = config.sectionKey(item)
    if (!buckets.has(key)) {
      buckets.set(key, [])
      order.push(key)
    }
    buckets.get(key)!.push(item)
  }
  // Sections that filter down to zero visible items but still exist in
  // `allItems` don't appear in `order`. A fully-collapsed section still
  // emits a header (the user collapsed it). A section with zero items after
  // filtering disappears entirely.
  if (config.sectionOrder) order.sort(config.sectionOrder)

  const entries: SectionEntry<T, K>[] = []
  let visibleIndex = 0
  for (const key of order) {
    const collapsed = config.collapsedSections.has(key)
    const items = collapsed ? [] : (buckets.get(key) ?? [])
    const count = counts.get(key) ?? items.length
    const label = config.sectionLabel ? config.sectionLabel(key, count) : null
    entries.push({ id: key, label, count, items, collapsed, startIndex: visibleIndex })
    visibleIndex += items.length
  }
  return entries
}
