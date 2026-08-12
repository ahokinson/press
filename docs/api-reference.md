# Press API Reference

## Models (`@ahokinson/press/models`)

### createDataLoader\<T\>
```ts
createDataLoader<T>(config: { fetch: (signal: AbortSignal) => Promise<T> }): DataLoaderState<T>
```
Status: `"idle" | "loading" | "success" | "error" | "refreshing"`.
- `load()` — initial fetch (idle → loading → success|error)
- `refresh()` — reload; keeps stale `data()` visible during fetch (status → "refreshing")
- `reset()` — back to idle
- `status()`, `data()`, `error()`

Pair with `<AsyncView state={loader}>`.

---

### createFilterableListState\<T, S, F\>
```ts
createFilterableListState(config: {
  items: () => readonly T[]
  search?: (item: T, query: string) => boolean
  sorts: Record<S, (a: T, b: T) => number>
  sortCycle: readonly S[]
  defaultSort: S
  filters?: Record<F, (item: T) => boolean>
  filterCycle?: readonly F[]
  defaultFilter?: F | null
  section?: { key: (item: T) => string, order?: string[], headerRows?: number, spacerRows?: number }
}): FilterableListState<T, S, F>
```
Accessors: `cursor`, `filterText`, `sortBy`, `statusFilter`, `filteredItems`, `visibleItems`, `selectedItem`, `scrollRow`, `positionLabel`.
Mutators: `next`, `prev`, `setCursor`, `setFilterText`, `cycleSortBy`, `cycleStatusFilter`, `toggleSection`.

**Use `visibleItems()` (not `filteredItems()`) for rendering.**
**Use `scrollRow()` (not `cursor()`) as Y for `createScrollboxSync` when sections are configured.**

---

### createMultiSelectState\<T\>
```ts
createMultiSelectState(config: {
  items: () => readonly T[]
  key: (item: T) => string
  initialSelection?: Iterable<string>
  wrap?: boolean
}): MultiSelectState<T>
```
Accessors: `cursor`, `selectedCount`, `isSelected(item)`, `selectedItems`, `items`.
Mutators: `next`, `prev`, `setCursor`, `toggle(item)`, `toggleCursor()`, `selectAll()`, `clearAll()`.
Selection is key-based and survives filtering.

---

### createPicker\<T\>
```ts
createPicker(config: {
  items: () => readonly T[]
  shape: (item: T) => Pickable   // { id, label, keywords?, group?, hint? }
  onAccept: (item: T) => void | boolean | Promise<undefined | boolean>
}): PickerState<T>
```
Accessors: `isOpen`, `query`, `cursor`, `visible` (scored+filtered), `active`, `shapeOf(item)`.
Mutators: `open`, `close`, `toggle`, `setQuery`, `move(delta)`, `accept()`.
`onAccept` returning `false` keeps picker open and clears query. Anything else closes.

---

### createTreeState\<T\>
```ts
createTreeState(roots: Accessor<TreeNode<T>[]>, opts?: { initialExpanded?: Iterable<string> }): TreeState<T>
```
`TreeNode<T>`: `{ id: string, data: T, children?: TreeNode<T>[] }`.
`VisibleTreeRow<T>`: `{ node: TreeNode<T>, depth: number, hasChildren: boolean, isExpanded: boolean }`.
Accessors: `visible` (flattened depth-first), `cursor`, `isExpanded(id)`.
Mutators: `toggle(id)`, `expand(id)`, `collapse(id)`, `focusNext()`, `focusPrev()`, `setCursor(index)`.

---

### createFocusRing
```ts
createFocusRing(opts?: { wrap?: boolean }): FocusRing
```
`ring.register(id, handler?)` → `FocusHandle` with `isFocused`, `focus`, `blur`, `release`.
`ring.focused()`, `ring.ids()`, `ring.next()`, `ring.prev()`, `ring.blur()`.
`ring.layer` — `KeymapLayer` that routes events to the focused pane's handler.
**Always call `handle.release()` in `onCleanup` when registering inside a component.**

---

### createConfirmState
```ts
createConfirmState(): ConfirmState
// confirm.request({ message, detail?, destructive?, onConfirm, onError? })
// confirm.execute()    — runs onConfirm, clears state
// confirm.cancel()     — clears state
// confirm.dialogAction() → ConfirmAction | null   (pass to <ConfirmDialog action={...}>)
```

---

### createWizard\<TStep\>
```ts
createWizard(steps: readonly TStep[], opts?: { initial?: TStep }): WizardState<TStep>
// wizard.step(), wizard.index(), wizard.isFirst(), wizard.isLast()
// wizard.next(), wizard.prev(), wizard.goto(step), wizard.reset()
```

---

### createStatusState
```ts
createStatusState(): StatusState
// status.showMessage(text, durationMs?)   — auto-dismisses with shrinking trail
// status.message(), status.trail()
// status.busy.showReason(text), status.busy.clear(), status.busy.active()
// composeTrailing(status, fallback)       — standard precedence for StatusBar trailing
```

---

### createOverlayState\<T\>
```ts
createOverlayState<T extends { kind: string }>(initial: T): OverlayState<T>
// overlay.overlay(), overlay.set(next), overlay.close()
// overlay.asKind("detail") → Extract<T, { kind: "detail" }> | null
```

---

### createScreenStack\<T\>
```ts
createScreenStack<T>(initial: T): ScreenStack<T>
// screens.top(), screens.depth(), screens.stack()
// screens.push(screen), screens.pop(), screens.replace(screen), screens.reset(screen)
```
Use for whole-screen navigation. Use `createOverlayState` for modals/overlays.

---

### createTableQuery\<T\>
```ts
createTableQuery(opts: {
  rows: Accessor<readonly T[]>
  compare?: (a: T, b: T, sort: SortState) => number
  defaultSort?: SortState   // { key, desc }
  filter?: (row: T, query: string) => boolean
}): TableQuery<T>
// tq.rows(), tq.sort(), tq.cycleSort(key), tq.query(), tq.setQuery()
```

---

### createFieldState\<T\>
```ts
createFieldState(opts: { initial: T, validate?: ValidationRule<T> }): FieldState<T>
// field.value(), field.set(next), field.error(), field.valid(), field.touched()
// field.markTouched(), field.reset()
```
Validation: `createValidator(rules)`, `nonEmpty()`, `matches(pattern, msg)`, `maxLength(n)`, `minLength(n)`, `numeric(opts)`.

---

### createHistory\<T\>
```ts
createHistory(opts: { initial: T, limit?: number }): History<T>
// history.current(), history.push(next)
// history.undo(), history.redo(), history.canUndo(), history.canRedo()
```

---

## Terminal (`@ahokinson/press/terminal`)

### createResponsiveRouter\<TMode\>
```ts
createResponsiveRouter(options: {
  breakpoints: readonly Breakpoint<TMode>[]   // { minWidth: number; mode: TMode }
  routes: Record<TMode, { mode: TMode; panes: ReadonlyArray<LayoutPane> }>
}): ResponsiveRouter<TMode>
```
`LayoutPane`: `{ key: string; flex: number; minWidth?: number }`

`ResponsiveRouter<TMode>`:
- `mode()` — active mode label, reactive on terminal resize
- `panes()` — inline pane list for the active mode
- `paneByKey(key)` — `undefined` when the pane is collapsed at the current width
- `isOverlay(key)` — `true` when the key is declared in some route but absent from the active one

Must include a `minWidth: 0` breakpoint (catch-all) or it throws. Use `isOverlay` to branch between inline and `Modal` rendering.

---

### useResponsiveLayout\<TMode\>
```ts
useResponsiveLayout(breakpoints: readonly Breakpoint<TMode>[]): () => TMode
```
Lower-level hook; returns the active mode. Use `createResponsiveRouter` instead unless you only need the mode label without pane routing.

---

### mountTUI / runTUI
```ts
mountTUI(node: () => JSX.Element, options?: MountOptions): Promise<CliRenderer>
runTUI<T>(node: (finish: (value: T) => void) => JSX.Element, options?: MountOptions): Promise<T>
// MountOptions: { renderer?: CliRendererConfig; create?: () => Promise<CliRenderer> }
```
**Use these instead of calling `render` directly.** They own three things apps
keep getting wrong:

- **The debug console takes the keyboard.** The renderer opens it on error and
  it renders *focused*, so from the first thrown error every keystroke goes to
  the console. The app keeps painting, so it reads as a hang. `consoleMode` is
  `"disabled"` by default; pass `renderer: { consoleMode: "..." }` to opt back in.
- **`render` hands back nothing.** It resolves to `void`, so there is no handle
  to `stop()` — and a process holding stdin in raw mode on the alternate screen
  never exits. The quit key looks frozen while every other key works.
- **A failed mount must not hang.** `void render(...)` swallows the rejection
  and leaves the caller waiting forever.

`mountTUI` returns the renderer and leaves it running — for apps that exit from
inside a key handler. `runTUI` waits for `finish`, stops the renderer in a
`finally`, and resolves with whatever `finish` was given — for apps that must do
something *after* the TUI, such as handing the terminal to another process.

Stopping is not the same as exiting: the renderer still holds handles that keep
the loop alive. Call `process.exit` once `runTUI` resolves if you mean to quit.

```ts
const outcome = await runTUI<Outcome>((finish) => <App onDone={finish} />)
if (outcome.kind !== "attach") process.exit(0)
```

---

### createTerminalHandover
```ts
createTerminalHandover(renderer: CliRenderer): TerminalHandover
// TerminalHandover: <T>(fn: () => Promise<T>) => Promise<T>
```
Suspends the opentui renderer, runs `fn` (e.g. spawn `$EDITOR` or a pager), then resumes. Re-entrant: nested calls share the outermost suspend/resume pair. Concurrent calls serialize.

`createTerminalHandover` is for subprocesses you come back from; `runTUI` is for
the ones you do not.

---

## Signals (`@ahokinson/press/signals`)

```ts
createNavigationCursor({ length: () => number, initial?: number, wrap?: boolean })
  // → { cursor, setCursor, next, prev }

createScrollboxSync({ cursor: () => number, contextRows?: number })
  // → { bindRef, viewport, scrollRef, refresh }
  // Attach: <scrollbox ref={sync.bindRef}>

createCycler(values: T[], signal: Accessor<T>, setter: Setter<T>)
  // → () => void   (advance to next value)

cumulativeOffsets(rows: T[], heightOf: (row: T) => number)
  // → number[]   where result[i] = Y start of row i in scrollbox coordinate space

createIndexedStore<K extends string, V>(initial?: Record<K, V>): IndexedStore<K, V>
  // store.entries(), store.get(key), store.keys(), store.size()
  // store.set(key, value), store.update(key, partial), store.upsert(key, value)
  // store.remove(key), store.replace(next), store.clear()
```

---

## Keyboard (`@ahokinson/press/keyboard`)

```ts
composeKeymap(layers: ReadonlyArray<KeymapLayer>): (event: KeyEvent) => void
// layer.active?() — whether layer handles input (omit = always active)
// layer.handler(event) → true to consume, false/void to fall through

matchKey(event: KeyEvent, spec: Partial<KeyEvent>): boolean
// spec: { name?, sequence?, ctrl?, meta?, shift? }

handleTextInput(setter: (fn: (s: string) => string) => void, event: KeyEvent): boolean
// Feeds printable chars and backspace into a string signal. Returns true when consumed.

dispatchBindings(bindings: () => readonly KeyBinding[], onQuit?: () => void): KeyHandler
// KeyBinding: { match: KeySpec, hint?: KeyHint, group?: string, run: (event) => void }

bindingHints(bindings: () => readonly KeyBinding[]): KeyHint[]
// Extract { key, action } pairs for StatusBar hints prop

bindingCheatsheet(bindings: readonly KeyBinding[]): CheatsheetGroup[]
// Groups by binding.group; bindings without a hint are excluded.
// DEFAULT_CHEATSHEET_GROUP labels ungrouped entries.
// HelpOverlay calls this internally — no need to call it yourself.

createHover(): Hover
// Hover: { hovered: () => boolean; handlers: MouseHandlers }
// Spread handlers onto a <box> for reactive hover state.

createDragHandle(opts: { onDrag: (delta: number) => void; axis?: DragAxis; onStart?(): void; onEnd?(): void }): DragHandle
// DragHandle: { dragging: () => boolean; handlers: MouseHandlers }
// DragAxis: "x" | "y" — defaults to "y"
```

Key names: `"return"`, `"escape"`, `"up"`, `"down"`, `"left"`, `"right"`, `"backspace"`, `"tab"`, `"space"`, `"f1"`–`"f12"`. Single characters use the character as `name` (e.g., `{ name: "j" }`). Modifiers: `ctrl`, `meta`, `shift`.

---

## Components (`@ahokinson/press/components`)

### Layout
```
<Pane title? focused? borderColor? flexGrow? flexBasis? width? height? padding? paddingX? paddingY? gap?>
<Card>, <Section>, <Sections sections cursor setScrollRef renderItem renderSectionHeader emptyState?>
<Header>
<Tabs tabs active orientation? onActivate renderTab?>
<Separated>

createScrollboxOptions(theme: Theme): ScrollboxOptions
// Pre-built <scrollbox> config: no arrow widgets, bgAlt/faint scrollbar track,
// MacOS momentum curve. Spread directly:
// <scrollbox {...createScrollboxOptions(theme)} ref={sync.bindRef}>
```

### Lists
```
<List items cursor focused? renderItem emptyLabel? flexGrow? flexBasis? width? height?>
<MultiList items cursor focused? renderItem emptyLabel? ...>
<Tree state render />
  // render: (ctx: { row: VisibleTreeRow<T>, index: number, isCursor: boolean }) => JSX.Element
<Table columns rows selected? sort? onHeaderClick? onRowClick? loadingRows?>
```

### Async
```
<AsyncView state skeletonRows? emptyMessage? isEmpty? refreshIndicator? formatError?>
  {(data) => <JSX />}
</AsyncView>
```
`isEmpty` overrides the built-in empty check. `refreshIndicator` shows during "refreshing" status.

### Controls
```
<InputBar label? buffer? placeholder? cursor? separator? trailing?>
<Field label value error? focused?>
```

### Dialogs
```
<Modal when title? severity? width? height? top? left? paddingX? paddingY? zIndex?>
<ConfirmDialog action />       // action: () => ConfirmAction | null
<Picker state title? placeholder? width? height? renderItem?>
<HelpOverlay when bindings />
```
`ConfirmDialog` flows inline in the layout. `Modal` is absolutely positioned.

### Atoms
```
<Badge color?>
<KeyChip hint />              // hint: { key, action }
<Highlight text query fg? matchFg? bold?>
<Progress value min? max? width?>
<Spinner />
<Skeleton rows renderRow />
<Truncated text maxWidth? />
<Empty message hint? />
```

### Feedback
```
<StatusBar hints? trailing? busy? spinner?>
<Toast message trail? severity? color? icon?>
<Banner backgroundColor? padding? paddingX?>
<Callout color? icon?>
```

---

## Theme (`@ahokinson/press/theme`)

Standard tokens: `text`, `subtext`, `muted`, `dim`, `faint`, `accent`, `ok`, `warn`, `err`, `info`, `teal`, `lavender`, `flamingo`, `maroon`, `peach`, `sky`, `mauve`, `bg`, `bgAlt`, `bgHighlight`, `headerBg`, `border`, `crust`.

```ts
import { makeTheme, createTheme, ThemeProvider, useTheme, BOLD, UNDERLINE, ITALIC } from "@ahokinson/press/theme"
import { flavors } from "@catppuccin/palette"

// Built-in flavors: latte, frappe (default), macchiato, mocha
const theme = makeTheme(flavors.mocha.colors)

// Custom extended theme
const myTheme = createTheme({ brand: "#ff6b6b" }, flavors.mocha.colors)
// In components: cast useTheme() as typeof myTheme to access custom tokens

// In JSX: attributes prop uses bit masks
<text attributes={BOLD | ITALIC}>bold italic</text>
```

### Severity and Change
```ts
import { Severity, severityColor, Change, changeOf, changeColor } from "@ahokinson/press/theme"

Severity: Neutral | Info | Success | Warning | Error
severityColor(theme, severity): string
  // Info→accent, Success→ok, Warning→warn, Error→err, Neutral→muted
  // Override per-bucket via theme.severityColors

Change: Down | Flat | Up
changeOf(delta: number, epsilon = 0): Change
  // |delta| <= epsilon → Flat; NaN → Flat
changeColor(theme, change): string
  // Up→ok, Down→err, Flat→muted
```

---

## Context (`@ahokinson/press/context`)

### createRequiredContext
```ts
createRequiredContext<T, Props>({ name: string; init: (props: Props) => T }): RequiredContext<T, Props>
// RequiredContext: { Provider: Component<Props>; use: () => T }
```
`use()` throws when called outside its `Provider` — makes missing the provider a dev error rather than a silent undefined. Use for feature sub-contexts that should never be used without setup.
