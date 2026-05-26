import { For, type JSX } from "solid-js"

export interface SkeletonProps {
  rows: () => number
  renderRow: (index: number) => JSX.Element
}

/**
 * Repeats `renderRow` N times in a column. Paint placeholder rows while data
 * loads. The caller owns the row layout.
 */
export function Skeleton(props: SkeletonProps): JSX.Element {
  const indices = () => Array.from({ length: Math.max(0, Math.floor(props.rows())) }, (_, index) => index)
  return (
    <box flexDirection="column">
      <For each={indices()}>{(index) => props.renderRow(index)}</For>
    </box>
  )
}
