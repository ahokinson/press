# Press Patterns

## Async list with search

```tsx
import { render, useKeyboard } from "@opentui/solid"
import { onMount } from "solid-js"
import { createDataLoader, createFilterableListState } from "@ahokinson/press/models"
import { composeKeymap, matchKey, handleTextInput } from "@ahokinson/press/keyboard"
import { AsyncView, List, InputBar } from "@ahokinson/press/components"
import { ThemeProvider, useTheme } from "@ahokinson/press/theme"

function App() {
  const theme = useTheme()

  const loader = createDataLoader({ fetch: (sig) => fetchItems(sig) })
  const list = createFilterableListState({
    items: () => loader.data() ?? [],
    search: (item, q) => item.name.toLowerCase().includes(q),
    sorts: { name: (a, b) => a.name.localeCompare(b.name) },
    sortCycle: ["name"] as const,
    defaultSort: "name",
  })
  onMount(() => loader.load())

  const handler = composeKeymap([{
    handler: (e) => {
      if (matchKey(e, { name: "j" })) { list.next(); return true }
      if (matchKey(e, { name: "k" })) { list.prev(); return true }
      return handleTextInput((f) => list.setFilterText(f(list.filterText())), e)
    },
  }])
  useKeyboard(handler)

  return (
    <ThemeProvider>
      <AsyncView state={loader}>
        {(data) => (
          <List
            items={list.visibleItems}
            cursor={list.cursor}
            renderItem={(item, _, active) => (
              <text fg={active() ? theme.text : theme.subtext}>{item.name}</text>
            )}
          />
        )}
      </AsyncView>
    </ThemeProvider>
  )
}

await render(() => <App />)
```

---

## Multi-pane with focus ring

```tsx
import { useKeyboard } from "@opentui/solid"
import { onCleanup } from "solid-js"
import { createFocusRing } from "@ahokinson/press/models"
import { composeKeymap, matchKey } from "@ahokinson/press/keyboard"
import { Pane } from "@ahokinson/press/components"

const ring = createFocusRing()

// Inside each pane component:
function LeftPane(props) {
  const handle = ring.register("left", (event) => {
    if (matchKey(event, { name: "j" })) { list.next(); return true }
    if (matchKey(event, { name: "k" })) { list.prev(); return true }
    return false
  })
  onCleanup(() => handle.release())

  return <Pane focused={handle.isFocused()}>{/* ... */}</Pane>
}

// App root keyboard
const handler = composeKeymap([
  ring.layer,
  {
    handler: (e) => {
      if (matchKey(e, { name: "tab" })) { ring.next(); return true }
      if (matchKey(e, { name: "tab", shift: true })) { ring.prev(); return true }
      return false
    },
  },
])
useKeyboard(handler)
```

---

## Command palette

```tsx
import { useKeyboard } from "@opentui/solid"
import { createPicker } from "@ahokinson/press/models"
import { composeKeymap, matchKey, handleTextInput } from "@ahokinson/press/keyboard"
import { Picker } from "@ahokinson/press/components"

const picker = createPicker({
  items: () => commands,
  shape: (cmd) => ({ id: cmd.id, label: cmd.name, hint: cmd.shortcut }),
  onAccept: (cmd) => { cmd.run() },
})

const handler = composeKeymap([
  {
    active: () => picker.isOpen(),
    handler: (e) => {
      if (matchKey(e, { name: "return" })) { picker.accept(); return true }
      if (matchKey(e, { name: "escape" })) { picker.close(); return true }
      if (matchKey(e, { name: "up" }))    { picker.move(-1); return true }
      if (matchKey(e, { name: "down" }))  { picker.move(1);  return true }
      return handleTextInput((f) => picker.setQuery(f(picker.query())), e)
    },
  },
  {
    handler: (e) => {
      if (matchKey(e, { name: "p", ctrl: true })) { picker.open(); return true }
      return false
    },
  },
])
useKeyboard(handler)

// In JSX:
<Picker state={picker} title="Commands" />
```

---

## Confirm before destructive action

```tsx
import { useKeyboard } from "@opentui/solid"
import { createConfirmState } from "@ahokinson/press/models"
import { composeKeymap, matchKey } from "@ahokinson/press/keyboard"
import { ConfirmDialog } from "@ahokinson/press/components"

const confirm = createConfirmState()

const handler = composeKeymap([
  {
    active: () => confirm.dialogAction() !== null,
    handler: (e) => {
      if (matchKey(e, { name: "return" })) { confirm.execute(); return true }
      if (matchKey(e, { name: "escape" })) { confirm.cancel(); return true }
      return false
    },
  },
  {
    handler: (e) => {
      if (matchKey(e, { name: "d" })) {
        confirm.request({
          message: `Delete "${item().name}"?`,
          destructive: true,
          onConfirm: () => deleteItem(item().id),
        })
        return true
      }
      return false
    },
  },
])
useKeyboard(handler)

// ConfirmDialog is inline — it flows with the layout, not absolute
<ConfirmDialog action={confirm.dialogAction} />
```

---

## Status bar with transient messages

```tsx
import { createStatusState, composeTrailing } from "@ahokinson/press/models"
import { bindingHints } from "@ahokinson/press/keyboard"
import { StatusBar } from "@ahokinson/press/components"

const status = createStatusState()

async function save() {
  status.busy.showReason("Saving…")
  try {
    await writeFile(path, content)
    status.showMessage("Saved")
  } catch (e) {
    status.showMessage(`Error: ${String(e)}`)
  } finally {
    status.busy.clear()
  }
}

// In JSX:
<StatusBar
  hints={bindingHints(bindings)}
  trailing={composeTrailing(status, () => `${list.positionLabel()}`)}
  busy={status.busy.active}
/>
```

---

## Help overlay

```tsx
import { useKeyboard } from "@opentui/solid"
import { createSignal } from "solid-js"
import { dispatchBindings, bindingHints } from "@ahokinson/press/keyboard"
import { HelpOverlay, StatusBar } from "@ahokinson/press/components"

const [showHelp, setShowHelp] = createSignal(false)

const bindings = [
  {
    match: { name: "j" },
    hint: { key: "j", action: "Down" },
    group: "Navigation",
    run: () => list.next(),
  },
  {
    match: { name: "k" },
    hint: { key: "k", action: "Up" },
    group: "Navigation",
    run: () => list.prev(),
  },
  {
    match: { name: "?" },
    hint: { key: "?", action: "Help" },
    run: () => setShowHelp(true),
  },
  {
    match: { name: "escape" },
    run: () => setShowHelp(false),
  },
]

const handler = dispatchBindings(() => bindings, () => process.exit(0))
useKeyboard(handler)

// In JSX:
<StatusBar hints={bindingHints(bindings)} />
<HelpOverlay when={showHelp} bindings={() => bindings} />
```

`HelpOverlay` takes a `bindings` accessor and calls `bindingCheatsheet` internally. Bindings without a `hint` (like the `escape` dismiss) are excluded from the overlay automatically. Give bindings a `group` string to cluster them into sections; those without a `group` appear under the default label. `dispatchBindings` is a flat alternative to `composeKeymap` — both work here.

---

## Responsive layout

```tsx
import { useKeyboard } from "@opentui/solid"
import { createSignal } from "solid-js"
import { For, Show } from "solid-js"
import { createResponsiveRouter } from "@ahokinson/press/terminal"
import { Pane, Modal } from "@ahokinson/press/components"
import { composeKeymap, matchKey } from "@ahokinson/press/keyboard"

type Mode = "narrow" | "standard" | "wide"

const router = createResponsiveRouter<Mode>({
  breakpoints: [
    { minWidth: 0,   mode: "narrow" },
    { minWidth: 80,  mode: "standard" },
    { minWidth: 140, mode: "wide" },
  ],
  routes: {
    narrow:   { mode: "narrow",   panes: [{ key: "list", flex: 1 }] },
    standard: { mode: "standard", panes: [{ key: "list", flex: 65 }, { key: "detail", flex: 35 }] },
    wide:     { mode: "wide",     panes: [{ key: "list", flex: 55 }, { key: "detail", flex: 45 }] },
  },
})

const [detailOpen, setDetailOpen] = createSignal(false)

// In JSX:
<box flexDirection="row">
  <Pane flexGrow={router.paneByKey("list")?.flex ?? 1}>
    <ListPane />
  </Pane>
  <Show when={!router.isOverlay("detail")}>
    <Pane flexGrow={router.paneByKey("detail")?.flex ?? 35}>
      <DetailPane />
    </Pane>
  </Show>
</box>

<Modal when={() => router.isOverlay("detail") && detailOpen()}>
  <DetailPane />
</Modal>
```

`minWidth: 0` is required as the catch-all breakpoint. `isOverlay(key)` returns `true` when the key is declared in some route but absent from the active mode — use it to switch between inline and `Modal` rendering. `paneByKey` returns `undefined` when collapsed; guard before reading `flex`. All router methods are reactive on terminal resize.

`createTerminalHandover` is separate: use it to suspend the renderer while shelling out to `$EDITOR` or a pager, not for layout switching.

---

## Tabbed layout

```tsx
import { createSignal } from "solid-js"
import { createCycler } from "@ahokinson/press/signals"
import { Tabs } from "@ahokinson/press/components"

const TABS = [
  { key: "items", label: "Items" },
  { key: "settings", label: "Settings" },
] as const

const [activeTab, setActiveTab] = createSignal<string>("items")
const cycleTab = createCycler(TABS.map(t => t.key), activeTab, setActiveTab)

// Keyboard: matchKey(e, { name: "t" }) → cycleTab()

<Tabs tabs={() => TABS} active={activeTab} onActivate={setActiveTab}>
  <Switch>
    <Match when={activeTab() === "items"}><ItemsPane /></Match>
    <Match when={activeTab() === "settings"}><SettingsPane /></Match>
  </Switch>
</Tabs>
```

---

## Wizard form

```tsx
import { useKeyboard } from "@opentui/solid"
import { createWizard, createFieldState, createValidator, nonEmpty } from "@ahokinson/press/models"
import { composeKeymap, matchKey, handleTextInput } from "@ahokinson/press/keyboard"
import { WizardRail, Field } from "@ahokinson/press/components"

enum Step { Name = "name", Options = "options", Review = "review" }

const wizard = createWizard(Object.values(Step))
const nameField = createFieldState({ initial: "", validate: createValidator([nonEmpty()]) })

const handler = composeKeymap([{
  handler: (e) => {
    if (matchKey(e, { name: "return" }) && !wizard.isLast()) {
      nameField.markTouched()
      if (nameField.valid()) { wizard.next(); return true }
    }
    if (matchKey(e, { name: "escape" }) && !wizard.isFirst()) { wizard.prev(); return true }
    return handleTextInput((f) => nameField.set(f(nameField.value())), e)
  },
}])
useKeyboard(handler)

// In JSX:
<WizardRail steps={[{ key: Step.Name, label: "Name" }, ...]} current={wizard.step} />
<Switch>
  <Match when={wizard.step() === Step.Name}>
    <Field label="Name" value={nameField.value} error={nameField.error} focused />
  </Match>
</Switch>
```

---

## Tree navigation

```tsx
import { useKeyboard } from "@opentui/solid"
import { createTreeState } from "@ahokinson/press/models"
import { composeKeymap, matchKey } from "@ahokinson/press/keyboard"
import { Tree } from "@ahokinson/press/components"
import { useTheme } from "@ahokinson/press/theme"

const tree = createTreeState(() => rootNodes, { initialExpanded: ["root"] })

const handler = composeKeymap([{
  handler: (e) => {
    if (matchKey(e, { name: "j" })) { tree.focusNext(); return true }
    if (matchKey(e, { name: "k" })) { tree.focusPrev(); return true }
    if (matchKey(e, { name: "return" })) {
      const row = tree.visible()[tree.cursor()]
      if (row?.hasChildren) { tree.toggle(row.node.id); return true }
    }
    return false
  },
}])
useKeyboard(handler)

<Tree state={tree} render={({ row, isCursor }) => {
  const theme = useTheme()
  return <text fg={isCursor ? theme.text : theme.subtext}>{row.node.data.name}</text>
}} />
```

---

## Screen stack

```tsx
import { createScreenStack } from "@ahokinson/press/terminal"

type Screen = { kind: "list" } | { kind: "detail"; id: string }

const screens = createScreenStack<Screen>({ kind: "list" })

// Navigate in
screens.push({ kind: "detail", id: selectedId() })

// Navigate back
screens.pop()

// Render
<Switch>
  <Match when={screens.top().kind === "list"}><ListScreen /></Match>
  <Match when={screens.top().kind === "detail"}>
    {() => <DetailScreen id={(screens.top() as { kind: "detail"; id: string }).id} />}
  </Match>
</Switch>
```

---

## Common mistakes

| Mistake | Correct |
|---|---|
| Creating a model inside a component | Create at app root or parent scope, pass as props |
| `cursor()` for scroll sync with sections | Use `state.scrollRow()` |
| `filteredItems()` for rendering | Use `visibleItems()` |
| Forgetting `onMount(() => loader.load())` | Always call `load()` — loaders start idle |
| `<AsyncView>{<List />}</AsyncView>` | `<AsyncView>{(data) => <List />}</AsyncView>` |
| `matchKey(e, { name: "enter" })` | `matchKey(e, { name: "return" })` |
| `matchKey(e, { name: "esc" })` | `matchKey(e, { name: "escape" })` |
| Absolute `ConfirmDialog` | `ConfirmDialog` is inline; use `Modal` for absolute |
| Missing `onCleanup(() => handle.release())` | Always release focus ring handles in components |
