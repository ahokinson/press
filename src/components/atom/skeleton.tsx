import { For, type JSX } from "solid-js"

export interface SkeletonProps {
  rows: () => number
  renderRow: (index: number) => JSX.Element
}

/**
 * Repeats `renderRow` N times in a column. Use to paint placeholder rows
 * (typically built from `placeholder()` from `@ahokinson/press/icons`) while
 * data is loading. Caller owns the row layout so column widths line up with
 * the real content.
 */
export function Skeleton(props: SkeletonProps): JSX.Element {
  const indices = () => Array.from({ length: Math.max(0, Math.floor(props.rows())) }, (_, i) => i)
  return (
    <box flexDirection="column">
      <For each={indices()}>{(i) => props.renderRow(i)}</For>
    </box>
  )
}
