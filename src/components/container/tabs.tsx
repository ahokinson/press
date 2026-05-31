import { BOLD, UNDERLINE } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { For, type JSX, Show } from "solid-js"

export enum TabOrientation {
  Horizontal = "horizontal",
  Vertical = "vertical",
}

export interface TabDescriptor {
  key: string
  label: string
  /** Optional small badge (count, status) shown alongside the label. */
  badge?: string | number
}

export interface TabsProps {
  tabs: () => ReadonlyArray<TabDescriptor>
  active: () => string
  orientation?: TabOrientation
  /** Optional click/key handler. The caller wires keyboard rotation. */
  onActivate?: (key: string) => void
  /** Panel content for the active tab. */
  children?: JSX.Element
}

/**
 * Tab strip + panel slot. The caller owns `active()` and its update logic.
 * This component renders the strip and the children panel.
 *
 *   const cycle = createCycler(keys, activeKey, setActiveKey)
 */
export function Tabs(props: TabsProps): JSX.Element {
  const theme = useTheme()
  const isVertical = (): boolean => (props.orientation ?? TabOrientation.Horizontal) === TabOrientation.Vertical

  return (
    <box flexDirection={isVertical() ? "row" : "column"}>
      <box
        flexDirection={isVertical() ? "column" : "row"}
        height={isVertical() ? undefined : 1}
        width={isVertical() ? undefined : "100%"}
        backgroundColor={theme.backgroundChrome}
        paddingLeft={isVertical() ? 0 : 1}
        paddingRight={isVertical() ? 0 : 1}
      >
        <For each={props.tabs()}>
          {(tab) => {
            const isActive = (): boolean => tab.key === props.active()
            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: opentui <box> is the sole TUI interaction primitive
              <box onMouseDown={() => props.onActivate?.(tab.key)}>
                <text
                  attributes={isActive() ? BOLD | UNDERLINE : 0}
                  fg={isActive() ? theme.accent : theme.textDim}
                >
                  <span>{` ${tab.label}`}</span>
                  <Show when={tab.badge !== undefined}>
                    <span style={{ fg: isActive() ? theme.accent : theme.textDim }}>{` ${tab.badge}`}</span>
                  </Show>
                  <span> </span>
                </text>
              </box>
            )
          }}
        </For>
      </box>
      <box flexGrow={1}>{props.children}</box>
    </box>
  )
}
