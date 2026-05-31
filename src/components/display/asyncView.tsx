import { Empty } from "@components/atom/empty.tsx"
import { Skeleton } from "@components/atom/skeleton.tsx"
import { Callout } from "@components/feedback/callout.tsx"
import { Icon } from "@icons"
import type { DataLoaderState } from "@models/loader/index.ts"
import { Severity } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type JSX, Match, Show, Switch } from "solid-js"

export interface AsyncViewProps<T> {
  state: DataLoaderState<T>
  children: (data: NonNullable<T>) => JSX.Element
  /** Rows to show while loading. Default 5. */
  skeletonRows?: number
  /** Custom skeleton row renderer. Default: faint dashes. */
  renderSkeleton?: (index: number) => JSX.Element
  emptyMessage?: string
  emptyHint?: string
  /**
   * Override the empty-state check. By default, `AsyncView` treats an empty
   * array as empty. Provide this for non-array `T` where you want to show the
   * empty state for other conditions (e.g. `(data) => Object.keys(data).length === 0`).
   * `data` is guaranteed non-nullish when this is called.
   */
  isEmpty?: (data: NonNullable<T>) => boolean
  /**
   * Rendered above `children` while a background refresh is in flight
   * (`status === "refreshing"`). A small `Spinner` is recommended. Not shown
   * during the initial `loading` state (the skeleton covers that).
   */
  refreshIndicator?: JSX.Element
  /**
   * Format the thrown value for display. Defaults to `err.message` for `Error`
   * instances and `String(err)` otherwise.
   */
  formatError?: (err: unknown) => string
}

/**
 * Renders a `DataLoaderState` with automatic state-based UI:
 * - `idle | loading` → skeleton rows
 * - `error` → error callout
 * - `success` with empty data → Empty message
 * - `success | refreshing` with data → `children(data)`
 *
 * During `refreshing`, stale data remains visible so the UI does not flash.
 * The empty check runs `props.isEmpty` when provided, otherwise treats an
 * empty array as empty. Non-array data is never considered empty by default.
 */
export function AsyncView<T>(props: AsyncViewProps<T>): JSX.Element {
  const theme = useTheme()
  const status = () => props.state.status()
  const data = () => props.state.data()

  const isLoaded = () => status() === "success" || status() === "refreshing"

  const isEmpty = () => {
    if (!isLoaded()) return false
    const d = data()
    if (d === undefined || d === null) return false
    if (props.isEmpty) return props.isEmpty(d as NonNullable<T>)
    return Array.isArray(d) && d.length === 0
  }

  const hasData = () => isLoaded() && !isEmpty() && data() !== undefined

  const errorMessage = () => {
    const err = props.state.error()
    if (props.formatError) return props.formatError(err)
    return err instanceof Error ? err.message : String(err)
  }

  const defaultSkeleton = (i: number): JSX.Element => <text fg={theme.textDim}>{Icon.lineHorizontal.char.repeat(8 + (i % 4) * 4)}</text>

  // Note: there is no explicit Match for "refreshing". During a refresh,
  // isEmpty() and hasData() both include "refreshing" so stale data stays
  // visible. Do not add a refreshing branch — it would blank the UI.
  return (
    <Switch>
      <Match when={status() === "idle" || status() === "loading"}>
        <Skeleton rows={() => props.skeletonRows ?? 5} renderRow={props.renderSkeleton ?? defaultSkeleton} />
      </Match>
      <Match when={status() === "error"}>
        <Callout variant="rail" severity={Severity.Error}>
          {errorMessage()}
        </Callout>
      </Match>
      <Match when={isEmpty()}>
        <Empty message={props.emptyMessage ?? "No results"} hint={props.emptyHint} />
      </Match>
      <Match when={hasData()}>
        <Show when={status() === "refreshing" && props.refreshIndicator !== undefined}>{props.refreshIndicator}</Show>
        {props.children(data() as NonNullable<T>)}
      </Match>
    </Switch>
  )
}
