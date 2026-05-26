import { describe, expect, test } from "bun:test"
import { createOverlayState } from "@models/dialog/overlay.ts"

type Variant = { kind: "none" } | { kind: "menu"; items: string[] } | { kind: "modal"; title: string }

const closed: Variant = { kind: "none" }

describe("createOverlayState", () => {
  test("starts on the initial variant", () => {
    const o = createOverlayState<Variant>(closed)
    expect(o.overlay()).toEqual(closed)
  })

  test("set swaps to a new variant", () => {
    const o = createOverlayState<Variant>(closed)
    o.set({ kind: "menu", items: ["a", "b"] })
    const current = o.overlay()
    expect(current.kind).toBe("menu")
    if (current.kind === "menu") expect(current.items).toEqual(["a", "b"])
  })

  test("close restores the initial variant", () => {
    const o = createOverlayState<Variant>(closed)
    o.set({ kind: "modal", title: "hi" })
    o.close()
    expect(o.overlay()).toEqual(closed)
  })

  test("close after close is a no-op", () => {
    const o = createOverlayState<Variant>(closed)
    o.close()
    o.close()
    expect(o.overlay()).toEqual(closed)
  })
})

describe("asKind", () => {
  test("returns the value when the discriminator matches", () => {
    const o = createOverlayState<Variant>({ kind: "modal", title: "warn" })
    const m = o.asKind("modal")
    expect(m).not.toBeNull()
    expect(m?.title).toBe("warn")
  })

  test("returns null when the discriminator does not match", () => {
    const o = createOverlayState<Variant>(closed)
    expect(o.asKind("modal")).toBeNull()
    expect(o.asKind("menu")).toBeNull()
  })

  test("reflects the current variant after set", () => {
    const o = createOverlayState<Variant>(closed)
    expect(o.asKind("modal")).toBeNull()
    o.set({ kind: "modal", title: "x" })
    expect(o.asKind("modal")?.title).toBe("x")
  })
})
