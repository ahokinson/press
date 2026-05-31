import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import type { JSX, ParentProps } from "solid-js"

export interface FieldProps extends ParentProps {
  label: string
  labelWidth?: number
  labelColor?: string
  bold?: boolean
}

/**
 * One-row label/value pair. Renders a fixed-width dim label cell beside the
 * provided value (children).
 */
export function Field(props: FieldProps): JSX.Element {
  const theme = useTheme()
  return (
    <box flexDirection="row">
      <box width={props.labelWidth ?? 12}>
        <text fg={props.labelColor ?? theme.textDim} attributes={props.bold ? BOLD : 0}>
          {props.label}
        </text>
      </box>
      {props.children}
    </box>
  )
}
