export enum BlockKind {
  Heading = "heading",
  Paragraph = "paragraph",
  Code = "code",
  List = "list",
  Blockquote = "blockquote",
}

export enum InlineKind {
  Text = "text",
  Code = "code",
  Bold = "bold",
  Italic = "italic",
  Link = "link",
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface InlineText {
  kind: InlineKind.Text
  text: string
}
export interface InlineCode {
  kind: InlineKind.Code
  text: string
}
export interface InlineBold {
  kind: InlineKind.Bold
  text: string
}
export interface InlineItalic {
  kind: InlineKind.Italic
  text: string
}
export interface InlineLink {
  kind: InlineKind.Link
  label: string
  url: string
}
export type Inline = InlineText | InlineCode | InlineBold | InlineItalic | InlineLink

export interface HeadingBlock {
  kind: BlockKind.Heading
  level: HeadingLevel
  inline: Inline[]
}
export interface ParagraphBlock {
  kind: BlockKind.Paragraph
  inline: Inline[]
}
export interface CodeBlock {
  kind: BlockKind.Code
  language: string | undefined
  lines: string[]
}
export interface ListBlock {
  kind: BlockKind.List
  ordered: boolean
  items: Inline[][]
}
export interface BlockquoteBlock {
  kind: BlockKind.Blockquote
  inline: Inline[]
}
export type Block = HeadingBlock | ParagraphBlock | CodeBlock | ListBlock | BlockquoteBlock

const HEADING_RE = /^(#{1,6})\s+(.*)$/
const FENCE_RE = /^```(.*)$/
const ORDERED_RE = /^(\d+)\.\s+(.*)$/
const UNORDERED_RE = /^[*-]\s+(.*)$/
const QUOTE_RE = /^>\s?(.*)$/

// Single regex with alternation. Order matters: link, then code, then bold
// (longer marker first), then italic.
const INLINE_RE = /(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g

/**
 * Parse a markdown source string into a flat list of blocks. v1 supports ATX
 * headings, paragraphs, fenced code (with optional language tag),
 * single-level unordered and ordered lists, blockquotes, and the inline
 * forms `code`, **bold**, *italic*, [label](url). Tables, raw HTML, images,
 * footnotes, and setext headings are out of scope.
 */
export function parseMarkdown(source: string): Block[] {
  const lines = source.split("\n")
  const blocks: Block[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]!
    if (line.trim() === "") {
      index++
      continue
    }

    const fence = line.match(FENCE_RE)
    if (fence) {
      const rawLanguage = fence[1]?.trim() ?? ""
      const language = rawLanguage.length > 0 ? rawLanguage : undefined
      const codeLines: string[] = []
      index++
      while (index < lines.length && !FENCE_RE.test(lines[index]!)) {
        codeLines.push(lines[index]!)
        index++
      }
      if (index < lines.length) index++
      blocks.push({ kind: BlockKind.Code, language, lines: codeLines })
      continue
    }

    const heading = line.match(HEADING_RE)
    if (heading) {
      const level = Math.min(6, heading[1]!.length) as HeadingLevel
      blocks.push({ kind: BlockKind.Heading, level, inline: parseInline(heading[2]!) })
      index++
      continue
    }

    if (UNORDERED_RE.test(line)) {
      const items: Inline[][] = []
      while (index < lines.length) {
        const match = lines[index]!.match(UNORDERED_RE)
        if (!match) break
        items.push(parseInline(match[1]!))
        index++
      }
      blocks.push({ kind: BlockKind.List, ordered: false, items })
      continue
    }

    if (ORDERED_RE.test(line)) {
      const items: Inline[][] = []
      while (index < lines.length) {
        const match = lines[index]!.match(ORDERED_RE)
        if (!match) break
        items.push(parseInline(match[2]!))
        index++
      }
      blocks.push({ kind: BlockKind.List, ordered: true, items })
      continue
    }

    if (QUOTE_RE.test(line)) {
      const collected: string[] = []
      while (index < lines.length) {
        const match = lines[index]!.match(QUOTE_RE)
        if (!match) break
        collected.push(match[1]!)
        index++
      }
      blocks.push({ kind: BlockKind.Blockquote, inline: parseInline(collected.join(" ")) })
      continue
    }

    const paragraph: string[] = [line]
    index++
    while (index < lines.length) {
      const next = lines[index]!
      if (
        next.trim() === "" ||
        HEADING_RE.test(next) ||
        FENCE_RE.test(next) ||
        UNORDERED_RE.test(next) ||
        ORDERED_RE.test(next) ||
        QUOTE_RE.test(next)
      ) {
        break
      }
      paragraph.push(next)
      index++
    }
    blocks.push({ kind: BlockKind.Paragraph, inline: parseInline(paragraph.join(" ")) })
  }
  return blocks
}

/**
 * Parse a single line of source into inline spans. Plain text outside the
 * recognized markers is emitted as `Text`. Nested forms aren't supported in
 * v1: `**foo *bar* baz**` parses as one bold span with literal asterisks
 * inside.
 */
export function parseInline(source: string): Inline[] {
  const out: Inline[] = []
  let lastIndex = 0
  for (const match of source.matchAll(INLINE_RE)) {
    const at = match.index
    if (at > lastIndex) {
      out.push({ kind: InlineKind.Text, text: source.slice(lastIndex, at) })
    }
    if (match[1]) {
      out.push({ kind: InlineKind.Link, label: match[2]!, url: match[3]! })
    } else if (match[4]) {
      out.push({ kind: InlineKind.Code, text: match[5]! })
    } else if (match[6]) {
      out.push({ kind: InlineKind.Bold, text: match[7]! })
    } else if (match[8]) {
      out.push({ kind: InlineKind.Italic, text: match[9]! })
    }
    lastIndex = at + match[0].length
  }
  if (lastIndex < source.length) {
    out.push({ kind: InlineKind.Text, text: source.slice(lastIndex) })
  }
  return out
}
