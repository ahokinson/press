import { useTimeline } from "@opentui/solid"
import { useTheme } from "@theme/provider.tsx"
import { createSignal, type JSX, Show } from "solid-js"

/** Default braille spinner glyphs (10 frames). */
export const DEFAULT_SPINNER_FRAMES: readonly string[] = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
const FRAME_MS = 80

/**
 * Returns an accessor over the current spinner frame. Pass a custom `frames`
 * array to override the glyphs (e.g. dots, arrows, custom Nerd Font sets).
 */
export function useSpinnerFrame(frames: readonly string[] = DEFAULT_SPINNER_FRAMES): () => string {
  const [frameIndex, setFrameIndex] = createSignal(0)
  const state = { progress: 0 }

  useTimeline({ loop: true }).add([state], {
    duration: frames.length * FRAME_MS,
    progress: 1,
    onUpdate: () => {
      setFrameIndex(Math.floor(state.progress * frames.length) % frames.length)
    },
  })

  return () => frames[frameIndex()] ?? ""
}

export interface SpinnerProps {
  label?: string
  color?: string
  frames?: readonly string[]
}

/** Inline spinner with optional label. Pair with a `busy` signal in the caller. */
export function Spinner(props: SpinnerProps): JSX.Element {
  const theme = useTheme()
  const frame = useSpinnerFrame(props.frames ?? DEFAULT_SPINNER_FRAMES)
  return (
    <text fg={props.color ?? theme.accent}>
      {frame()}
      <Show when={props.label}>{` ${props.label}`}</Show>
    </text>
  )
}
