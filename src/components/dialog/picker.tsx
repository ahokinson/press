import { Empty } from "@components/atom/empty.tsx"
import { Highlight } from "@components/atom/highlight.tsx"
import { InputBar } from "@components/control/input.tsx"
import { Modal } from "@components/dialog/modal.tsx"
import type { Pickable, PickerState } from "@models/picker/state.ts"
import type { Dimension } from "@terminal/dimension.ts"
import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { For, type JSX, Show } from "solid-js"

export interface PickerRowContext<T> {
  /** The item being rendered. */
  item: T
  /** Pickable projection of `item`. Reactive. */
  shape: () => Pickable
  /** Current query string. Reactive. */
  query: () => string
  /** True when this row is the active selection. */
  active: () => boolean
}

export interface PickerProps<T> {
  state: PickerState<T>
  /** Modal title. Default "Picker". */
  title?: string
  /** Placeholder shown in the query bar when empty. Default "Type to filter…". */
  placeholder?: string
  /** Pass-through to `Modal`. Default "60%". */
  width?: Dimension
  /** Pass-through to `Modal`. Default "60%". */
  height?: Dimension
  /**
   * Custom row renderer. The default renders a highlighted label with an
   * optional dim group label and a hint chip on the right.
   */
  renderItem?: (context: PickerRowContext<T>) => JSX.Element
}

const DEFAULT_PLACEHOLDER = "Type to filter…"
const DEFAULT_EMPTY = "No results"

/**
 * Generic fuzzy-pick UI: query bar above a filtered list. Enter accepts the
 * active row. Wire keyboard with a `KeymapLayer` whose `active` reads
 * `state.isOpen`.
 */
export function Picker<T>(props: PickerProps<T>): JSX.Element {
  const theme = useTheme()

  return (
    <Modal
      when={props.state.isOpen}
      title={props.title ?? "Picker"}
      width={props.width ?? "60%"}
      height={props.height ?? "60%"}
      flush
    >
      <box flexDirection="column" flexGrow={1}>
        <InputBar
          label="›"
          buffer={props.state.query}
          placeholder={props.placeholder ?? DEFAULT_PLACEHOLDER}
          trailing={() => {
            const total = props.state.visible().length
            if (total === 0) return "0/0"
            return `${props.state.cursor() + 1}/${total}`
          }}
        />
        <Show when={props.state.visible().length > 0} fallback={<Empty message={DEFAULT_EMPTY} />}>
          <box flexDirection="column" flexGrow={1} paddingLeft={1} paddingRight={1}>
            <For each={props.state.visible()}>
              {(item, index) => {
                const active = () => index() === props.state.cursor()
                const shape = () => props.state.shapeOf(item)
                const query = () => props.state.query()
                const context: PickerRowContext<T> = { item, shape, query, active }
                return (
                  <box flexDirection="row" backgroundColor={active() ? theme.backgroundSelection : undefined}>
                    {props.renderItem ? props.renderItem(context) : defaultRow(context)}
                  </box>
                )
              }}
            </For>
          </box>
        </Show>
      </box>
    </Modal>
  )
}

function defaultRow<T>(context: PickerRowContext<T>): JSX.Element {
  const theme = useTheme()
  return (
    <box flexDirection="row" justifyContent="space-between" flexGrow={1}>
      <Highlight
        text={context.shape().label}
        query={context.query()}
        fg={context.active() ? theme.text : theme.textSub}
        matchFg={theme.accent}
        bold={context.active()}
      />
      <text>
        <Show when={context.shape().group}>
          <span style={{ fg: theme.textDim }}>{` ${context.shape().group} `}</span>
        </Show>
        <Show when={context.shape().hint}>
          <span
            style={{ fg: theme.text, bg: theme.backgroundSelection, attributes: BOLD }}
          >{` ${context.shape().hint} `}</span>
        </Show>
      </text>
    </box>
  )
}
