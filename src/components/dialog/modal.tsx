import type { Dimension } from "@terminal/dimension.ts"
import { Intent, intentColor } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type JSX, type ParentProps, Show } from "solid-js"

export interface ModalProps extends ParentProps {
  /** Render only while this returns true. */
  when: () => boolean
  /** Title strip rendered into the top border. */
  title?: string
  /** Semantic colour bucket for the border. Defaults to `Intent.Neutral`. */
  intent?: Intent
  /** Box sizing. Defaults to "50%" wide and 12 rows tall. */
  width?: Dimension
  height?: Dimension
  /** Position offsets. Default centres the modal at 25%/25%. */
  top?: Dimension
  left?: Dimension
  /** Stack order. Default 10. Raise for nested modals. */
  zIndex?: number
  /** Remove inner padding for full-bleed content (e.g. compound pickers). */
  flush?: boolean
}

/**
 * Overlay frame: rounded border, themed colour by intent (or explicit
 * `borderColor`), background fill, children slot. No keybinding logic; wire
 * enter/esc in your keymap layer and toggle `when()` from there.
 *
 * For confirm prompts, prefer `ConfirmDialog`.
 */
export function Modal(props: ModalProps): JSX.Element {
  const theme = useTheme()

  const border = (): string => intentColor(theme, props.intent ?? Intent.Neutral)

  return (
    <Show when={props.when()}>
      <box
        position="absolute"
        top={props.top ?? "25%"}
        left={props.left ?? "25%"}
        width={props.width ?? "50%"}
        height={props.height ?? 12}
        border
        borderStyle="rounded"
        borderColor={border()}
        backgroundColor={theme.background}
        title={props.title}
        titleAlignment="left"
        paddingTop={props.flush ? 0 : 1}
        paddingBottom={props.flush ? 0 : 1}
        paddingLeft={props.flush ? 0 : 2}
        paddingRight={props.flush ? 0 : 2}
        flexDirection="column"
        zIndex={props.zIndex ?? 10}
      >
        {props.children}
      </box>
    </Show>
  )
}
