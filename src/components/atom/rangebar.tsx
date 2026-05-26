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
 * Theme-colored `├──●──┤` positional slider. Marker in `markerColor`
 * (default `theme.accent`), track in `trackColor` (default `theme.dim`).
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
        const barString = bar()
        const position = markerIndex()
        if (position < 0) return <span style={{ fg: track() }}>{barString}</span>
        return (
          <>
            <span style={{ fg: track() }}>{barString.slice(0, position)}</span>
            <span style={{ fg: marker() }}>{RANGE_BAR_MARKER}</span>
            <span style={{ fg: track() }}>{barString.slice(position + 1)}</span>
          </>
        )
      })()}
    </text>
  )
}
