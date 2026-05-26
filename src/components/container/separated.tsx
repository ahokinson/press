import { createMemo, For, type JSX } from "solid-js"

export interface SeparatedProps {
  items: () => readonly JSX.Element[]
  separator: JSX.Element | string
}

/**
 * Renders pre-built JSX items with `separator` inserted between each. String
 * separators are wrapped in a `<text>`. JSX separators render fresh per gap.
 */
export function Separated(props: SeparatedProps): JSX.Element {
  const separator = createMemo(() =>
    typeof props.separator === "string" ? <text>{props.separator}</text> : props.separator,
  )
  return (
    <For each={props.items()}>
      {(item, i) => (
        <>
          {i() > 0 && separator()}
          {item}
        </>
      )}
    </For>
  )
}
