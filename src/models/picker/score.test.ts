import { describe, expect, test } from "bun:test"
import {
  MATCH_KEYWORD_OR_GROUP,
  MATCH_KEYWORD_PREFIX,
  MATCH_LABEL_INFIX,
  MATCH_LABEL_PREFIX,
  MATCH_LABEL_WORD_BOUNDARY,
  SCORE_EMPTY_QUERY,
  scorePickable,
} from "@models/picker/score.ts"
import type { Pickable } from "@models/picker/state.ts"

function pick(overrides: Partial<Pickable> & { label: string }): Pickable {
  return { id: overrides.label, ...overrides }
}

describe("scorePickable", () => {
  test("empty query → SCORE_EMPTY_QUERY for every item", () => {
    expect(scorePickable(pick({ label: "anything" }), "")).toBe(SCORE_EMPTY_QUERY)
  })

  test("label prefix match wins MATCH_LABEL_PREFIX", () => {
    expect(scorePickable(pick({ label: "save" }), "save")).toBe(MATCH_LABEL_PREFIX)
    expect(scorePickable(pick({ label: "Save All" }), "save")).toBe(MATCH_LABEL_PREFIX)
  })

  test("label infix match (not at word boundary) wins MATCH_LABEL_INFIX", () => {
    expect(scorePickable(pick({ label: "unsaved" }), "save")).toBe(MATCH_LABEL_INFIX)
  })

  test("label infix at a word boundary stacks the word-boundary bonus", () => {
    expect(scorePickable(pick({ label: "auto save" }), "save")).toBe(MATCH_LABEL_INFIX + MATCH_LABEL_WORD_BOUNDARY)
  })

  test("matching is case-insensitive on both sides", () => {
    expect(scorePickable(pick({ label: "SAVE" }), "save")).toBe(MATCH_LABEL_PREFIX)
    expect(scorePickable(pick({ label: "save" }), "SAVE")).toBe(MATCH_LABEL_PREFIX)
  })

  test("keyword prefix match wins MATCH_KEYWORD_PREFIX when label does not match", () => {
    expect(scorePickable(pick({ label: "Persist file", keywords: ["save", "store"] }), "save")).toBe(
      MATCH_KEYWORD_PREFIX,
    )
  })

  test("keyword infix-only match wins MATCH_KEYWORD_OR_GROUP", () => {
    expect(scorePickable(pick({ label: "Persist file", keywords: ["unsaved"] }), "save")).toBe(MATCH_KEYWORD_OR_GROUP)
  })

  test("group-only match wins MATCH_KEYWORD_OR_GROUP when nothing else matches", () => {
    expect(scorePickable(pick({ label: "Persist file", group: "Save commands" }), "save")).toBe(MATCH_KEYWORD_OR_GROUP)
  })

  test("returns 0 when the query has no substring match anywhere", () => {
    expect(scorePickable(pick({ label: "Open", keywords: ["read", "load"], group: "File" }), "xyz")).toBe(0)
  })

  test("label match outranks any keyword or group match", () => {
    const fromLabel = scorePickable(pick({ label: "save", keywords: ["unrelated"] }), "save")
    const fromKeyword = scorePickable(pick({ label: "Persist file", keywords: ["save"] }), "save")
    const fromGroup = scorePickable(pick({ label: "Persist file", group: "Save commands" }), "save")
    expect(fromLabel).toBeGreaterThan(fromKeyword)
    expect(fromKeyword).toBeGreaterThan(fromGroup)
  })
})
