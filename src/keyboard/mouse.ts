import type { MouseEvent } from "@opentui/core"
import { createSignal } from "solid-js"

/**
 * The subset of `MouseEvent` press primitives need. Aliased so opentui's
 * concrete `MouseEvent` and any compatible test double both fit.
 */
export interface MouseEventLike {
  x: number
  y: number
  button: number
  modifiers: { shift: boolean; alt: boolean; ctrl: boolean }
  isDragging?: boolean
}

/**
 * Mouse handlers spreadable onto an opentui `<box>`. Mirrors opentui's
 * `Renderable` props. Every field is optional so partial sets can be merged.
 */
export interface MouseHandlers {
  onMouseDown?: (event: MouseEvent) => void
  onMouseUp?: (event: MouseEvent) => void
  onMouseMove?: (event: MouseEvent) => void
  onMouseDrag?: (event: MouseEvent) => void
  onMouseDragEnd?: (event: MouseEvent) => void
  onMouseOver?: (event: MouseEvent) => void
  onMouseOut?: (event: MouseEvent) => void
}

export interface Hover {
  /** `true` between the most recent `onMouseOver` and `onMouseOut`. */
  hovered: () => boolean
  /** Spread onto an opentui `<box>` to wire the hover state. */
  handlers: MouseHandlers
}

/**
 * Track whether the cursor is over an element. Wraps opentui's `onMouseOver`
 * / `onMouseOut` into a reactive boolean accessor.
 *
 *   const { hovered, handlers } = createHover()
 *   <box bg={hovered() ? theme.backgroundSelection : theme.background} {...handlers}>…</box>
 */
export function createHover(): Hover {
  const [hovered, setHovered] = createSignal(false)
  return {
    hovered,
    handlers: {
      onMouseOver: () => setHovered(true),
      onMouseOut: () => setHovered(false),
    },
  }
}

/** Axis a `createDragHandle` tracks deltas along. */
export enum DragAxis {
  X = "x",
  Y = "y",
}

export interface DragHandleOptions {
  /**
   * Called once per `onMouseDrag` event with the pixel delta since the
   * previous drag (or since `onMouseDown` for the first). Positive deltas
   * move right/down, negative left/up.
   */
  onDrag: (delta: number) => void
  /** Which axis the handle tracks. Default `DragAxis.Y`. */
  axis?: DragAxis
  /** Optional callbacks for the start / end of a drag gesture. */
  onStart?: (event: MouseEvent) => void
  onEnd?: (event: MouseEvent) => void
}

export interface DragHandle {
  /** `true` from `onMouseDown` until `onMouseDragEnd`. */
  dragging: () => boolean
  /** Spread onto an opentui `<box>` (typically a scrollbar thumb or splitter). */
  handlers: MouseHandlers
}

/**
 * Scrollbar / splitter drag handle over opentui's drag events. Each
 * `onMouseDrag` emits the delta since the previous drag along the chosen
 * axis. The caller can do `scrollOffset += delta` without tracking the
 * anchor point.
 *
 *   const drag = createDragHandle({ onDrag: (delta) => scroll(delta), axis: "y" })
 *   <box width={1} height={5} bg={drag.dragging() ? "…" : "…"} {...drag.handlers} />
 *
 * If opentui cancels a drag mid-gesture, `onMouseDragEnd` still fires.
 * `dragging()` is guaranteed to return to `false`.
 */
export function createDragHandle(options: DragHandleOptions): DragHandle {
  const axis = options.axis ?? DragAxis.Y
  const [dragging, setDragging] = createSignal(false)
  let lastPosition = 0

  return {
    dragging,
    handlers: {
      onMouseDown: (event) => {
        setDragging(true)
        lastPosition = axis === DragAxis.Y ? event.y : event.x
        options.onStart?.(event)
      },
      onMouseDrag: (event) => {
        const position = axis === DragAxis.Y ? event.y : event.x
        const delta = position - lastPosition
        lastPosition = position
        if (delta !== 0) options.onDrag(delta)
      },
      onMouseDragEnd: (event) => {
        setDragging(false)
        options.onEnd?.(event)
      },
    },
  }
}
