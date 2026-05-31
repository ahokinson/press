import { useTheme } from "@theme/provider.tsx"
import { type JSX, Show } from "solid-js"

export interface EmptyProps {
  message: string
  hint?: string
}

/**
 * Centered empty-state for lists/search results. Both message and hint in `faint`
 * so they recede behind any real content. Stretches to fill its parent.
 */
export function Empty(props: EmptyProps): JSX.Element {
  const theme = useTheme()
  return (
    <box flexGrow={1} justifyContent="center" alignItems="center" flexDirection="column" gap={1}>
      <text fg={theme.faint}>{props.message}</text>
      <Show when={props.hint}>
        <text fg={theme.faint}>{props.hint}</text>
      </Show>
    </box>
  )
}
