import type { ToastEntry } from "@models/feedback/toasts.ts"
import type { Dimension } from "@terminal/dimension.ts"
import { intentColor } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { For, type JSX } from "solid-js"

export interface ToastsProps {
  /** The live stack — pass `createToastStack().toasts`. */
  toasts: () => ToastEntry[]
  /** Distance from the bottom edge. Default 1. */
  bottom?: Dimension
  /** Distance from the right edge. Default 2. */
  right?: Dimension
}

/**
 * A floating, bottom-right stack of transient notifications, each a rounded bordered row colored by
 * its `Intent` with an optional leading glyph. Pure paint over a `createToastStack` — the model owns
 * the timers. (For a single status-line message, use `Toast` + `createStatusState` instead.)
 */
export function Toasts(props: ToastsProps): JSX.Element {
  const theme = useTheme()
  return (
    <box
      position="absolute"
      bottom={props.bottom ?? 1}
      right={props.right ?? 2}
      flexDirection="column"
      alignItems="flex-end"
    >
      <For each={props.toasts()}>
        {(toast) => {
          const color = intentColor(theme, toast.intent)
          return (
            <box
              border
              borderStyle="rounded"
              borderColor={color}
              backgroundColor={theme.backgroundChrome}
              paddingLeft={1}
              paddingRight={1}
            >
              <text fg={color}>{toast.glyph ? `${toast.glyph}  ${toast.text}` : toast.text}</text>
            </box>
          )
        }}
      </For>
    </box>
  )
}
