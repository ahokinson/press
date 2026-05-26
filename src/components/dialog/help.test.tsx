import { describe, expect, test } from "bun:test"
import { HelpOverlay } from "@components/dialog/help.tsx"
import type { KeyBinding } from "@keyboard"
import { testRender } from "@opentui/solid"

function noop() {}

describe("HelpOverlay", () => {
  test("renders nothing while when() is false", async () => {
    const bindings: KeyBinding[] = [{ match: { name: "q" }, hint: { key: "q", action: "quit" }, run: noop }]
    const { captureCharFrame, renderOnce } = await testRender(
      () => <HelpOverlay when={() => false} bindings={() => bindings} />,
      { width: 60, height: 20 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).not.toContain("quit")
  })

  test("renders the default title when none is supplied", async () => {
    const bindings: KeyBinding[] = [{ match: { name: "q" }, hint: { key: "q", action: "quit" }, run: noop }]
    const { captureCharFrame, renderOnce } = await testRender(
      () => <HelpOverlay when={() => true} bindings={() => bindings} />,
      { width: 60, height: 20 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("Help")
  })

  test("renders one section per group with entries in declaration order", async () => {
    const bindings: KeyBinding[] = [
      { match: { name: "s" }, hint: { key: "s", action: "save" }, group: "File", run: noop },
      { match: { name: "o" }, hint: { key: "o", action: "open" }, group: "File", run: noop },
      { match: { name: "f" }, hint: { key: "f", action: "find" }, group: "Edit", run: noop },
    ]
    const { captureCharFrame, renderOnce } = await testRender(
      () => <HelpOverlay when={() => true} bindings={() => bindings} title="Keys" />,
      { width: 70, height: 24 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("File")
    expect(frame).toContain("Edit")
    expect(frame).toContain("save")
    expect(frame).toContain("open")
    expect(frame).toContain("find")
    // File group appears before Edit group in the rendered output
    expect(frame.indexOf("File")).toBeLessThan(frame.indexOf("Edit"))
    // Within the File group, save is declared before open
    expect(frame.indexOf("save")).toBeLessThan(frame.indexOf("open"))
  })

  test("excludes bindings without a hint", async () => {
    const bindings: KeyBinding[] = [
      { match: { name: "c", ctrl: true }, run: noop },
      { match: { name: "q" }, hint: { key: "q", action: "quit" }, run: noop },
    ]
    const { captureCharFrame, renderOnce } = await testRender(
      () => <HelpOverlay when={() => true} bindings={() => bindings} />,
      { width: 60, height: 20 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("quit")
    // No "Ctrl-C" hint surfaces since the binding had no hint at all
    expect(frame).not.toContain("Ctrl")
  })
})
