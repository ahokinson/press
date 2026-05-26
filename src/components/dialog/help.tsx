import { KeyChip } from "@components/atom/chip.tsx"
import { Section } from "@components/container/section.tsx"
import { Modal } from "@components/dialog/modal.tsx"
import { bindingCheatsheet, type KeyBinding } from "@keyboard"
import type { Dimension } from "@terminal/dimension.ts"
import { createMemo, For, type JSX } from "solid-js"

export interface HelpOverlayProps {
  /** Render only while this returns true. */
  when: () => boolean
  /** Bindings to render. Pass the same list you feed to `dispatchBindings`. */
  bindings: () => readonly KeyBinding[]
  /** Modal title shown in the border strip. Default "Help". */
  title?: string
  /** Pass-through to `Modal`. Default "60%". */
  width?: Dimension
  /** Pass-through to `Modal`. Default "60%". */
  height?: Dimension
}

/**
 * Cheatsheet rendered from `KeyBinding`s, grouped into sections. Bindings
 * without a hint are excluded. Bindings without a group fall into a default
 * bucket.
 */
export function HelpOverlay(props: HelpOverlayProps): JSX.Element {
  const groups = createMemo(() => bindingCheatsheet(props.bindings()))
  return (
    <Modal when={props.when} title={props.title ?? "Help"} width={props.width ?? "60%"} height={props.height ?? "60%"}>
      <For each={groups()}>
        {(group) => (
          <box flexDirection="column" marginBottom={1}>
            <Section label={group.group} count={group.entries.length} />
            <box flexDirection="column" paddingLeft={2} paddingTop={1}>
              <For each={group.entries}>
                {(entry) => (
                  <text>
                    <KeyChip hint={entry} />
                  </text>
                )}
              </For>
            </box>
          </box>
        )}
      </For>
    </Modal>
  )
}
