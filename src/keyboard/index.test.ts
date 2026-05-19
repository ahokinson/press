import { describe, expect, test } from "bun:test"
import {
  bindingHints,
  composeKeymap,
  describeBindings,
  dispatchBindings,
  handleTextInput,
  type KeyBinding,
  matchKey,
} from "@keyboard"

describe("matchKey", () => {
  test("matches missing-spec fields as wildcards", () => {
    expect(matchKey({ name: "j" }, { name: "j" })).toBe(true)
    expect(matchKey({ name: "j" }, {})).toBe(true)
    expect(matchKey({ name: "j", ctrl: true }, { name: "j" })).toBe(true)
  })

  test("rejects when explicit spec fields differ", () => {
    expect(matchKey({ name: "j" }, { name: "k" })).toBe(false)
    expect(matchKey({ name: "j", ctrl: false }, { ctrl: true })).toBe(false)
    expect(matchKey({ sequence: "a" }, { sequence: "b" })).toBe(false)
  })
})

describe("handleTextInput", () => {
  test("backspace pops a character; printable sequence appends", () => {
    let buffer = "abc"
    const setter = (fn: (v: string) => string) => {
      buffer = fn(buffer)
    }
    expect(handleTextInput(setter, { name: "backspace" })).toBe(true)
    expect(buffer).toBe("ab")
    expect(handleTextInput(setter, { sequence: "d" })).toBe(true)
    expect(buffer).toBe("abd")
  })

  test("modified keys do not append; non-text keys return false", () => {
    let buffer = "x"
    const setter = (fn: (v: string) => string) => {
      buffer = fn(buffer)
    }
    expect(handleTextInput(setter, { sequence: "c", ctrl: true })).toBe(false)
    expect(handleTextInput(setter, { name: "return" })).toBe(false)
    expect(buffer).toBe("x")
  })
})

describe("composeKeymap", () => {
  test("dispatches to layers in order; first true consumes", () => {
    const log: string[] = []
    const dispatch = composeKeymap([
      {
        handler: (e) => {
          if (e.name === "a") {
            log.push("first")
            return true
          }
        },
      },
      {
        handler: (_e) => {
          log.push("second")
        },
      },
    ])
    dispatch({ name: "a" })
    expect(log).toEqual(["first"])
    log.length = 0
    dispatch({ name: "x" })
    expect(log).toEqual(["second"])
  })

  test("inactive layers are skipped", () => {
    const log: string[] = []
    const dispatch = composeKeymap([
      {
        active: () => false,
        handler: () => {
          log.push("first")
        },
      },
      {
        handler: () => {
          log.push("second")
        },
      },
    ])
    dispatch({ name: "a" })
    expect(log).toEqual(["second"])
  })

  test("falsy return continues to later layers", () => {
    const log: string[] = []
    const dispatch = composeKeymap([
      {
        handler: () => {
          log.push("first")
        },
      },
      {
        handler: () => {
          log.push("second")
          return true
        },
      },
      {
        handler: () => {
          log.push("third")
        },
      },
    ])
    dispatch({ name: "a" })
    expect(log).toEqual(["first", "second"])
  })

  test("empty layer list is a no-op", () => {
    const dispatch = composeKeymap([])
    expect(() => dispatch({ name: "a" })).not.toThrow()
  })
})

describe("dispatchBindings", () => {
  test("first matching binding wins; later ones ignored", () => {
    const log: string[] = []
    const bindings: KeyBinding[] = [
      { match: { name: "a" }, run: () => log.push("first") },
      { match: { name: "a" }, run: () => log.push("second") },
    ]
    const dispatch = dispatchBindings(() => bindings)
    dispatch({ name: "a" })
    expect(log).toEqual(["first"])
  })

  test("falls through when nothing matches", () => {
    const log: string[] = []
    const dispatch = dispatchBindings(() => [{ match: { name: "a" }, run: () => log.push("a") }])
    dispatch({ name: "x" })
    expect(log).toEqual([])
  })

  test("Ctrl+C invokes onQuit and short-circuits the binding list", () => {
    const log: string[] = []
    const dispatch = dispatchBindings(
      () => [{ match: { name: "c", ctrl: true }, run: () => log.push("binding") }],
      () => log.push("quit"),
    )
    dispatch({ name: "c", ctrl: true })
    expect(log).toEqual(["quit"])
  })

  test("without onQuit, Ctrl+C falls through to the binding list", () => {
    const log: string[] = []
    const dispatch = dispatchBindings(() => [{ match: { name: "c", ctrl: true }, run: () => log.push("binding") }])
    dispatch({ name: "c", ctrl: true })
    expect(log).toEqual(["binding"])
  })

  test("re-reads the accessor on every dispatch", () => {
    let bindings: KeyBinding[] = [{ match: { name: "a" }, run: () => {} }]
    const calls: string[] = []
    const dispatch = dispatchBindings(() => bindings)
    bindings = [{ match: { name: "a" }, run: () => calls.push("updated") }]
    dispatch({ name: "a" })
    expect(calls).toEqual(["updated"])
  })

  test("empty wildcard spec matches anything (sink binding)", () => {
    const log: string[] = []
    const dispatch = dispatchBindings(() => [
      { match: { name: "return" }, run: () => log.push("return") },
      { match: {}, run: (k) => log.push(`sink:${k.name ?? k.sequence ?? "?"}`) },
    ])
    dispatch({ name: "return" })
    dispatch({ sequence: "x" })
    expect(log).toEqual(["return", "sink:x"])
  })
})

describe("bindingHints", () => {
  test("filters out bindings without hints, preserves order", () => {
    const bindings: KeyBinding[] = [
      { match: { name: "a" }, hint: { key: "a", action: "alpha" }, run: () => {} },
      { match: { name: "b" }, run: () => {} },
      { match: { name: "c" }, hint: { key: "c", action: "charlie" }, run: () => {} },
    ]
    expect(bindingHints(bindings)).toEqual([
      { key: "a", action: "alpha" },
      { key: "c", action: "charlie" },
    ])
  })

  test("empty list → empty hints", () => {
    expect(bindingHints([])).toEqual([])
  })
})

describe("describeBindings", () => {
  const bindings: KeyBinding[] = [
    { match: { name: "j" }, run: () => {} },
    { match: { name: "k" }, run: () => {} },
  ]

  test("reports the index and binding of the first match", () => {
    const result = describeBindings({ name: "k" }, bindings)
    expect(result.index).toBe(1)
    expect(result.binding).toBe(bindings[1] ?? null)
    expect(result.quit).toBe(false)
  })

  test("returns null/-1 when nothing matches", () => {
    const result = describeBindings({ name: "z" }, bindings)
    expect(result.binding).toBeNull()
    expect(result.index).toBe(-1)
  })

  test("reports quit=true on Ctrl+C even alongside a binding match", () => {
    const ctrlC: KeyBinding = { match: { name: "c", ctrl: true }, run: () => {} }
    const result = describeBindings({ name: "c", ctrl: true }, [ctrlC])
    expect(result.quit).toBe(true)
    expect(result.binding).toBe(ctrlC)
  })
})
