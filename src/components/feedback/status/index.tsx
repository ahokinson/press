import { KeyChip } from "@components/atom/chip.tsx"
import type { KeyHint } from "@keyboard"
import { useTheme } from "@theme/provider.tsx"
import { For, type JSX, Show } from "solid-js"

export type { KeyHint }

export interface StatusBarProps {
  hints: () => KeyHint[]
  trailing?: () => JSX.Element | string | null | undefined
  busy?: () => boolean
  spinner?: () => string
}

/**
 * One-row footer that paints contextual key→action hints on the left and an
 * optional trailing message (with optional spinner) on the right. The
 * consumer owns the hint logic.
 */
export function StatusBar(props: StatusBarProps): JSX.Element {
  const theme = useTheme()

  return (
    <box
      flexDirection="row"
      height={1}
      justifyContent="space-between"
      paddingLeft={1}
      paddingRight={1}
      backgroundColor={theme.headerBg}
    >
      <text>
        <For each={props.hints()}>
          {(hint, index) => (
            <>
              <KeyChip hint={hint} />
              <Show when={index() < props.hints().length - 1}>
                <span style={{ fg: theme.faint }}> · </span>
              </Show>
            </>
          )}
        </For>
      </text>
      <text fg={theme.accent}>
        <Show when={props.busy?.() && props.spinner}>
          <span style={{ fg: theme.accent }}>{`${props.spinner?.() ?? ""} `}</span>
        </Show>
        {props.trailing?.() ?? ""}
      </text>
    </box>
  )
}
