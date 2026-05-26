import { describe, expect, test } from "bun:test"
import { type Inline, InlineKind } from "@markdown/parse.ts"
import { wrapInline, wrapToWidth } from "@markdown/wrap.ts"

function text(value: string): Inline {
  return { kind: InlineKind.Text, text: value }
}

describe("wrapInline", () => {
  test("returns a single line when the spans fit inside width", () => {
    const lines = wrapInline([text("the quick fox")], 80)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toEqual([text("the"), text(" "), text("quick"), text(" "), text("fox")])
  })

  test("breaks when a word would exceed width", () => {
    const lines = wrapInline([text("aa bb cc dd")], 5)
    // "aa bb" (5) → flush → "cc dd" (5)
    expect(lines).toHaveLength(2)
  })

  test("drops leading whitespace at the start of each wrapped line", () => {
    const lines = wrapInline([text("aaaaa bbbbb ccccc")], 5)
    expect(lines.map((line) => line.map((span) => (span.kind === InlineKind.Link ? "" : span.text)).join(""))).toEqual([
      "aaaaa",
      "bbbbb",
      "ccccc",
    ])
  })

  test("a single word wider than width is placed on its own line and overflows", () => {
    const lines = wrapInline([text("supercalifragilistic")], 5)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toEqual([text("supercalifragilistic")])
  })

  test("preserves inline kind per word across the wrap", () => {
    const spans: Inline[] = [
      { kind: InlineKind.Text, text: "say " },
      { kind: InlineKind.Bold, text: "hello world" },
      { kind: InlineKind.Text, text: " now" },
    ]
    const lines = wrapInline(spans, 8)
    // Whitespace runs inherit the surrounding span kind, so we filter to the actual words.
    const flat = lines.flat()
    const boldWords = flat
      .filter((span) => span.kind === InlineKind.Bold)
      .filter((span) => span.kind === InlineKind.Bold && span.text.trim() !== "")
    const textWords = flat
      .filter((span) => span.kind === InlineKind.Text)
      .filter((span) => span.kind === InlineKind.Text && span.text.trim() !== "")
    expect(boldWords.map((span) => span.kind === InlineKind.Bold && span.text)).toEqual(["hello", "world"])
    expect(textWords.map((span) => span.kind === InlineKind.Text && span.text)).toEqual(["say", "now"])
  })

  test("preserves the URL on link spans across the wrap", () => {
    const spans: Inline[] = [{ kind: InlineKind.Link, label: "click here", url: "https://x.example" }]
    const lines = wrapInline(spans, 5)
    const linkSegments = lines.flat().filter((span) => span.kind === InlineKind.Link)
    expect(linkSegments).toHaveLength(2)
    for (const link of linkSegments) {
      if (link.kind === InlineKind.Link) expect(link.url).toBe("https://x.example")
    }
  })

  test("CJK characters count as width 2", () => {
    // 漢字 is 4 columns; 8-wide canvas fits 2 words of 漢字 with a space — actually 4+1+4=9, won't fit.
    const lines = wrapInline([text("漢字 漢字")], 8)
    expect(lines).toHaveLength(2)
  })

  test("always returns at least one line", () => {
    expect(wrapInline([], 20)).toEqual([[]])
  })
})

describe("wrapToWidth", () => {
  test("plain wrap returns the joined text per line", () => {
    expect(wrapToWidth("the quick brown fox", 9)).toEqual(["the quick", "brown fox"])
  })

  test("empty source returns a single empty line", () => {
    expect(wrapToWidth("", 10)).toEqual([""])
  })
})
