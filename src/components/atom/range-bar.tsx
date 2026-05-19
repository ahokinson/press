import { RANGE_BAR_MARKER, rangeBar } from "@format"
import { useTheme } from "@theme/provider.tsx"
import { createMemo, type JSX } from "solid-js"

export interface RangeBarProps {
  current: number
  low: number
  high: number
  width: number
  /** Override the marker color (default: `theme.accent`). */
  markerColor?: string
  /** Override the track color (default: `theme.dim`). */
  trackColor?: string
}

/**
 * Theme-colored `├──●──┤` positional slider. Renders the marker in `markerColor`
 * (default accent) on a track in `trackColor` (default dim). Pure paint over
 * `rangeBar()` from `@ahokinson/press/format`.
 */
export function RangeBar(props: RangeBarProps): JSX.Element {
  const theme = useTheme()
  const bar = createMemo(() => rangeBar(props.current, props.low, props.high, props.width))
  const marker = () => props.markerColor ?? theme.accent
  const track = () => props.trackColor ?? theme.dim
  const markerIndex = createMemo(() => bar().indexOf(RANGE_BAR_MARKER))

  return (
    <text>
      {(() => {
        const s = bar()
        const i = markerIndex()
        if (i < 0) return <span style={{ fg: track() }}>{s}</span>
        return (
          <>
            <span style={{ fg: track() }}>{s.slice(0, i)}</span>
            <span style={{ fg: marker() }}>{RANGE_BAR_MARKER}</span>
            <span style={{ fg: track() }}>{s.slice(i + 1)}</span>
          </>
        )
      })()}
    </text>
  )
}
