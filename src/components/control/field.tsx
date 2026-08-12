import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type JSX, type ParentProps, Show } from "solid-js"

export interface FieldProps extends ParentProps {
  label: string
  labelWidth?: number
  labelColor?: string
  bold?: boolean
  /**
   * String value rendered beside the label. When empty/whitespace it falls back to `placeholder`
   * in a dim tone, so a missing field reads as "not present" and stacked rows stay pixel-stable
   * instead of collapsing. Alternative to `children` (which wins if both are given).
   */
  value?: string
  /** Foreground for a non-empty `value`. Defaults to `theme.text`. */
  valueColor?: string
  /** Shown (dim) when `value` is empty. Default "—". */
  placeholder?: string
}

/**
 * One-row label/value pair: a fixed-width dim label cell beside a value. Provide the value as either
 * a `value` string (with empty→`placeholder` handling) or arbitrary `children` JSX. Designed for
 * stacked detail views — wrap several `Field`s in a column.
 */
export function Field(props: FieldProps): JSX.Element {
  const theme = useTheme()
  const empty = () => props.value === undefined || props.value.trim() === ""
  return (
    <box flexDirection="row">
      <box width={props.labelWidth ?? 12}>
        <text fg={props.labelColor ?? theme.textDim} attributes={props.bold ? BOLD : 0}>
          {props.label}
        </text>
      </box>
      <Show
        when={props.children !== undefined}
        fallback={
          <text
            flexGrow={1}
            flexShrink={1}
            wrapMode="none"
            truncate
            fg={empty() ? theme.textDim : (props.valueColor ?? theme.text)}
          >
            {empty() ? (props.placeholder ?? "—") : props.value}
          </text>
        }
      >
        {props.children}
      </Show>
    </box>
  )
}
