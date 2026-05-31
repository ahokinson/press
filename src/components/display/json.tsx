import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { createMemo, For, type JSX, Show } from "solid-js"

export interface JsonColors {
  /** Object keys (left of `:`). */
  key: string
  /** String literals. */
  str: string
  /** Number and bigint literals. */
  num: string
  /** Boolean literals. */
  bool: string
  /** `null` and `undefined`. */
  nul: string
  /** Non-plain objects rendered via their `String(...)` form. */
  type: string
  /** Punctuation: braces, brackets, commas, colons. */
  punct: string
}

export interface JsonProps {
  value: () => unknown
  /** Maximum nesting depth to expand before collapsing further with `…`. Default 8. */
  maxDepth?: number
  /** Truncate long strings beyond this many characters. Default 200. */
  maxStringLength?: number
  /** Number of spaces per indent level. Default 2. */
  indent?: number
  /** Override the role-to-token mapping. Unset roles use theme defaults. */
  colors?: Partial<JsonColors>
}

interface Line {
  indent: number
  segments: { text: string; color: string; bold?: boolean }[]
}

/**
 * Pretty-prints any JS value as colored, indented text lines. Non-plain
 * objects (constructors other than `Object`/`Array`) render via their string
 * form. Read-only.
 */
export function Json(props: JsonProps): JSX.Element {
  const theme = useTheme()
  const maxDepth = () => props.maxDepth ?? 8
  const maxStringChars = () => props.maxStringLength ?? 200
  const indentStep = () => props.indent ?? 2

  const colors: JsonColors = {
    key: props.colors?.key ?? theme.syntaxKey,
    str: props.colors?.str ?? theme.ok,
    num: props.colors?.num ?? theme.syntaxNum,
    bool: props.colors?.bool ?? theme.syntaxBool,
    nul: props.colors?.nul ?? theme.textDim,
    type: props.colors?.type ?? theme.syntaxType,
    punct: props.colors?.punct ?? theme.textFaint,
  }

  function formatPrimitive(value: unknown): { text: string; color: string } {
    if (value === null) return { text: "null", color: colors.nul }
    if (value === undefined) return { text: "undefined", color: colors.nul }
    switch (typeof value) {
      case "string": {
        const truncated = value.length > maxStringChars() ? `${value.slice(0, maxStringChars())}…` : value
        return { text: JSON.stringify(truncated), color: colors.str }
      }
      case "number":
      case "bigint":
        return { text: String(value), color: colors.num }
      case "boolean":
        return { text: String(value), color: colors.bool }
      default:
        return { text: String(value), color: colors.type }
    }
  }

  function isPlainContainer(value: unknown): value is Record<string, unknown> | unknown[] {
    if (Array.isArray(value)) return true
    if (value === null || typeof value !== "object") return false
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
  }

  function build(value: unknown, depth: number, indent: number, prefix: { text: string; color: string }[]): Line[] {
    if (!isPlainContainer(value)) {
      const formatted = formatPrimitive(value)
      return [{ indent, segments: [...prefix, { text: formatted.text, color: formatted.color }] }]
    }
    if (depth >= maxDepth()) {
      return [{ indent, segments: [...prefix, { text: Array.isArray(value) ? "[…]" : "{…}", color: colors.punct }] }]
    }
    const lines: Line[] = []
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return [{ indent, segments: [...prefix, { text: "[]", color: colors.punct }] }]
      }
      lines.push({ indent, segments: [...prefix, { text: "[", color: colors.punct }] })
      for (let index = 0; index < value.length; index++) {
        const trailing = index < value.length - 1 ? "," : ""
        const child = build(value[index], depth + 1, indent + indentStep(), [])
        const last = child[child.length - 1]
        if (last && trailing) last.segments.push({ text: trailing, color: colors.punct })
        for (const line of child) lines.push(line)
      }
      lines.push({ indent, segments: [{ text: "]", color: colors.punct }] })
      return lines
    }
    const entries = Object.entries(value)
    if (entries.length === 0) {
      return [{ indent, segments: [...prefix, { text: "{}", color: colors.punct }] }]
    }
    lines.push({ indent, segments: [...prefix, { text: "{", color: colors.punct }] })
    for (let index = 0; index < entries.length; index++) {
      const [key, entryValue] = entries[index]!
      const trailing = index < entries.length - 1 ? "," : ""
      const keyPrefix = [
        { text: JSON.stringify(key), color: colors.key, bold: true },
        { text: ": ", color: colors.punct },
      ]
      const child = build(entryValue, depth + 1, indent + indentStep(), keyPrefix)
      const last = child[child.length - 1]
      if (last && trailing) last.segments.push({ text: trailing, color: colors.punct })
      for (const line of child) lines.push(line)
    }
    lines.push({ indent, segments: [{ text: "}", color: colors.punct }] })
    return lines
  }

  const lines = createMemo<Line[]>(() => build(props.value(), 0, 0, []))

  return (
    <box flexDirection="column">
      <For each={lines()}>
        {(line) => (
          <text>
            <Show when={line.indent > 0}>
              <span style={{ fg: colors.punct }}>{" ".repeat(line.indent)}</span>
            </Show>
            <For each={line.segments}>
              {(segment) => (
                <span style={{ fg: segment.color, attributes: segment.bold ? BOLD : 0 }}>{segment.text}</span>
              )}
            </For>
          </text>
        )}
      </For>
    </box>
  )
}
