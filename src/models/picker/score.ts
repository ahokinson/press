import type { Pickable } from "@models/picker/state.ts"

export const MATCH_LABEL_PREFIX = 100
export const MATCH_LABEL_INFIX = 50
export const MATCH_LABEL_WORD_BOUNDARY = 5
export const MATCH_KEYWORD_PREFIX = 20
export const MATCH_KEYWORD_OR_GROUP = 10
export const SCORE_EMPTY_QUERY = 1

/**
 * Substring scorer over a `Pickable`. Returns 0 when the query has no
 * substring match anywhere in `label`, `keywords`, or `group`. Otherwise
 * returns a positive score whose components are documented as `MATCH_*`
 * constants.
 *
 * The bucket structure is "higher beats lower". A label prefix returns
 * `MATCH_LABEL_PREFIX` on its own, not stacked with `MATCH_LABEL_INFIX`.
 * Only the word-boundary bonus stacks onto a label-infix match.
 *
 * Empty query returns `SCORE_EMPTY_QUERY` (= 1) for every item, preserving
 * declaration order when nothing is filtered.
 *
 * v1 is substring-only. Subsequence and fuzzy matching are out of scope.
 */
export function scorePickable(item: Pickable, query: string): number {
  if (query.length === 0) return SCORE_EMPTY_QUERY

  const needle = query.toLowerCase()
  const label = item.label.toLowerCase()

  const labelIndex = label.indexOf(needle)
  if (labelIndex === 0) {
    return MATCH_LABEL_PREFIX
  }
  if (labelIndex > 0) {
    let score = MATCH_LABEL_INFIX
    if (label[labelIndex - 1] === " ") score += MATCH_LABEL_WORD_BOUNDARY
    return score
  }

  const keywords = item.keywords ?? []
  for (const keyword of keywords) {
    if (keyword.toLowerCase().startsWith(needle)) {
      return MATCH_KEYWORD_PREFIX
    }
  }
  for (const keyword of keywords) {
    if (keyword.toLowerCase().includes(needle)) {
      return MATCH_KEYWORD_OR_GROUP
    }
  }

  const group = item.group?.toLowerCase() ?? ""
  if (group.length > 0 && group.includes(needle)) {
    return MATCH_KEYWORD_OR_GROUP
  }

  return 0
}
