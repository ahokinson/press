import type { JSX } from "solid-js"

/**
 * A flex filler that pushes following siblings to the far edge of a row (or column). Also holds a
 * row open at height 1 — a row of only auto-width `<text>` nodes otherwise collapses in opentui.
 * Distinct from `Strip` (a fixed height-1 bar): `Spacer` takes up slack, `Strip` is a container.
 */
export function Spacer(): JSX.Element {
  return <text flexGrow={1}> </text>
}
