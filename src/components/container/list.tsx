import { Pane } from "@components/container/pane.tsx"
import { createScrollboxOptions } from "@components/container/scroll/index.ts"
import { createScrollSync, type ScrollRef } from "@signals"
import { useTheme } from "@theme/provider.tsx"
import { createEffect, createMemo, createSignal, For, type JSX, onCleanup, Show } from "solid-js"

export interface ListProps<T> {
  title?: string
  items: () => readonly T[]
  selected: () => number
  focused?: () => boolean
  /** Render a row given the item, its index, and whether it is the active selection. */
  renderItem: (item: T, index: number, selected: boolean) => JSX.Element
  /** Optional empty-state label. */
  emptyLabel?: string
  flexGrow?: number
  flexBasis?: number | "auto"
  width?: number | `${number}%` | "auto"
  height?: number | `${number}%` | "auto"
}

interface SizedScrollRef extends ScrollRef {
  readonly height: number
  onSizeChange?: (() => void) | undefined
}

function asSizedScrollRef(el: unknown): SizedScrollRef | null {
  if (!el || typeof el !== "object") return null
  if (!("height" in el) || typeof (el as { height: unknown }).height !== "number") return null
  if (!("scrollTo" in el) || typeof (el as { scrollTo: unknown }).scrollTo !== "function") return null
  return el as SizedScrollRef
}

/**
 * Focusable list with selection highlighting. Keeps the active row inside the
 * viewport via `createScrollSync` and the scrollbox's own height. Does NOT bind
 * keys — wire j/k in the caller and update the `selected` signal.
 */
export function List<T>(props: ListProps<T>): JSX.Element {
  const theme = useTheme()
  const [viewport, setViewport] = createSignal(0)
  const [scrollRef, setScrollRef] = createSignal<SizedScrollRef | null>(null)
  const items = createMemo(() => props.items())
  const scrollboxOptions = createScrollboxOptions(theme)

  createScrollSync(props.selected, scrollRef, viewport)

  const setRef = (el: unknown) => {
    const ref = asSizedScrollRef(el)
    if (!ref) return
    setScrollRef(() => ref)
    setViewport(ref.height)
    const handler = () => setViewport(ref.height)
    ref.onSizeChange = handler
    onCleanup(() => {
      if (ref.onSizeChange === handler) ref.onSizeChange = undefined
    })
  }

  createEffect(() => {
    items()
    const ref = scrollRef()
    if (ref) setViewport(ref.height)
  })

  return (
    <Pane
      title={props.title}
      focused={props.focused}
      flexGrow={props.flexGrow}
      flexBasis={props.flexBasis}
      width={props.width}
      height={props.height}
    >
      <Show when={items().length > 0} fallback={<text fg={theme.faint}>{props.emptyLabel ?? "(empty)"}</text>}>
        <scrollbox flexGrow={1} ref={setRef} {...scrollboxOptions}>
          <For each={items()}>
            {(item, i) => {
              const isSelected = () => props.selected() === i()
              return (
                <box
                  flexDirection="row"
                  backgroundColor={isSelected() && props.focused?.() ? theme.bgHighlight : undefined}
                >
                  {props.renderItem(item, i(), isSelected())}
                </box>
              )
            }}
          </For>
        </scrollbox>
      </Show>
    </Pane>
  )
}
