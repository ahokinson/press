import { describe, expect, test } from "bun:test"
import { bindingCheatsheet, DEFAULT_CHEATSHEET_GROUP } from "@keyboard/help.ts"
import type { KeyBinding } from "@keyboard/index.ts"

function noop() {}

describe("bindingCheatsheet", () => {
  test("returns an empty list for empty input", () => {
    expect(bindingCheatsheet([])).toEqual([])
  })

  test("excludes bindings without a hint", () => {
    const bindings: KeyBinding[] = [
      { match: { name: "c", ctrl: true }, run: noop },
      { match: { name: "q" }, hint: { key: "q", action: "quit" }, run: noop },
    ]
    expect(bindingCheatsheet(bindings)).toEqual([
      { group: DEFAULT_CHEATSHEET_GROUP, entries: [{ key: "q", action: "quit" }] },
    ])
  })

  test("groups ungrouped bindings under the default bucket", () => {
    const bindings: KeyBinding[] = [
      { match: { name: "j" }, hint: { key: "j", action: "down" }, run: noop },
      { match: { name: "k" }, hint: { key: "k", action: "up" }, run: noop },
    ]
    expect(bindingCheatsheet(bindings)).toEqual([
      {
        group: DEFAULT_CHEATSHEET_GROUP,
        entries: [
          { key: "j", action: "down" },
          { key: "k", action: "up" },
        ],
      },
    ])
  })

  test("preserves first-seen group order", () => {
    const bindings: KeyBinding[] = [
      { match: { name: "s" }, hint: { key: "s", action: "save" }, group: "File", run: noop },
      { match: { name: "f" }, hint: { key: "f", action: "find" }, group: "Edit", run: noop },
      { match: { name: "o" }, hint: { key: "o", action: "open" }, group: "File", run: noop },
    ]
    const result = bindingCheatsheet(bindings)
    expect(result.map((groupRow) => groupRow.group)).toEqual(["File", "Edit"])
  })

  test("preserves declaration order within a group", () => {
    const bindings: KeyBinding[] = [
      { match: { name: "s" }, hint: { key: "s", action: "save" }, group: "File", run: noop },
      { match: { name: "o" }, hint: { key: "o", action: "open" }, group: "File", run: noop },
      { match: { name: "n" }, hint: { key: "n", action: "new" }, group: "File", run: noop },
    ]
    const result = bindingCheatsheet(bindings)
    expect(result).toEqual([
      {
        group: "File",
        entries: [
          { key: "s", action: "save" },
          { key: "o", action: "open" },
          { key: "n", action: "new" },
        ],
      },
    ])
  })

  test("mixes grouped and ungrouped bindings, default bucket appears at first ungrouped binding", () => {
    const bindings: KeyBinding[] = [
      { match: { name: "s" }, hint: { key: "s", action: "save" }, group: "File", run: noop },
      { match: { name: "q" }, hint: { key: "q", action: "quit" }, run: noop },
      { match: { name: "f" }, hint: { key: "f", action: "find" }, group: "Edit", run: noop },
    ]
    const result = bindingCheatsheet(bindings)
    expect(result.map((groupRow) => groupRow.group)).toEqual(["File", DEFAULT_CHEATSHEET_GROUP, "Edit"])
  })
})
