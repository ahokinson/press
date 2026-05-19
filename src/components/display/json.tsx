import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { createMemo, For, type JSX, Show } from "solid-js"

export interface JsonProps {
  value: () => unknown
  /** Maximum nesting depth to expand before collapsing further with `…`. Default 8. */
  maxDepth?: number
  /** Truncate long strings beyond this many characters. Default 200. */
  maxStringLength?: number
  /** Number of spaces per indent level. Default 2. */
  indent?: number
}

interface Line {
  indent: number
  segments: { text: string; color: string; bold?: boolean }[]
}

/**
 * Pretty-prints any JS value as colored, indented text lines. Renders
 * BSON-style values (objects with constructor names other than `Object`/`Array`)
 * via their string form. Read-only; no collapse / expand interaction in this
 * version.
 */
export function Json(props: JsonProps): JSX.Element {
  const theme = useTheme()
  const maxDepth = () => props.maxDepth ?? 8
  const maxStr = () => props.maxStringLength ?? 200
  const indentStep = () => props.indent ?? 2

  const colors = {
    key: theme.lavender,
    str: theme.ok,
    num: theme.peach,
    bool: theme.maroon,
    nul: theme.dim,
    type: theme.teal,
    punct: theme.faint,
  }

  function formatPrimitive(v: unknown): { text: string; color: string } {
    if (v === null) return { text: "null", color: colors.nul }
    if (v === undefined) return { text: "undefined", color: colors.nul }
    switch (typeof v) {
      case "string": {
        const s = v.length > maxStr() ? `${v.slice(0, maxStr())}…` : v
        return { text: JSON.stringify(s), color: colors.str }
      }
      case "number":
      case "bigint":
        return { text: String(v), color: colors.num }
      case "boolean":
        return { text: String(v), color: colors.bool }
      default:
        return { text: String(v), color: colors.type }
    }
  }

  function isPlainContainer(v: unknown): v is Record<string, unknown> | unknown[] {
    if (Array.isArray(v)) return true
    if (v === null || typeof v !== "object") return false
    const proto = Object.getPrototypeOf(v)
    return proto === Object.prototype || proto === null
  }

  function build(value: unknown, depth: number, indent: number, prefix: { text: string; color: string }[]): Line[] {
    if (!isPlainContainer(value)) {
      const f = formatPrimitive(value)
      return [{ indent, segments: [...prefix, { text: f.text, color: f.color }] }]
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
      for (let i = 0; i < value.length; i++) {
        const trailing = i < value.length - 1 ? "," : ""
        const child = build(value[i], depth + 1, indent + indentStep(), [])
        const last = child[child.length - 1]
        if (last && trailing) last.segments.push({ text: trailing, color: colors.punct })
        for (const l of child) lines.push(l)
      }
      lines.push({ indent, segments: [{ text: "]", color: colors.punct }] })
      return lines
    }
    const entries = Object.entries(value)
    if (entries.length === 0) {
      return [{ indent, segments: [...prefix, { text: "{}", color: colors.punct }] }]
    }
    lines.push({ indent, segments: [...prefix, { text: "{", color: colors.punct }] })
    for (let i = 0; i < entries.length; i++) {
      const [k, v] = entries[i]!
      const trailing = i < entries.length - 1 ? "," : ""
      const keyPrefix = [
        { text: JSON.stringify(k), color: colors.key, bold: true },
        { text: ": ", color: colors.punct },
      ]
      const child = build(v, depth + 1, indent + indentStep(), keyPrefix)
      const last = child[child.length - 1]
      if (last && trailing) last.segments.push({ text: trailing, color: colors.punct })
      for (const l of child) lines.push(l)
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
              {(seg) => <span style={{ fg: seg.color, attributes: seg.bold ? BOLD : 0 }}>{seg.text}</span>}
            </For>
          </text>
        )}
      </For>
    </box>
  )
}
