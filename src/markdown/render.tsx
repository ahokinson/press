import { Link } from "@link/link.tsx"
import { type Block, BlockKind, type HeadingLevel, type Inline, InlineKind, parseMarkdown } from "@markdown/parse.ts"
import { wrapInline } from "@markdown/wrap.ts"
import { BOLD, ITALIC, type Theme } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { createMemo, For, type JSX } from "solid-js"

export interface MarkdownProps {
  source: () => string
  /** Wrap width in columns. Defaults to 80. */
  width?: () => number
}

const DEFAULT_WIDTH = 80

/**
 * Render markdown into opentui boxes using the active theme. v1 supports ATX
 * headings (level-coloured, bold, no wrap), paragraphs (word-wrapped with
 * inline styles preserved per word), fenced code (full-row `backgroundElevated` block, no
 * wrap), single-level unordered and ordered lists, blockquotes (left `│`
 * gutter), and inline `code`, **bold**, *italic*, and links. Links render
 * as accent-coloured labels. The URL is not surfaced in v1.
 */
export function Markdown(props: MarkdownProps): JSX.Element {
  const theme = useTheme()
  const width = createMemo<number>(() => props.width?.() ?? DEFAULT_WIDTH)
  const blocks = createMemo<Block[]>(() => parseMarkdown(props.source()))
  return (
    <box flexDirection="column">
      <For each={blocks()}>{(block) => renderBlock(block, width(), theme)}</For>
    </box>
  )
}

const HEADING_COLOR = (theme: Theme, level: HeadingLevel): string => {
  if (level === 1) return theme.accent
  if (level === 2) return theme.syntaxKey
  if (level === 3) return theme.syntaxSubheading
  return theme.textDim
}

function renderBlock(block: Block, width: number, theme: Theme): JSX.Element {
  switch (block.kind) {
    case BlockKind.Heading:
      return (
        <box flexDirection="column" marginBottom={1}>
          <text>
            <span style={{ fg: HEADING_COLOR(theme, block.level), attributes: BOLD }}>
              {renderSpanText(block.inline)}
            </span>
          </text>
        </box>
      )
    case BlockKind.Paragraph: {
      const lines = wrapInline(block.inline, width)
      return (
        <box flexDirection="column" marginBottom={1}>
          <For each={lines}>{(line) => <text>{renderSpans(line, theme)}</text>}</For>
        </box>
      )
    }
    case BlockKind.Code:
      return (
        <box flexDirection="column" marginBottom={1} paddingLeft={2} paddingRight={2} backgroundColor={theme.backgroundElevated}>
          <For each={block.lines}>{(line) => <text fg={theme.textSub}>{line}</text>}</For>
        </box>
      )
    case BlockKind.List:
      return (
        <box flexDirection="column" marginBottom={1}>
          <For each={block.items}>
            {(item, index) => {
              const marker = block.ordered ? `${index() + 1}.` : "•"
              const indent = marker.length + 1
              const lines = wrapInline(item, Math.max(1, width - indent))
              return (
                <box flexDirection="column">
                  <For each={lines}>
                    {(line, lineIndex) => (
                      <text>
                        <span style={{ fg: theme.textDim }}>{lineIndex() === 0 ? `${marker} ` : " ".repeat(indent)}</span>
                        {renderSpans(line, theme)}
                      </text>
                    )}
                  </For>
                </box>
              )
            }}
          </For>
        </box>
      )
    case BlockKind.Blockquote: {
      const lines = wrapInline(block.inline, Math.max(1, width - 2))
      return (
        <box flexDirection="column" marginBottom={1}>
          <For each={lines}>
            {(line) => (
              <text>
                <span style={{ fg: theme.textDim }}>{"│ "}</span>
                {renderSpans(line, theme)}
              </text>
            )}
          </For>
        </box>
      )
    }
  }
}

function renderSpans(spans: readonly Inline[], theme: Theme): JSX.Element {
  return <For each={spans}>{(span) => renderSpan(span, theme)}</For>
}

function renderSpan(span: Inline, theme: Theme): JSX.Element {
  switch (span.kind) {
    case InlineKind.Text:
      return <span style={{ fg: theme.text }}>{span.text}</span>
    case InlineKind.Bold:
      return <span style={{ fg: theme.text, attributes: BOLD }}>{span.text}</span>
    case InlineKind.Italic:
      return <span style={{ fg: theme.textSub, attributes: ITALIC }}>{span.text}</span>
    case InlineKind.Code:
      return <span style={{ fg: theme.syntaxInlineCode, bg: theme.backgroundElevated }}>{span.text}</span>
    case InlineKind.Link:
      return <Link href={span.url}>{span.label}</Link>
  }
}

function renderSpanText(spans: readonly Inline[]): string {
  return spans.map((span) => (span.kind === InlineKind.Link ? span.label : span.text)).join("")
}
