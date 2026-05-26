import { highlightSegments } from "@format"
import { BOLD } from "@theme"
import { createMemo, type JSX } from "solid-js"

export interface HighlightProps {
  text: string
  query: string
  fg: string
  matchFg: string
  matchBg?: string
  bold?: boolean
  caseSensitive?: boolean
}

/**
 * Single-line text that highlights occurrences of `query` inside `text`. The
 * caller picks match colors. An empty query renders as plain text.
 */
export function Highlight(props: HighlightProps): JSX.Element {
  const segments = createMemo(() => highlightSegments(props.text, props.query, props.caseSensitive ?? false))
  return (
    <text attributes={props.bold ? BOLD : 0}>
      {segments().map((seg) =>
        seg.match ? (
          <span style={{ fg: props.matchFg, bg: props.matchBg, attributes: BOLD }}>{seg.text}</span>
        ) : (
          <span style={{ fg: props.fg }}>{seg.text}</span>
        ),
      )}
    </text>
  )
}
