/** Shape of a key event from opentui (or any compatible source). */
export interface KeyEvent {
  name?: string
  sequence?: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
}

/**
 * Partial pattern matched against a `KeyEvent`. Aliased to `Partial<KeyEvent>`
 * so the two types stay in lockstep when fields are added.
 */
export type KeySpec = Partial<KeyEvent>

/**
 * Feed a key event into a text buffer. Returns true when the event was
 * consumed (backspace deletes one char; printable single-char sequences append
 * — modifiers excluded). Returns false otherwise so the caller can fall
 * through to its keymap.
 */
export function handleTextInput(setter: (fn: (v: string) => string) => void, key: KeyEvent): boolean {
  if (key.name === "backspace") {
    setter((t) => t.slice(0, -1))
    return true
  }
  const seq = key.sequence
  if (seq && seq.length === 1 && !key.ctrl && !key.meta) {
    setter((t) => t + seq)
    return true
  }
  return false
}

/** Match a key event against a partial spec; missing spec fields are ignored. */
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
 * binding shape pairs hints with keymaps; `@ahokinson/press/components`
 * re-exports `KeyHint` for back-compat.
 */
export interface KeyHint {
  key: string
  action: string
}

/** Ctrl+C — universal "kill the TUI now" spec. */
export const QUIT_KEY_SPEC: KeySpec = { name: "c", ctrl: true }

/**
 * A key binding pairs a match spec with the handler to run and an optional
 * `KeyHint` chip for the status bar. Use with `dispatchBindings` /
 * `bindingHints`.
 */
export interface KeyBinding {
  match: KeySpec
  hint?: KeyHint
  run: (event: KeyEvent) => void
}

/**
 * Build a `useKeyboard` handler from an accessor returning the current binding
 * list. The first binding whose `match` matches wins. An optional `onQuit`
 * runs ahead of the list and short-circuits on Ctrl+C — convenient for
 * blanket-quit behavior across modal input states.
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
    for (const b of bindings()) {
      if (matchKey(event, b.match)) {
        b.run(event)
        return
      }
    }
  }
}

/** Pull `KeyHint` chips out of a binding list in declaration order. */
export function bindingHints(bindings: readonly KeyBinding[]): KeyHint[] {
  return bindings.flatMap((b) => (b.hint ? [b.hint] : []))
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
 * Pure diagnostic: returns which binding `dispatchBindings` would route this
 * event to, without running the binding's `run` callback. Use in dev to log or
 * debug keymap routing. The result reflects ordering: the first matching
 * binding wins, mirroring `dispatchBindings`. `quit` is reported independently
 * so callers can see when Ctrl+C would short-circuit the binding list.
 */
export function describeBindings(event: KeyEvent, bindings: readonly KeyBinding[]): BindingMatch {
  const quit = matchKey(event, QUIT_KEY_SPEC)
  for (let i = 0; i < bindings.length; i++) {
    const b = bindings[i]!
    if (matchKey(event, b.match)) return { binding: b, index: i, quit }
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
 * Compose a stack of modal keymap layers into a single handler suitable for
 * opentui's `useKeyboard`. Layers are evaluated in array order; the first
 * active layer whose `handler` returns `true` consumes the event and short-
 * circuits the rest. Layers that don't consume (return `false`/`void`) fall
 * through to the next active layer — useful for shared shortcuts like quit.
 */
export function composeKeymap(layers: ReadonlyArray<KeymapLayer>): (event: KeyEvent) => void {
  return (event) => {
    for (const layer of layers) {
      if (layer.active && !layer.active()) continue
      if (layer.handler(event) === true) return
    }
  }
}
