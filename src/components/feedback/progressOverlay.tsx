import { Spinner } from "@components/atom/spinner.tsx"
import type { Dimension } from "@terminal/dimension.ts"
import { BOLD, Intent, intentColor } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { For, type JSX, Show } from "solid-js"

export interface ProgressTask {
  id: string
  /** Leading glyph (e.g. a source icon). */
  icon?: string
  /** Color for the icon. Defaults to the overlay accent. */
  iconColor?: string
  /** Primary text (e.g. what's running). */
  label: string
  /** Dim secondary text (e.g. a phase). */
  detail?: string
  /** Right-aligned trailing value (e.g. a live count). */
  value?: string
}

export interface ProgressOverlayProps {
  /** Live task list; one row each. */
  tasks: () => ProgressTask[]
  /** Heading beside the spinner. */
  title: () => string
  /** Shown when there are no tasks yet. Default "starting…". */
  emptyLabel?: string
  top?: Dimension
  right?: Dimension
  minWidth?: number
  /** Border tone. Default `Intent.Info`. */
  intent?: Intent
}

/**
 * A non-blocking, floating progress indicator: a spinner + heading over one row per in-flight task
 * (icon, label, dim detail, trailing value). For background work that streams — multi-source
 * fetches, parallel jobs — where the rest of the UI stays usable. Not a modal.
 */
export function ProgressOverlay(props: ProgressOverlayProps): JSX.Element {
  const theme = useTheme()
  const accent = () => intentColor(theme, props.intent ?? Intent.Info)
  return (
    <box
      position="absolute"
      top={props.top ?? 1}
      right={props.right ?? 2}
      minWidth={props.minWidth ?? 30}
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={accent()}
      backgroundColor={theme.backgroundChrome}
      paddingLeft={1}
      paddingRight={1}
    >
      <box flexDirection="row">
        <Spinner />
        <text fg={theme.text} attributes={BOLD}>{`  ${props.title()}`}</text>
      </box>
      <For each={props.tasks()}>
        {(task) => (
          <box flexDirection="row">
            <Show when={task.icon}>
              <text flexShrink={0} width={3} fg={task.iconColor ?? accent()} attributes={BOLD}>
                {task.icon}
              </text>
            </Show>
            <text flexGrow={1} flexShrink={1} wrapMode="none" truncate fg={theme.textSub}>
              {task.label}
            </text>
            <Show when={task.detail}>
              <text flexShrink={0} fg={theme.textDim}>{`  ${task.detail}`}</text>
            </Show>
            <Show when={task.value}>
              <text flexShrink={0} fg={theme.textSub}>{`  ${task.value}`}</text>
            </Show>
          </box>
        )}
      </For>
      <Show when={props.tasks().length === 0}>
        <text fg={theme.textFaint}>{props.emptyLabel ?? "starting…"}</text>
      </Show>
    </box>
  )
}
