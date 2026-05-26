import { columnWidth } from "@format/text.ts"
import { type Inline, InlineKind } from "@markdown/parse.ts"

function spanText(span: Inline): string {
  return span.kind === InlineKind.Link ? span.label : span.text
}

function withText(span: Inline, text: string): Inline {
  switch (span.kind) {
    case InlineKind.Link:
      return { kind: InlineKind.Link, label: text, url: span.url }
    case InlineKind.Text:
      return { kind: InlineKind.Text, text }
    case InlineKind.Code:
      return { kind: InlineKind.Code, text }
    case InlineKind.Bold:
      return { kind: InlineKind.Bold, text }
    case InlineKind.Italic:
      return { kind: InlineKind.Italic, text }
  }
}

/**
 * Word-wrap a sequence of inline spans into multiple visual lines, preserving
 * the inline kind on each word. Splits on runs of whitespace. Leading
 * whitespace on a wrapped line is discarded. A word wider than `width`
 * overflows on its own line; the renderer lets the terminal clip rather than
 * break the word.
 *
 * Always returns at least one line.
 */
export function wrapInline(spans: readonly Inline[], width: number): Inline[][] {
  const lines: Inline[][] = []
  let current: Inline[] = []
  let currentWidth = 0

  const flush = (): void => {
    lines.push(current)
    current = []
    currentWidth = 0
  }

  for (const span of spans) {
    const text = spanText(span)
    const runs = text.split(/(\s+)/)
    for (const run of runs) {
      if (run === "") continue
      const isSpace = /^\s+$/.test(run)
      const runWidth = columnWidth(run)
      if (isSpace) {
        if (current.length === 0) continue
        if (width > 0 && currentWidth + runWidth > width) {
          flush()
          continue
        }
        current.push(withText(span, run))
        currentWidth += runWidth
      } else {
        if (width > 0 && currentWidth > 0 && currentWidth + runWidth > width) {
          flush()
        }
        current.push(withText(span, run))
        currentWidth += runWidth
      }
    }
  }
  flush()
  return lines
}

/** Plain word-wrap for plain-text bodies. */
export function wrapToWidth(text: string, width: number): string[] {
  return wrapInline([{ kind: InlineKind.Text, text }], width).map((line) =>
    line.map((span) => (span.kind === InlineKind.Link ? span.label : span.text)).join(""),
  )
}
