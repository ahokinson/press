import { Severity, severityColor } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type JSX, type ParentProps, Show } from "solid-js"

export type ModalDimension = number | `${number}%` | "auto"

export interface ModalProps extends ParentProps {
  /** Render only while this returns true; the dialog is conditionally mounted. */
  when: () => boolean
  /** Title strip rendered into the top border (with leading/trailing spaces in caller). */
  title?: string
  /**
   * Semantic colour bucket — paints the border. Defaults to `Severity.Info`.
   * Ignored if `borderColor` is supplied.
   */
  severity?: Severity
  /** Raw colour override for the border. Wins over `severity` when set. */
  borderColor?: string
  /** Override the panel background. Defaults to `theme.bg`. */
  backgroundColor?: string
  /** Box sizing; pass-through to opentui. Defaults: "50%" / 12 rows. */
  width?: ModalDimension
  height?: ModalDimension
  /** Position offsets; pass-through to opentui. Defaults centre the modal at 25%/25%. */
  top?: ModalDimension
  left?: ModalDimension
  /** Inner padding on the long axis. Defaults to 2. */
  paddingX?: number
  /** Inner padding on the short axis. Defaults to 1. */
  paddingY?: number
  /** Stack order. Defaults to 10. Raise for nested modals. */
  zIndex?: number
}

/**
 * Generalised overlay frame: rounded border, themed colour by severity (or
 * explicit `borderColor`), background fill, and a children slot for content.
 * No keybinding logic — wire enter/esc in your keymap layer and toggle
 * `when()` from there.
 *
 * Pairs naturally with `createOverlayState` (discriminated `kind` ⇒ a Switch
 * picks the modal). For confirm prompts specifically, prefer `ConfirmDialog`.
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
