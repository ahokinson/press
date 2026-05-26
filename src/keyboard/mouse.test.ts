import { describe, expect, test } from "bun:test"
import { createDragHandle, createHover, DragAxis } from "@keyboard/mouse.ts"
import type { MouseEvent } from "@opentui/core"
import { createRoot } from "solid-js"

// Construct just the fields the press handlers actually read. Cast to MouseEvent
// at the call site — opentui's MouseEvent is a class with private state we
// don't need to instantiate for unit tests.
function mockEvent(props: Partial<{ x: number; y: number; button: number }> = {}): MouseEvent {
  return {
    x: 0,
    y: 0,
    button: 0,
    modifiers: { shift: false, alt: false, ctrl: false },
    ...props,
  } as unknown as MouseEvent
}

describe("createHover", () => {
  test("flips on mouseOver and off on mouseOut", () => {
    createRoot((dispose) => {
      const { hovered, handlers } = createHover()
      expect(hovered()).toBe(false)
      handlers.onMouseOver?.(mockEvent())
      expect(hovered()).toBe(true)
      handlers.onMouseOut?.(mockEvent())
      expect(hovered()).toBe(false)
      dispose()
    })
  })

  test("repeated mouseOver is idempotent", () => {
    createRoot((dispose) => {
      const { hovered, handlers } = createHover()
      handlers.onMouseOver?.(mockEvent())
      handlers.onMouseOver?.(mockEvent())
      expect(hovered()).toBe(true)
      dispose()
    })
  })
})

describe("createDragHandle", () => {
  test("emits per-event delta on the y axis by default", () => {
    createRoot((dispose) => {
      const deltas: number[] = []
      const drag = createDragHandle({ onDrag: (delta) => deltas.push(delta) })
      expect(drag.dragging()).toBe(false)
      drag.handlers.onMouseDown?.(mockEvent({ y: 10 }))
      expect(drag.dragging()).toBe(true)
      drag.handlers.onMouseDrag?.(mockEvent({ y: 12 }))
      drag.handlers.onMouseDrag?.(mockEvent({ y: 15 }))
      drag.handlers.onMouseDrag?.(mockEvent({ y: 14 }))
      drag.handlers.onMouseDragEnd?.(mockEvent({ y: 14 }))
      expect(drag.dragging()).toBe(false)
      expect(deltas).toEqual([2, 3, -1])
      dispose()
    })
  })

  test("tracks the x axis when configured", () => {
    createRoot((dispose) => {
      const deltas: number[] = []
      const drag = createDragHandle({ onDrag: (delta) => deltas.push(delta), axis: DragAxis.X })
      drag.handlers.onMouseDown?.(mockEvent({ x: 5 }))
      drag.handlers.onMouseDrag?.(mockEvent({ x: 7 }))
      drag.handlers.onMouseDrag?.(mockEvent({ x: 4 }))
      expect(deltas).toEqual([2, -3])
      dispose()
    })
  })

  test("skips zero-delta drag events", () => {
    createRoot((dispose) => {
      const deltas: number[] = []
      const drag = createDragHandle({ onDrag: (delta) => deltas.push(delta) })
      drag.handlers.onMouseDown?.(mockEvent({ y: 10 }))
      drag.handlers.onMouseDrag?.(mockEvent({ y: 10 }))
      drag.handlers.onMouseDrag?.(mockEvent({ y: 11 }))
      expect(deltas).toEqual([1])
      dispose()
    })
  })

  test("fires onStart / onEnd around the gesture", () => {
    createRoot((dispose) => {
      const events: string[] = []
      const drag = createDragHandle({
        onDrag: () => {},
        onStart: () => events.push("start"),
        onEnd: () => events.push("end"),
      })
      drag.handlers.onMouseDown?.(mockEvent({ y: 0 }))
      drag.handlers.onMouseDragEnd?.(mockEvent({ y: 0 }))
      expect(events).toEqual(["start", "end"])
      dispose()
    })
  })

  test("a new gesture re-anchors from the next mouseDown", () => {
    createRoot((dispose) => {
      const deltas: number[] = []
      const drag = createDragHandle({ onDrag: (delta) => deltas.push(delta) })
      drag.handlers.onMouseDown?.(mockEvent({ y: 10 }))
      drag.handlers.onMouseDrag?.(mockEvent({ y: 13 }))
      drag.handlers.onMouseDragEnd?.(mockEvent({ y: 13 }))
      // Big jump between gestures should NOT become a delta; the next
      // mouseDown re-anchors the position.
      drag.handlers.onMouseDown?.(mockEvent({ y: 50 }))
      drag.handlers.onMouseDrag?.(mockEvent({ y: 51 }))
      expect(deltas).toEqual([3, 1])
      dispose()
    })
  })
})
