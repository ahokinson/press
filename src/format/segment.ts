export interface HighlightSegment {
  text: string
  match: boolean
}

/**
 * Walk `text` and split it into alternating match/non-match runs against
 * `query`. An empty query returns one non-match segment over the whole input.
 */
export function highlightSegments(text: string, query: string, caseSensitive: boolean = false): HighlightSegment[] {
  if (!query) return [{ text, match: false }]
  const needle = caseSensitive ? query : query.toLowerCase()
  const haystack = caseSensitive ? text : text.toLowerCase()
  const segments: HighlightSegment[] = []
  let cursor = 0
  while (cursor < text.length) {
    const matchIndex = haystack.indexOf(needle, cursor)
    if (matchIndex === -1) {
      segments.push({ text: text.slice(cursor), match: false })
      break
    }
    if (matchIndex > cursor) segments.push({ text: text.slice(cursor, matchIndex), match: false })
    segments.push({ text: text.slice(matchIndex, matchIndex + needle.length), match: true })
    cursor = matchIndex + needle.length
  }
  return segments
}
