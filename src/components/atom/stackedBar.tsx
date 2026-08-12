import { stackedCells } from "@format"
import { Icon } from "@icons"
import { useTheme } from "@theme/provider.tsx"
import { For, type JSX, Show } from "solid-js"

/** One band of a `StackedBar`: a magnitude and the color to paint its cells. */
export interface BarSegment {
  value: number
  color: string
}

export interface StackedBarProps {
  /** The bands, in draw order (left→right). Cells are apportioned by each band's share of the total. */
  segments: () => readonly BarSegment[]
  /** Total cells. Default 24. */
  width?: number
  /** Filled-cell glyph. Default `█`. */
  char?: string
  /** Minimum cells for a non-zero band, so a small slice never rounds away. Default 1. */
  minCell?: number
  /** Track glyph painted when every band is zero (empty state). Omit to render nothing. */
  emptyChar?: string
  /** Track color for the empty state. Default `theme.textFaint`. */
  emptyColor?: string
}

/**
 * A single-row stacked proportion bar: each segment occupies a share of `width` cells sized by its
 * value, so a distribution reads as a shape rather than a row of equal-weight numbers. Apportioning
 * (with a per-segment minimum) lives in `stackedCells`; this just paints one colored span per band.
 */
export function StackedBar(props: StackedBarProps): JSX.Element {
  const theme = useTheme()
  const width = () => Math.max(0, props.width ?? 24)
  const char = () => props.char ?? Icon.blockFilled.char
  const cells = () =>
    stackedCells(
      props.segments().map((segment) => segment.value),
      width(),
      props.minCell ?? 1,
    )
  const isEmpty = () => cells().every((n) => n === 0)

  return (
    <text flexShrink={0}>
      <Show
        when={!isEmpty()}
        fallback={
          <Show when={props.emptyChar}>
            <span style={{ fg: props.emptyColor ?? theme.textFaint }}>{props.emptyChar!.repeat(width())}</span>
          </Show>
        }
      >
        <For each={props.segments()}>
          {(segment, i) => (
            <Show when={cells()[i()]! > 0}>
              <span style={{ fg: segment.color }}>{char().repeat(cells()[i()]!)}</span>
            </Show>
          )}
        </For>
      </Show>
    </text>
  )
}
