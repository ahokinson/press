import type { Dimension, DimensionFixed } from "@terminal/dimension.ts"
import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type JSX, type ParentProps, Show } from "solid-js"

export interface BoxProps extends ParentProps {
  title?: string | JSX.Element
  description?: string
  focused?: () => boolean
  flexGrow?: number
  flexBasis?: DimensionFixed
  width?: Dimension
  height?: Dimension
  padding?: number
  gap?: number
}

/**
 * Bordered container with an optional title bar and focus-aware border.
 *
 * Border is accent when `focused()` is true, faint otherwise (or when
 * `focused` is omitted). Title bar uses `backgroundChrome` with an accent label.
 */
export function Box(props: BoxProps): JSX.Element {
  const theme = useTheme()
  const pad = () => props.padding ?? 1
  const border = () => (props.focused?.() ? theme.borderFocused : theme.border)

  return (
    <box
      flexDirection="column"
      flexGrow={props.flexGrow ?? 1}
      flexBasis={props.flexBasis}
      width={props.width}
      height={props.height}
      paddingLeft={pad()}
      paddingRight={pad()}
      paddingTop={pad()}
      paddingBottom={pad()}
      gap={props.gap}
      border
      borderStyle="rounded"
      borderColor={border()}
    >
      <Show when={props.title !== undefined}>
        <box height={1} backgroundColor={theme.backgroundChrome} paddingLeft={1} paddingRight={1}>
          {typeof props.title === "string" ? (
            <text fg={theme.accent} attributes={BOLD}>
              {props.title}
            </text>
          ) : (
            props.title
          )}
        </box>
      </Show>
      <Show when={props.description}>
        <box paddingLeft={1} paddingRight={1}>
          <text fg={theme.textDim}>{props.description}</text>
        </box>
      </Show>
      {props.children}
    </box>
  )
}
