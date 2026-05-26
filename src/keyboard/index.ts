export { bindingCheatsheet, type CheatsheetGroup, DEFAULT_CHEATSHEET_GROUP } from "@keyboard/help.ts"
export {
  createDragHandle,
  createHover,
  DragAxis,
  type DragHandle,
  type DragHandleOptions,
  type Hover,
  type MouseEventLike,
  type MouseHandlers,
} from "@keyboard/mouse.ts"

/** Shape of a key event from opentui (or any compatible source). */
export interface KeyEvent {
  name?: string
  sequence?: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
}

/** Partial pattern matched against a `KeyEvent`. Alias of `Partial<KeyEvent>`. */
export type KeySpec = Partial<KeyEvent>

/**
 * Feed a key event into a text buffer. Returns true when the event was
 * consumed: backspace deletes one char, printable single-char sequences
 * append (modifiers excluded). Otherwise returns false.
 */
export function handleTextInput(setter: (update: (text: string) => string) => void, key: KeyEvent): boolean {
  if (key.name === "backspace") {
    setter((text) => text.slice(0, -1))
    return true
  }
  const sequence = key.sequence
  if (sequence && sequence.length === 1 && !key.ctrl && !key.meta) {
    setter((text) => text + sequence)
    return true
  }
  return false
}

/** Match a key event against a partial spec. Missing spec fields are ignored. */
export function matchKey(event: KeyEvent, spec: KeySpec): boolean {
  if (spec.name !== undefined && spec.name !== event.name) return false
  if (spec.sequence !== undefined && spec.sequence !== event.sequence) return false
  if (spec.ctrl !== undefined && spec.ctrl !== !!event.ctrl) return false
  if (spec.meta !== undefined && spec.meta !== !!event.meta) return false
  if (spec.shift !== undefined && spec.shift !== !!event.shift) return false
  return true
}

/**
 * A single key→action chip rendered by `StatusBar`. Defined here because the
 * binding shape pairs hints with keymaps. `@ahokinson/press/components`
 * re-exports `KeyHint` for back-compat.
 */
export interface KeyHint {
  key: string
  action: string
}

/** Ctrl+C — universal "kill the TUI now" spec. */
export const QUIT_KEY_SPEC: KeySpec = { name: "c", ctrl: true }

/**
 * A key binding: match spec, handler, optional `KeyHint` chip for the status
 * bar. An optional `group` clusters bindings in `bindingCheatsheet`. Bindings
 * without a group fall into a default bucket.
 */
export interface KeyBinding {
  match: KeySpec
  hint?: KeyHint
  group?: string
  run: (event: KeyEvent) => void
}

/**
 * Build a `useKeyboard` handler from an accessor over the current binding
 * list. The first binding whose `match` matches wins. An optional `onQuit`
 * runs ahead of the list and short-circuits on Ctrl+C.
 */
export function dispatchBindings(
  bindings: () => readonly KeyBinding[],
  onQuit?: () => void,
): (event: KeyEvent) => void {
  return (event) => {
    if (onQuit && matchKey(event, QUIT_KEY_SPEC)) {
      onQuit()
      return
    }
    for (const binding of bindings()) {
      if (matchKey(event, binding.match)) {
        binding.run(event)
        return
      }
    }
  }
}

export function bindingHints(bindings: readonly KeyBinding[]): KeyHint[] {
  return bindings.flatMap((binding) => (binding.hint ? [binding.hint] : []))
}

export interface BindingMatch {
  /** Binding that would consume the event, or `null` if none would. */
  binding: KeyBinding | null
  /** Index of `binding` in the input list, or `-1` if no binding matched. */
  index: number
  /** `true` when the event matches `QUIT_KEY_SPEC` (Ctrl+C). Independent of `binding`. */
  quit: boolean
}

/**
 * Which binding `dispatchBindings` would route this event to, without running
 * its `run` callback. The first matching binding wins, mirroring
 * `dispatchBindings`. `quit` is independent of `binding`.
 */
export function describeBindings(event: KeyEvent, bindings: readonly KeyBinding[]): BindingMatch {
  const quit = matchKey(event, QUIT_KEY_SPEC)
  for (let index = 0; index < bindings.length; index++) {
    const binding = bindings[index]!
    if (matchKey(event, binding.match)) return { binding, index, quit }
  }
  return { binding: null, index: -1, quit }
}

export interface KeymapLayer {
  /** Whether this layer should receive the event. Omit to keep the layer always active. */
  active?: () => boolean
  /** Return `true` to consume the event (stop dispatch to later layers). */
  // biome-ignore lint/suspicious/noConfusingVoidType: handlers commonly return implicit void; boolean | void is the intended permissive shape
  handler: (event: KeyEvent) => boolean | void
}

/**
 * Compose a stack of modal keymap layers into a single handler for opentui's
 * `useKeyboard`. Layers run in array order. The first active layer whose
 * `handler` returns `true` consumes the event. Layers that return
 * `false`/`void` fall through to the next active layer.
 */
export function composeKeymap(layers: ReadonlyArray<KeymapLayer>): (event: KeyEvent) => void {
  return (event) => {
    for (const layer of layers) {
      if (layer.active && !layer.active()) continue
      if (layer.handler(event) === true) return
    }
  }
}
