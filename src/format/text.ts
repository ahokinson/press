const segmenter: Intl.Segmenter | null =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null

function codePointWidth(codePoint: number): number {
  if (codePoint < 0x20 || (codePoint >= 0x7f && codePoint < 0xa0)) return 0
  if (codePoint < 0x1100) return 1
  if (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||
    (codePoint >= 0x2e80 && codePoint <= 0x303e) ||
    (codePoint >= 0x3041 && codePoint <= 0x33ff) ||
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0xa000 && codePoint <= 0xa4cf) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe4f) ||
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x1f300 && codePoint <= 0x1f64f) ||
    (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) ||
    (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
    (codePoint >= 0x1fa70 && codePoint <= 0x1faff) ||
    (codePoint >= 0x20000 && codePoint <= 0x2fffd) ||
    (codePoint >= 0x30000 && codePoint <= 0x3fffd)
  ) {
    return 2
  }
  return 1
}

function graphemeWidth(grapheme: string): number {
  const first = grapheme.codePointAt(0)
  return first === undefined ? 0 : codePointWidth(first)
}

function* graphemes(text: string): Generator<string> {
  if (segmenter) {
    for (const { segment } of segmenter.segment(text)) yield segment
    return
  }
  for (const character of text) yield character
}

/**
 * Number of terminal columns `text` occupies. East Asian wide ranges (CJK,
 * fullwidth, most emoji) count as 2. Everything else counts as 1. Combining
 * marks and ZWJ sequences absorb into their base grapheme via Intl.Segmenter
 * when available.
 */
export function columnWidth(text: string): number {
  let total = 0
  for (const grapheme of graphemes(text)) total += graphemeWidth(grapheme)
  return total
}

/** Largest prefix of `text` that fits within `budget` columns. */
function takeColumns(text: string, budget: number): string {
  if (budget <= 0) return ""
  let used = 0
  let result = ""
  for (const grapheme of graphemes(text)) {
    const glyphWidth = graphemeWidth(grapheme)
    if (used + glyphWidth > budget) break
    result += grapheme
    used += glyphWidth
  }
  return result
}

/** Truncate `text` to `width` columns, appending an ellipsis when it overflows. */
export function truncateEnd(text: string, width: number): string {
  if (width <= 0) return ""
  if (columnWidth(text) <= width) return text
  if (width === 1) return "…"
  return `${takeColumns(text, width - 1)}…`
}

/** Basename of `project` truncated to `width` columns. Drops any org/group prefix. */
export function shortProject(project: string, width: number): string {
  const basename = project.split("/").pop() ?? project
  return truncateEnd(basename, width)
}

/** Pad `text` on the right with spaces to `width` columns. Clips when over. */
export function padRight(text: string, width: number): string {
  const textWidth = columnWidth(text)
  if (textWidth === width) return text
  if (textWidth > width) return takeColumns(text, width)
  return text + " ".repeat(width - textWidth)
}

/** Pad `text` on the left with spaces to `width` columns. Clips when over. */
export function padLeft(text: string, width: number): string {
  const textWidth = columnWidth(text)
  if (textWidth === width) return text
  if (textWidth > width) return takeColumns(text, width)
  return " ".repeat(width - textWidth) + text
}

/**
 * Format a number with B/M/K suffix. Sub-thousand values pass through via
 * `String()`. Larger values round to one decimal.
 */
export function compactNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}
