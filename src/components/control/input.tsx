import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type Accessor, createMemo, type JSX, Show } from "solid-js"

export interface InputBarProps {
  label: string
  buffer: () => string
  placeholder?: string
  cursor?: string
  separator?: string
  trailing?: () => string | JSX.Element | null | undefined
}

/**
 * One-row text input strip: bold accent label, faint separator, current buffer
 * (or placeholder when empty), accent cursor. Optional `trailing` slot renders
 * a right-aligned message (string → dim, JSX → as-is). Pure paint — caller
 * owns the keymap and pipes keys into the signal that backs `buffer()`.
 */
export function InputBar(props: InputBarProps): JSX.Element {
  const theme = useTheme()
  const cursor = () => props.cursor ?? "▎"
  const separator = () => props.separator ?? " › "
  const placeholder = () => props.placeholder ?? ""
  const trailing = createMemo(() => props.trailing?.())

  return (
    <box
      flexDirection="row"
      height={1}
      paddingLeft={1}
      paddingRight={1}
      justifyContent={props.trailing ? "space-between" : "flex-start"}
      backgroundColor={theme.bgAlt}
    >
      <text>
        <span style={{ fg: theme.accent, attributes: BOLD }}>{props.label}</span>
        <span style={{ fg: theme.faint }}>{separator()}</span>
        <span style={{ fg: theme.text }}>{props.buffer() || placeholder()}</span>
        <span style={{ fg: theme.accent }}>{cursor()}</span>
      </text>
      <Show when={trailing()}>
        {(value: Accessor<string | JSX.Element>) => {
          const v = value()
          return typeof v === "string" ? <text fg={theme.dim}>{v}</text> : v
        }}
      </Show>
    </box>
  )
}
