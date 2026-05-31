import { Icon } from "@icons"
import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import type { JSX } from "solid-js"

export interface SectionProps {
  label: string
  count?: number
  collapsed?: () => boolean
}

/**
 * One-row collapsible section header: chevron, bold label, faint count. The
 * caller owns the collapsed signal and the toggle key.
 */
export function Section(props: SectionProps): JSX.Element {
  const theme = useTheme()
  const chevron = () => (props.collapsed?.() ?? false) ? Icon.chevronRight.char : Icon.chevronDown.char
  return (
    <box height={1} backgroundColor={theme.headerBg}>
      <text>
        <span style={{ fg: theme.subtext }}>{` ${chevron()} `}</span>
        <span style={{ fg: theme.subtext, attributes: BOLD }}>{props.label}</span>
        {props.count !== undefined && <span style={{ fg: theme.dim }}>{` ${props.count}`}</span>}
      </text>
    </box>
  )
}
