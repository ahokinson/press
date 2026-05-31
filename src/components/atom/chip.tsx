import type { KeyHint } from "@keyboard"
import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import type { JSX } from "solid-js"

export interface KeyChipProps {
  hint: KeyHint
}

/**
 * Inline `key + action` chip. Must be rendered inside a `<text>` element.
 * Returns two adjacent `<span>` elements: the key in bold on `backgroundSelection`,
 * the action in `dim`. Shared between `StatusBar` and `HelpOverlay`.
 */
export function KeyChip(props: KeyChipProps): JSX.Element {
  const theme = useTheme()
  return (
    <>
      <span style={{ fg: theme.text, bg: theme.backgroundSelection, attributes: BOLD }}>{` ${props.hint.key} `}</span>
      <span style={{ fg: theme.textDim }}>{` ${props.hint.action}`}</span>
    </>
  )
}
