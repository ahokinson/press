import type { Dimension } from "@terminal/dimension.ts"
import { Severity, severityColor } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type JSX, type ParentProps, Show } from "solid-js"

export interface ModalProps extends ParentProps {
  /** Render only while this returns true. */
  when: () => boolean
  /** Title strip rendered into the top border. */
  title?: string
  /**
   * Semantic colour bucket for the border. Defaults to `Severity.Info`.
   * Ignored when `borderColor` is set.
   */
  severity?: Severity
  /** Raw colour override for the border. Wins over `severity` when set. */
  borderColor?: string
  /** Panel background. Defaults to `theme.bg`. */
  backgroundColor?: string
  /** Box sizing. Defaults to "50%" wide and 12 rows tall. */
  width?: Dimension
  height?: Dimension
  /** Position offsets. Default centres the modal at 25%/25%. */
  top?: Dimension
  left?: Dimension
  /** Inner padding on the long axis. Default 2. */
  paddingX?: number
  /** Inner padding on the short axis. Default 1. */
  paddingY?: number
  /** Stack order. Default 10. Raise for nested modals. */
  zIndex?: number
}

/**
 * Overlay frame: rounded border, themed colour by severity (or explicit
 * `borderColor`), background fill, children slot. No keybinding logic; wire
 * enter/esc in your keymap layer and toggle `when()` from there.
 *
 * For confirm prompts, prefer `ConfirmDialog`.
 */
export function Modal(props: ModalProps): JSX.Element {
  const theme = useTheme()

  const border = (): string => {
    if (props.borderColor !== undefined) return props.borderColor
    return severityColor(theme, props.severity ?? Severity.Info)
  }

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
        backgroundColor={props.backgroundColor ?? theme.bg}
        title={props.title}
        titleAlignment="left"
        paddingTop={props.paddingY ?? 1}
        paddingBottom={props.paddingY ?? 1}
        paddingLeft={props.paddingX ?? 2}
        paddingRight={props.paddingX ?? 2}
        flexDirection="column"
        zIndex={props.zIndex ?? 10}
      >
        {props.children}
      </box>
    </Show>
  )
}
