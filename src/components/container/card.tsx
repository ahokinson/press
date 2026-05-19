import { useTheme } from "@theme/provider.tsx"
import { type JSX, Show } from "solid-js"

export interface CardProps {
  title: string | JSX.Element
  color?: string
  description?: string
  padding?: number
  paddingX?: number
}

/**
 * Bordered rounded box with a coloured title row and an optional dim
 * description row. Use for action buttons, option callouts, or any focal
 * card-like surface. `color` paints both the border and the title text by
 * default; pass a JSX `title` if you need finer-grained styling.
 */
export function Card(props: CardProps): JSX.Element {
  const theme = useTheme()
  const color = () => props.color ?? theme.accent
  const padX = () => props.paddingX ?? props.padding ?? 1
  return (
    <box
      border
      borderStyle="rounded"
      borderColor={color()}
      paddingLeft={padX()}
      paddingRight={padX()}
      flexDirection="column"
    >
      {typeof props.title === "string" ? <text fg={color()}>{props.title}</text> : props.title}
      <Show when={props.description}>
        <text fg={theme.dim}>{props.description}</text>
      </Show>
    </box>
  )
}
