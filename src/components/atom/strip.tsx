import type { JSX, ParentProps } from "solid-js"

export interface StripProps extends ParentProps {
  /** Horizontal padding in columns applied symmetrically to both sides. Default 0. */
  paddingX?: number
  /** Background fill. Omitted when undefined. */
  backgroundColor?: string
}

/**
 * One-row horizontal frame: `<box flexDirection="row" height={1}>`. Pure
 * shell. Shared by `Banner`, `Toast`, and `Callout` so they agree on strip
 * sizing.
 */
export function Strip(props: StripProps): JSX.Element {
  const padding = (): number => props.paddingX ?? 0
  return (
    <box
      flexDirection="row"
      height={1}
      paddingLeft={padding()}
      paddingRight={padding()}
      backgroundColor={props.backgroundColor}
    >
      {props.children}
    </box>
  )
}
