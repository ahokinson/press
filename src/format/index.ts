/**
 * Compact relative age (e.g. "12m", "3h", "5d") from an ISO timestamp. Returns
 * the `fallback` (default "-") when the input cannot be parsed.
 */
export function relativeAge(iso: string, now: number = Date.now(), fallback: string = "-"): string {
  const ms = now - Date.parse(iso)
  return relativeAgeMs(ms, fallback)
}

/**
 * Compact age from a millisecond delta. Adds second granularity below the
 * minute mark for polling/tick displays:
 *   relativeAgeMs(0)          → "0s"
 *   relativeAgeMs(45_000)     → "45s"
 *   relativeAgeMs(180_000)    → "3m"
 * Negative deltas clamp to 0; NaN/Infinity returns `fallback`.
 */
export function relativeAgeMs(deltaMs: number, fallback: string = "-"): string {
  if (!Number.isFinite(deltaMs)) return fallback
  const ms = Math.max(0, deltaMs)
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s`
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

/** Local-time clock string, zero-padded `HH:MM:SS`. */
export function formatClock(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const segmenter: Intl.Segmenter | null =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null

function codePointWidth(cp: number): number {
  if (cp < 0x20 || (cp >= 0x7f && cp < 0xa0)) return 0
  if (cp < 0x1100) return 1
  if (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0x303e) ||
    (cp >= 0x3041 && cp <= 0x33ff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xa000 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe4f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1f64f) ||
    (cp >= 0x1f680 && cp <= 0x1f6ff) ||
    (cp >= 0x1f900 && cp <= 0x1f9ff) ||
    (cp >= 0x1fa70 && cp <= 0x1faff) ||
    (cp >= 0x20000 && cp <= 0x2fffd) ||
    (cp >= 0x30000 && cp <= 0x3fffd)
  ) {
    return 2
  }
  return 1
}

function graphemeWidth(grapheme: string): number {
  const first = grapheme.codePointAt(0)
  return first === undefined ? 0 : codePointWidth(first)
}

function* graphemes(s: string): Generator<string> {
  if (segmenter) {
    for (const { segment } of segmenter.segment(s)) yield segment
    return
  }
  for (const ch of s) yield ch
}

/**
 * Number of terminal columns `s` occupies. Treats East Asian wide ranges
 * (CJK, fullwidth, most emoji) as 2 and everything else as 1. Combining marks
 * and ZWJ sequences are absorbed into their base grapheme via Intl.Segmenter
 * when available.
 */
export function columnWidth(s: string): number {
  let total = 0
  for (const g of graphemes(s)) total += graphemeWidth(g)
  return total
}

/** Truncate `s` to `width` columns, appending an ellipsis when it overflows. */
export function truncateEnd(s: string, width: number): string {
  if (width <= 0) return ""
  if (columnWidth(s) <= width) return s
  if (width === 1) return "…"
  const budget = width - 1
  let used = 0
  let out = ""
  for (const g of graphemes(s)) {
    const w = graphemeWidth(g)
    if (used + w > budget) break
    out += g
    used += w
  }
  return `${out}…`
}

/**
 * Return the basename (last slash-delimited segment) of a path, suffix-truncated
 * to fit `width` columns. Drops the org/group prefix.
 */
export function shortProject(project: string, width: number): string {
  const basename = project.split("/").pop() ?? project
  return truncateEnd(basename, width)
}

/** Single-glyph constants for `rangeBar`. Re-exported so renderers can locate the marker. */
export const RANGE_BAR_MARKER = "●"
export const RANGE_BAR_TRACK = "─"
export const RANGE_BAR_LEFT_CAP = "├"
export const RANGE_BAR_RIGHT_CAP = "┤"

/**
 * Render a positional slider as a single line: `├──●──┤`. `current` is clamped
 * to `[low, high]` for placement; out-of-range inputs land at the edges. When
 * `high === low`, returns a flat track of dashes.
 *
 * `width` is in terminal columns; the marker (`RANGE_BAR_MARKER`) replaces one
 * cell of the track. Pair with the `RangeBar` component for theme-colored
 * rendering.
 */
export function rangeBar(current: number, low: number, high: number, width: number): string {
  if (width <= 0) return ""
  if (high === low) return RANGE_BAR_TRACK.repeat(width)
  const ratio = Math.max(0, Math.min(1, (current - low) / (high - low)))
  const pos = Math.round(ratio * (width - 1))
  const cells: string[] = new Array(width)
  for (let i = 0; i < width; i++) {
    if (i === pos) cells[i] = RANGE_BAR_MARKER
    else if (i === 0) cells[i] = RANGE_BAR_LEFT_CAP
    else if (i === width - 1) cells[i] = RANGE_BAR_RIGHT_CAP
    else cells[i] = RANGE_BAR_TRACK
  }
  return cells.join("")
}

/**
 * Format a number with B/M/K suffix for compact display. Sub-thousand values
 * pass through via `String()`; rounding for ≥1000 is one decimal place.
 */
export function compactNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

/**
 * Slice `s` to at most `width` columns, dropping graphemes that would not fit.
 * Unlike `truncateEnd`, no ellipsis is appended.
 */
function clipColumns(s: string, width: number): string {
  if (width <= 0) return ""
  let used = 0
  let out = ""
  for (const g of graphemes(s)) {
    const w = graphemeWidth(g)
    if (used + w > width) break
    out += g
    used += w
  }
  return out
}

/** Pad `text` on the right with spaces to fill `width` columns; clip when over. */
export function padRight(text: string, width: number): string {
  const w = columnWidth(text)
  if (w === width) return text
  if (w > width) return clipColumns(text, width)
  return text + " ".repeat(width - w)
}

/** Pad `text` on the left with spaces to fill `width` columns; clip when over. */
export function padLeft(text: string, width: number): string {
  const w = columnWidth(text)
  if (w === width) return text
  if (w > width) return clipColumns(text, width)
  return " ".repeat(width - w) + text
}

export interface HighlightSegment {
  text: string
  match: boolean
}

/**
 * Walk `text` and split it into alternating match/non-match runs against
 * `query`. Empty query → single non-match segment covering the whole input.
 * Used by the `Highlight` component but exported so callers can reuse the
 * segmentation for custom rendering.
 */
export function highlightSegments(text: string, query: string, caseSensitive: boolean = false): HighlightSegment[] {
  if (!query) return [{ text, match: false }]
  const needle = caseSensitive ? query : query.toLowerCase()
  const haystack = caseSensitive ? text : text.toLowerCase()
  const out: HighlightSegment[] = []
  let cursor = 0
  while (cursor < text.length) {
    const idx = haystack.indexOf(needle, cursor)
    if (idx === -1) {
      out.push({ text: text.slice(cursor), match: false })
      break
    }
    if (idx > cursor) out.push({ text: text.slice(cursor, idx), match: false })
    out.push({ text: text.slice(idx, idx + needle.length), match: true })
    cursor = idx + needle.length
  }
  return out
}

/**
 * Split a progress run into filled and unfilled character strings.
 *
 * - `max <= 0` is treated as "indeterminate complete" and paints fully filled,
 *   matching the convention that a run of unknown length completes when its
 *   bar is closed.
 * - Ratios outside [0, 1] are clamped.
 * - `filledChar` and `unfilledChar` are assumed to be a single column wide;
 *   wider glyphs will overflow the requested `width`.
 *
 * Pure string math — pair with the `Progress` component or render the parts
 * yourself.
 */
export function progressParts(
  value: number,
  max: number,
  width: number,
  filledChar: string = "█",
  unfilledChar: string = "░",
): { filled: string; unfilled: string } {
  const w = Math.max(1, Math.floor(width))
  if (max <= 0) return { filled: filledChar.repeat(w), unfilled: "" }
  const ratio = Math.min(1, Math.max(0, value / max))
  const filled = Math.min(w, Math.round(ratio * w))
  return { filled: filledChar.repeat(filled), unfilled: unfilledChar.repeat(w - filled) }
}
