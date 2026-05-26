import { describe, expect, test } from "bun:test"
import { composeKeymap, type KeyEvent } from "@keyboard"
import { createFocusRing } from "@models/focus/ring.ts"
import { createRoot } from "solid-js"

describe("createFocusRing", () => {
  test("starts with no focus and no ids", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      expect(ring.focused()).toBeNull()
      expect(ring.ids()).toEqual([])
      dispose()
    })
  })

  test("register adds to ids in insertion order", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      ring.register("a")
      ring.register("b")
      ring.register("c")
      expect(ring.ids()).toEqual(["a", "b", "c"])
      dispose()
    })
  })

  test("focus on a registered id sets focused", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      const handle = ring.register("a")
      ring.focus("a")
      expect(ring.focused()).toBe("a")
      expect(handle.isFocused()).toBe(true)
      dispose()
    })
  })

  test("focus on an unregistered id is a no-op", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      ring.focus("missing")
      expect(ring.focused()).toBeNull()
      dispose()
    })
  })

  test("next from blurred state focuses the first id", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      ring.register("a")
      ring.register("b")
      ring.next()
      expect(ring.focused()).toBe("a")
      dispose()
    })
  })

  test("prev from blurred state focuses the last id", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      ring.register("a")
      ring.register("b")
      ring.prev()
      expect(ring.focused()).toBe("b")
      dispose()
    })
  })

  test("next wraps past the end when wrap is true", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      ring.register("a")
      ring.register("b")
      ring.focus("b")
      ring.next()
      expect(ring.focused()).toBe("a")
      dispose()
    })
  })

  test("next clamps when wrap is false", () => {
    createRoot((dispose) => {
      const ring = createFocusRing({ wrap: false })
      ring.register("a")
      ring.register("b")
      ring.focus("b")
      ring.next()
      expect(ring.focused()).toBe("b")
      dispose()
    })
  })

  test("prev clamps to the first when wrap is false", () => {
    createRoot((dispose) => {
      const ring = createFocusRing({ wrap: false })
      ring.register("a")
      ring.register("b")
      ring.focus("a")
      ring.prev()
      expect(ring.focused()).toBe("a")
      dispose()
    })
  })

  test("blur clears focus", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      ring.register("a")
      ring.focus("a")
      ring.blur()
      expect(ring.focused()).toBeNull()
      dispose()
    })
  })

  test("release removes the id and clears focus if it was active", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      const handle = ring.register("a")
      ring.register("b")
      ring.focus("a")
      handle.release()
      expect(ring.ids()).toEqual(["b"])
      expect(ring.focused()).toBeNull()
      dispose()
    })
  })

  test("release called twice is a no-op the second time", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      const handle = ring.register("a")
      handle.release()
      handle.release()
      expect(ring.ids()).toEqual([])
      dispose()
    })
  })

  test("release does not clear focus for a different focusable", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      const handle = ring.register("a")
      ring.register("b")
      ring.focus("b")
      handle.release()
      expect(ring.focused()).toBe("b")
      dispose()
    })
  })

  test("handle.blur only blurs when this focusable holds focus", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      const handleA = ring.register("a")
      const handleB = ring.register("b")
      ring.focus("b")
      handleA.blur()
      expect(ring.focused()).toBe("b")
      handleB.blur()
      expect(ring.focused()).toBeNull()
      dispose()
    })
  })

  test("re-registering an id updates the handler in place", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      let calls = 0
      ring.register("a", () => {
        calls = -1
        return true
      })
      ring.register("a", () => {
        calls += 1
        return true
      })
      ring.focus("a")
      ring.layer.handler({ name: "x" })
      expect(calls).toBe(1)
      dispose()
    })
  })

  test("layer is inactive when nothing is focused", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      ring.register("a", () => true)
      expect(ring.layer.active?.()).toBe(false)
      dispose()
    })
  })

  test("layer is inactive when focused focusable has no handler", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      ring.register("a")
      ring.focus("a")
      expect(ring.layer.active?.()).toBe(false)
      dispose()
    })
  })

  test("layer routes key events to the focused focusable's handler", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      const seen: KeyEvent[] = []
      ring.register("a", (event) => {
        seen.push(event)
        return true
      })
      ring.register("b", () => false)
      ring.focus("a")
      expect(ring.layer.active?.()).toBe(true)
      const consumed = ring.layer.handler({ name: "x" })
      expect(consumed).toBe(true)
      expect(seen).toEqual([{ name: "x" }])
      dispose()
    })
  })

  test("layer composes with composeKeymap and short-circuits other layers", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      let aSaw = 0
      let fallbackSaw = 0
      ring.register("a", () => {
        aSaw += 1
        return true
      })
      const dispatch = composeKeymap([
        ring.layer,
        {
          handler: () => {
            fallbackSaw += 1
          },
        },
      ])
      ring.focus("a")
      dispatch({ name: "x" })
      expect(aSaw).toBe(1)
      expect(fallbackSaw).toBe(0)
      ring.blur()
      dispatch({ name: "x" })
      expect(fallbackSaw).toBe(1)
      dispose()
    })
  })

  test("layer handler returning false lets composeKeymap fall through", () => {
    createRoot((dispose) => {
      const ring = createFocusRing()
      let fallbackSaw = 0
      ring.register("a", () => false)
      const dispatch = composeKeymap([
        ring.layer,
        {
          handler: () => {
            fallbackSaw += 1
          },
        },
      ])
      ring.focus("a")
      dispatch({ name: "x" })
      expect(fallbackSaw).toBe(1)
      dispose()
    })
  })
})
