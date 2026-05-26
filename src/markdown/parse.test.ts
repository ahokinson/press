import { describe, expect, test } from "bun:test"
import { type Block, BlockKind, InlineKind, parseInline, parseMarkdown } from "@markdown/parse.ts"

describe("parseMarkdown — blocks", () => {
  test("empty source produces no blocks", () => {
    expect(parseMarkdown("")).toEqual([])
    expect(parseMarkdown("\n\n  \n")).toEqual([])
  })

  test("ATX heading levels 1 through 6", () => {
    const source = ["# h1", "## h2", "### h3", "#### h4", "##### h5", "###### h6"].join("\n")
    const blocks = parseMarkdown(source) as Block[]
    expect(blocks).toHaveLength(6)
    blocks.forEach((block, index) => {
      expect(block.kind).toBe(BlockKind.Heading)
      if (block.kind === BlockKind.Heading) {
        expect(block.level).toBe((index + 1) as 1 | 2 | 3 | 4 | 5 | 6)
      }
    })
  })

  test("paragraph collapses adjacent non-empty lines", () => {
    const blocks = parseMarkdown("one\ntwo\nthree")
    expect(blocks).toHaveLength(1)
    const block = blocks[0]!
    expect(block.kind).toBe(BlockKind.Paragraph)
    if (block.kind === BlockKind.Paragraph) {
      expect(block.inline).toEqual([{ kind: InlineKind.Text, text: "one two three" }])
    }
  })

  test("blank line splits paragraphs", () => {
    const blocks = parseMarkdown("first\n\nsecond")
    expect(blocks).toHaveLength(2)
    expect(blocks[0]!.kind).toBe(BlockKind.Paragraph)
    expect(blocks[1]!.kind).toBe(BlockKind.Paragraph)
  })

  test("fenced code block with language tag", () => {
    const blocks = parseMarkdown("```ts\nconst x = 1\nconst y = 2\n```")
    expect(blocks).toHaveLength(1)
    const block = blocks[0]!
    expect(block.kind).toBe(BlockKind.Code)
    if (block.kind === BlockKind.Code) {
      expect(block.language).toBe("ts")
      expect(block.lines).toEqual(["const x = 1", "const y = 2"])
    }
  })

  test("fenced code block without language tag", () => {
    const blocks = parseMarkdown("```\nplain\n```")
    const block = blocks[0]!
    if (block.kind === BlockKind.Code) {
      expect(block.language).toBeUndefined()
      expect(block.lines).toEqual(["plain"])
    }
  })

  test("unordered list with - and *", () => {
    const blocks = parseMarkdown("- one\n- two\n* three")
    expect(blocks).toHaveLength(1)
    const block = blocks[0]!
    if (block.kind === BlockKind.List) {
      expect(block.ordered).toBe(false)
      expect(block.items).toHaveLength(3)
      expect(block.items[0]).toEqual([{ kind: InlineKind.Text, text: "one" }])
    }
  })

  test("ordered list with numeric prefixes", () => {
    const blocks = parseMarkdown("1. first\n2. second\n3. third")
    const block = blocks[0]!
    if (block.kind === BlockKind.List) {
      expect(block.ordered).toBe(true)
      expect(block.items).toHaveLength(3)
    }
  })

  test("blockquote collapses adjacent quoted lines", () => {
    const blocks = parseMarkdown("> first line\n> second line")
    expect(blocks).toHaveLength(1)
    const block = blocks[0]!
    if (block.kind === BlockKind.Blockquote) {
      expect(block.inline).toEqual([{ kind: InlineKind.Text, text: "first line second line" }])
    }
  })

  test("clamps heading level above 6 to 6", () => {
    const blocks = parseMarkdown("####### very deep")
    const block = blocks[0]!
    if (block.kind === BlockKind.Heading) {
      expect(block.level).toBe(6)
    }
  })

  test("mixed document produces blocks in source order", () => {
    const blocks = parseMarkdown(
      ["# Title", "", "Body paragraph.", "", "- one", "- two", "", "```", "code", "```"].join("\n"),
    )
    expect(blocks.map((block) => block.kind)).toEqual([
      BlockKind.Heading,
      BlockKind.Paragraph,
      BlockKind.List,
      BlockKind.Code,
    ])
  })
})

describe("parseInline", () => {
  test("plain text is emitted as a single Text span", () => {
    expect(parseInline("hello world")).toEqual([{ kind: InlineKind.Text, text: "hello world" }])
  })

  test("bold and italic", () => {
    expect(parseInline("**bold** and *italic*")).toEqual([
      { kind: InlineKind.Bold, text: "bold" },
      { kind: InlineKind.Text, text: " and " },
      { kind: InlineKind.Italic, text: "italic" },
    ])
  })

  test("inline code", () => {
    expect(parseInline("use `printf` here")).toEqual([
      { kind: InlineKind.Text, text: "use " },
      { kind: InlineKind.Code, text: "printf" },
      { kind: InlineKind.Text, text: " here" },
    ])
  })

  test("inline code beats italic inside its backticks", () => {
    expect(parseInline("`*not italic*`")).toEqual([{ kind: InlineKind.Code, text: "*not italic*" }])
  })

  test("link parses to label + url", () => {
    expect(parseInline("[click](https://x.example/y)")).toEqual([
      { kind: InlineKind.Link, label: "click", url: "https://x.example/y" },
    ])
  })

  test("mix of spans round-trips in source order", () => {
    const result = parseInline("Hi **there**, see [docs](u) or `code`.")
    expect(result.map((span) => span.kind)).toEqual([
      InlineKind.Text,
      InlineKind.Bold,
      InlineKind.Text,
      InlineKind.Link,
      InlineKind.Text,
      InlineKind.Code,
      InlineKind.Text,
    ])
  })
})
