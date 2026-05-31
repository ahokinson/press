import type { KeyHint } from "@keyboard"
import type { ConfirmAction } from "@models/dialog/confirm.ts"
import { BOLD, Severity, severityColor } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type Accessor, For, type JSX, Show } from "solid-js"

export type { ConfirmAction }

const DEFAULT_HINTS: ReadonlyArray<KeyHint> = [
  { key: "enter", action: "confirm" },
  { key: "esc", action: "cancel" },
]

/**
 * Bordered confirmation dialog. Pass `() => ConfirmAction | null`. The dialog
 * renders when the accessor returns a non-null action.
 *
 * Inline by design: flows in the parent's layout, unlike `Modal` which
 * floats absolutely. Destructive confirms paint `Severity.Error`, everything
 * else paints `Severity.Info`.
 *
 * The component doesn't bind keys. Wire enter/esc in your keymap layer and
 * call `action.onConfirm()` / `action.onCancel()` yourself.
 */
export function ConfirmDialog(props: { action: () => ConfirmAction | null }): JSX.Element {
  const theme = useTheme()

  return (
    <Show when={props.action()}>
      {(action: Accessor<ConfirmAction>) => (
        <box
          flexDirection="column"
          paddingTop={1}
          paddingBottom={1}
          paddingLeft={2}
          paddingRight={2}
          backgroundColor={theme.background}
          border
          borderStyle="rounded"
          borderColor={severityColor(theme, action().destructive ? Severity.Error : Severity.Info)}
          title={action().title ?? " confirm "}
          titleAlignment="left"
        >
          <box flexDirection="column" gap={1}>
            <text fg={theme.text} attributes={BOLD} wrapMode="word">
              {action().message}
            </text>
            <Show when={action().detail}>
              <text fg={theme.textMuted} wrapMode="word">
                {action().detail}
              </text>
            </Show>
            <text fg={theme.textDim}>
              <For each={action().keyHints ?? DEFAULT_HINTS}>
                {(hint, index) => (
                  <>
                    <span>{hint.key}</span>
                    <span style={{ fg: theme.textFaint }}>{` ${hint.action}`}</span>
                    <Show when={index() < (action().keyHints ?? DEFAULT_HINTS).length - 1}>
                      <span> </span>
                    </Show>
                  </>
                )}
              </For>
            </text>
          </box>
        </box>
      )}
    </Show>
  )
}
