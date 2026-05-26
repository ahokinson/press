/**
 * Sentinel for opentui's `"auto"` dimension.
 *
 *   <Pane width={AUTO}>…</Pane>
 *   <Modal width="80%" height={AUTO}>…</Modal>
 */
export const AUTO = "auto"
export type Auto = typeof AUTO

/**
 * The shape opentui accepts for `width` / `height` / `flexBasis` and similar
 * layout dimensions. Mirrors opentui's inline type.
 */
export type Dimension = number | `${number}%` | Auto

/** Subset that excludes the percentage form (e.g. `flexBasis` in press). */
export type DimensionFixed = number | Auto
