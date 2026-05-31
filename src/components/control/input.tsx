import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type Accessor, createMemo, type JSX, Show } from "solid-js"

/** Default cursor glyph used by `InputBar` when no `cursor` prop is supplied. */
export const DEFAULT_INPUT_CURSOR = "▎"

/** Default label/buffer separator used by `InputBar` when no `separator` prop is supplied. */
export const DEFAULT_INPUT_SEPARATOR = " › "

export interface InputBarProps {
  label: string
  buffer: () => string
  placeholder?: string
  cursor?: string
  separator?: string
  trailing?: () => string | JSX.Element | null | undefined
}

/**
 * One-row text input strip: bold accent label, faint separator, current
 * buffer (or placeholder when empty), accent cursor. The optional `trailing`
 * slot renders a right-aligned message (string in dim, JSX as-is). The
 * caller owns the keymap and pipes keys into the signal backing `buffer()`.
 */
export function InputBar(props: InputBarProps): JSX.Element {
  const theme = useTheme()
  const cursor = () => props.cursor ?? DEFAULT_INPUT_CURSOR
  const separator = () => props.separator ?? DEFAULT_INPUT_SEPARATOR
  const placeholder = () => props.placeholder ?? ""
  const trailing = createMemo(() => props.trailing?.())

  return (
    <box
      flexDirection="row"
      height={1}
      paddingLeft={1}
      paddingRight={1}
      justifyContent={props.trailing ? "space-between" : "flex-start"}
      backgroundColor={theme.backgroundElevated}
    >
      <text>
        <span style={{ fg: theme.accent, attributes: BOLD }}>{props.label}</span>
        <span style={{ fg: theme.textFaint }}>{separator()}</span>
        <span style={{ fg: theme.text }}>{props.buffer() || placeholder()}</span>
        <span style={{ fg: theme.accent }}>{cursor()}</span>
      </text>
      <Show when={trailing()}>
        {(value: Accessor<string | JSX.Element>) => {
          const trailingValue = value()
          return typeof trailingValue === "string" ? <text fg={theme.textDim}>{trailingValue}</text> : trailingValue
        }}
      </Show>
    </box>
  )
}
