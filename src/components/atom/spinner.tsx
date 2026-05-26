import { useTimeline } from "@opentui/solid"
import { useTheme } from "@theme/provider.tsx"
import { createSignal, type JSX, Show } from "solid-js"

const DEFAULT_FRAMES: readonly string[] = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
const FRAME_MS = 80

function useFrame(frames: readonly string[] = DEFAULT_FRAMES): () => string {
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

/**
 * Spinner internals for callers building a custom display. `DEFAULT_FRAMES`
 * is the braille set `Spinner` uses. `useFrame()` returns a reactive accessor
 * over the current frame.
 */
export const Spinners = {
  DEFAULT_FRAMES,
  useFrame,
} as const

export interface SpinnerProps {
  label?: string
  color?: string
  frames?: readonly string[]
}

/** Inline spinner with optional label. */
export function Spinner(props: SpinnerProps): JSX.Element {
  const theme = useTheme()
  const frame = useFrame(props.frames ?? DEFAULT_FRAMES)
  return (
    <text fg={props.color ?? theme.accent}>
      {frame()}
      <Show when={props.label}>{` ${props.label}`}</Show>
    </text>
  )
}
