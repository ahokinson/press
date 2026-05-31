import { useTheme } from "@theme/provider.tsx"
import { createEffect, createSignal, type JSX, onCleanup, Show } from "solid-js"

export interface CycleProps<T> {
  items: () => ReadonlyArray<T>
  /** Project each item to its rendered cell. String or JSX. */
  render: (item: T) => string | JSX.Element
  /** Milliseconds between rotations. Default 3000. */
  intervalMs?: number
  /** Rendered when `items()` is empty. */
  fallback?: () => string | JSX.Element
  /** Leading content slot (typically a spinner or status glyph). */
  prefix?: () => string
  /** Show "i/N" position suffix when more than one item. Default true. */
  showPosition?: boolean
}

const DEFAULT_INTERVAL_MS = 3000

/**
 * One-row rotating display. Cycles through `items()` at `intervalMs`,
 * painting the current entry via `render`. The caller keeps the original
 * item shape and supplies a projection.
 *
 * Owns its own interval and cleans up on unmount. Position resets to 0 when
 * `items()` goes empty.
 */
export function Cycle<T>(props: CycleProps<T>): JSX.Element {
  const theme = useTheme()
  const [index, setIndex] = createSignal(0)
  const interval = (): number => props.intervalMs ?? DEFAULT_INTERVAL_MS
  const shouldShowPosition = (): boolean => props.showPosition !== false

  createEffect(() => {
    const items = props.items()
    if (items.length === 0) {
      setIndex(0)
      return
    }
    if (items.length === 1) return
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % items.length)
    }, interval())
    onCleanup(() => clearInterval(timer))
  })

  const active = (): T | null => {
    const items = props.items()
    if (items.length === 0) return null
    return items[index() % items.length] ?? null
  }

  return (
    <box flexDirection="row" height={1} paddingLeft={1} paddingRight={1}>
      <text>
        <Show when={props.prefix?.()}>
          <span style={{ fg: theme.accent }}>{`${props.prefix?.()} `}</span>
        </Show>
        <Show when={active() !== null} fallback={<span style={{ fg: theme.textDim }}>{props.fallback?.() ?? ""}</span>}>
          <span style={{ fg: theme.textSub }}>{props.render(active() as T)}</span>
          <Show when={shouldShowPosition() && props.items().length > 1}>
            <span style={{ fg: theme.textFaint }}>{` ${index() + 1}/${props.items().length}`}</span>
          </Show>
        </Show>
      </text>
    </box>
  )
}
