import { UNDERLINE } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import type { JSX } from "solid-js"

export interface LinkProps {
  /** Target URL. Stored for callers that handle activation themselves. */
  href: string
  /** Visible label. */
  children: JSX.Element
}

/**
 * Themed hyperlink for use inside `<text>` parents. Renders as an underlined
 * span in `theme.accent`. opentui doesn't emit OSC 8 from grid spans, so
 * clickable behavior currently requires `wrapOsc8` and direct-to-stdout
 * output.
 */
export function Link(props: LinkProps): JSX.Element {
  const theme = useTheme()
  return <span style={{ fg: theme.accent, attributes: UNDERLINE }}>{props.children}</span>
}
