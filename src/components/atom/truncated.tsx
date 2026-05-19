import { useTheme } from "@theme/provider.tsx"
import { For, type JSX, Show } from "solid-js"

export interface TruncatedProps<T> {
  items: () => readonly T[]
  max: number
  renderItem: (item: T, index: number) => JSX.Element
  renderMore?: (remaining: number) => JSX.Element | string
  moreIndent?: number
}

/**
 * Renders the first `max` items and, when more remain, an overflow row
 * (default: dim "+N more"). Pure paint — slicing happens here so the caller
 * doesn't have to memoize it.
 */
export function Truncated<T>(props: TruncatedProps<T>): JSX.Element {
  const theme = useTheme()
  const visible = () => props.items().slice(0, props.max)
  const remaining = () => Math.max(0, props.items().length - props.max)

  const renderOverflow = (n: number): JSX.Element => {
    const out = props.renderMore?.(n)
    if (out === undefined) return <text fg={theme.dim}>{`+${n} more`}</text>
    if (typeof out === "string") return <text fg={theme.dim}>{out}</text>
    return out
  }

  return (
    <box flexDirection="column">
      <For each={visible()}>{(item, i) => props.renderItem(item, i())}</For>
      <Show when={remaining() > 0}>
        <box flexDirection="row" height={1} paddingLeft={props.moreIndent ?? 0}>
          {renderOverflow(remaining())}
        </box>
      </Show>
    </box>
  )
}
