import { describe, expect, test } from "bun:test"
import { createPicker, type Pickable } from "@models/picker/state.ts"
import { createRoot, createSignal } from "solid-js"

interface Command {
  id: string
  label: string
  keywords?: readonly string[]
  hint?: string
  // biome-ignore lint/suspicious/noConfusingVoidType: mirrors PickerConfig.onAccept
  run: () => void | boolean | Promise<undefined | boolean>
}

function defaultShape(command: Command): Pickable {
  return { id: command.id, label: command.label, keywords: command.keywords, hint: command.hint }
}

function commandsFor(...labels: string[]): Command[] {
  return labels.map((label, index) => ({ id: `${index}-${label}`, label, run: () => {} }))
}

describe("createPicker", () => {
  test("isOpen starts false; open/close/toggle flip it", () => {
    createRoot(() => {
      const picker = createPicker<Command>({
        items: () => commandsFor("a"),
        shape: defaultShape,
        onAccept: () => {},
      })
      expect(picker.isOpen()).toBe(false)
      picker.open()
      expect(picker.isOpen()).toBe(true)
      picker.close()
      expect(picker.isOpen()).toBe(false)
      picker.toggle()
      expect(picker.isOpen()).toBe(true)
      picker.toggle()
      expect(picker.isOpen()).toBe(false)
    })
  })

  test("open() clears any previous query", () => {
    createRoot(() => {
      const picker = createPicker<Command>({
        items: () => commandsFor("save"),
        shape: defaultShape,
        onAccept: () => {},
      })
      picker.open()
      picker.setQuery("xyz")
      picker.close()
      picker.open()
      expect(picker.query()).toBe("")
    })
  })

  test("empty query shows every item in declaration order", () => {
    createRoot(() => {
      const items = commandsFor("alpha", "bravo", "charlie")
      const picker = createPicker<Command>({
        items: () => items,
        shape: defaultShape,
        onAccept: () => {},
      })
      expect(picker.visible().map((command) => command.label)).toEqual(["alpha", "bravo", "charlie"])
    })
  })

  test("query filters and ranks via the shape projection", () => {
    createRoot(() => {
      const items: Command[] = [
        { id: "a", label: "Persist file", keywords: ["save"], run: () => {} },
        { id: "b", label: "save", run: () => {} },
        { id: "c", label: "unsaved buffer", run: () => {} },
        { id: "d", label: "Quit", run: () => {} },
      ]
      const picker = createPicker<Command>({
        items: () => items,
        shape: defaultShape,
        onAccept: () => {},
      })
      picker.setQuery("save")
      const labels = picker.visible().map((command) => command.label)
      // "save" (label prefix) > "unsaved buffer" (label infix) > "Persist file" (keyword prefix). "Quit" excluded.
      expect(labels).toEqual(["save", "unsaved buffer", "Persist file"])
    })
  })

  test("dedupe-by-id: later occurrence wins and inherits the later declaration order", () => {
    createRoot(() => {
      const items: Command[] = [
        { id: "save", label: "Save (global)", run: () => {} },
        { id: "other", label: "Other", run: () => {} },
        { id: "save", label: "Save (screen)", run: () => {} },
      ]
      const picker = createPicker<Command>({
        items: () => items,
        shape: defaultShape,
        onAccept: () => {},
      })
      expect(picker.visible().map((command) => command.label)).toEqual(["Other", "Save (screen)"])
    })
  })

  test("setQuery resets cursor to 0", () => {
    createRoot(() => {
      const picker = createPicker<Command>({
        items: () => commandsFor("alpha", "bravo", "charlie"),
        shape: defaultShape,
        onAccept: () => {},
      })
      picker.move(2)
      expect(picker.cursor()).toBe(2)
      picker.setQuery("a")
      expect(picker.cursor()).toBe(0)
    })
  })

  test("cursor clamps when the visible list narrows", () => {
    createRoot(() => {
      const [items, setItems] = createSignal<Command[]>(commandsFor("alpha", "bravo", "charlie"))
      const picker = createPicker<Command>({
        items: items,
        shape: defaultShape,
        onAccept: () => {},
      })
      picker.move(2)
      expect(picker.cursor()).toBe(2)
      setItems(commandsFor("alpha"))
      expect(picker.cursor()).toBe(0)
    })
  })

  test("active() is undefined and accept() is a no-op when visible is empty", async () => {
    let ran = false
    await createRoot(async () => {
      const picker = createPicker<Command>({
        items: () => [],
        shape: defaultShape,
        onAccept: () => {
          ran = true
        },
      })
      expect(picker.active()).toBeUndefined()
      await picker.accept()
      expect(ran).toBe(false)
    })
  })

  test("accept() runs onAccept on the active item, closes the picker, clears the query", async () => {
    let accepted: string | null = null
    await createRoot(async () => {
      const picker = createPicker<Command>({
        items: () => commandsFor("alpha", "bravo"),
        shape: defaultShape,
        onAccept: (command) => {
          accepted = command.label
        },
      })
      picker.open()
      picker.setQuery("b")
      await picker.accept()
      expect(accepted).toBe("bravo")
      expect(picker.isOpen()).toBe(false)
    })
  })

  test("accept() with onAccept returning false keeps the picker open and clears the query", async () => {
    await createRoot(async () => {
      const picker = createPicker<Command>({
        items: () => commandsFor("alpha"),
        shape: defaultShape,
        onAccept: () => false,
      })
      picker.open()
      picker.setQuery("alp")
      await picker.accept()
      expect(picker.isOpen()).toBe(true)
      expect(picker.query()).toBe("")
    })
  })

  test("accept() with onAccept returning a Promise closes synchronously and does not await", async () => {
    let resolveSlow: () => void = () => {}
    let resolved = false
    const slow = new Promise<undefined>((resolve) => {
      resolveSlow = () => {
        resolved = true
        resolve(undefined)
      }
    })
    await createRoot(async () => {
      const picker = createPicker<Command>({
        items: () => commandsFor("alpha"),
        shape: defaultShape,
        onAccept: () => slow,
      })
      picker.open()
      const accepted = picker.accept()
      // Close happens synchronously, before any await.
      expect(picker.isOpen()).toBe(false)
      // accept() itself resolves without waiting on the slow promise.
      await accepted
      expect(resolved).toBe(false)
      // Now let the user's promise complete so the test doesn't leak.
      resolveSlow()
      await slow
    })
  })

  test("accept() rethrows when onAccept throws synchronously; picker still closes", async () => {
    await createRoot(async () => {
      const picker = createPicker<Command>({
        items: () => commandsFor("alpha"),
        shape: defaultShape,
        onAccept: () => {
          throw new Error("boom")
        },
      })
      picker.open()
      await expect(picker.accept()).rejects.toThrow("boom")
      // close happens synchronously in the try/catch path
      expect(picker.isOpen()).toBe(false)
    })
  })

  test("shapeOf is memoized: re-querying does not re-invoke config.shape", () => {
    createRoot(() => {
      let invocations = 0
      const items = commandsFor("alpha", "bravo", "charlie")
      const picker = createPicker<Command>({
        items: () => items,
        shape: (command) => {
          invocations++
          return defaultShape(command)
        },
        onAccept: () => {},
      })
      // Force projection and read shapes.
      picker.visible()
      const baseline = invocations
      picker.setQuery("a")
      picker.visible()
      picker.setQuery("b")
      picker.visible()
      expect(invocations).toBe(baseline)
      const firstItem = items[0]!
      picker.shapeOf(firstItem)
      picker.shapeOf(firstItem)
      expect(invocations).toBe(baseline)
    })
  })

  test("move clamps via the navigation cursor", () => {
    createRoot(() => {
      const picker = createPicker<Command>({
        items: () => commandsFor("alpha", "bravo"),
        shape: defaultShape,
        onAccept: () => {},
      })
      picker.move(-5)
      expect(picker.cursor()).toBe(0)
      picker.move(50)
      expect(picker.cursor()).toBe(1)
    })
  })
})
