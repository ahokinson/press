import { Icon } from "@icons"
import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type JSX, Show } from "solid-js"

export interface SectionProps {
  label: string
  count?: number
  /** Collapsed state for the chevron variant. The caller owns the signal + toggle key. */
  collapsed?: () => boolean
  /** Lead with this glyph instead of a chevron (implies non-collapsible). */
  icon?: string
  /** Icon + label color. Defaults to `theme.textSub`. */
  color?: string
  /** Show the chevron (collapsible variant). Default true; forced off when `icon` is set. */
  collapsible?: boolean
}

/**
 * One-row section header on a `backgroundChrome` strip. Three variants:
 * - default (`collapsible`, no `icon`): chevron + bold label + faint count.
 * - `icon`: a leading category glyph in `color` + label + count (non-collapsible).
 * - `collapsible={false}` (no `icon`): a plain colored label + count, no chevron.
 */
export function Section(props: SectionProps): JSX.Element {
  const theme = useTheme()
  const showChevron = () => props.icon === undefined && (props.collapsible ?? true)
  const chevron = () => ((props.collapsed?.() ?? false) ? Icon.chevronRight.char : Icon.chevronDown.char)
  const color = () => props.color ?? theme.textSub
  const label = () => {
    if (props.icon) return `  ${props.icon}  ${props.label}`
    return showChevron() ? props.label : ` ${props.label}`
  }
  return (
    <box height={1} backgroundColor={theme.backgroundChrome}>
      <text>
        <Show when={showChevron()}>
          <span style={{ fg: theme.textSub }}>{` ${chevron()} `}</span>
        </Show>
        <span style={{ fg: color(), attributes: BOLD }}>{label()}</span>
        {props.count !== undefined && <span style={{ fg: theme.textDim }}>{` ${props.count}`}</span>}
      </text>
    </box>
  )
}
