import type { CliRenderer } from "@opentui/core"
import { useTerminalDimensions } from "@opentui/solid"
import { createMemo } from "solid-js"

export { AUTO, type Auto, type Dimension, type DimensionFixed } from "@terminal/dimension.ts"
export {
  createResponsiveRouter,
  type LayoutPane,
  type PaneRoute,
  type ResponsiveRouter,
  type ResponsiveRouterOptions,
} from "@terminal/router.ts"
export { createScreenStack, type ScreenStack } from "@terminal/screen.ts"

export type TerminalHandover = <T>(fn: () => Promise<T>) => Promise<T>

export interface Breakpoint<TMode extends string> {
  /** Inclusive lower bound on terminal width (columns) for this mode. */
  minWidth: number
  mode: TMode
}

/**
 * Breakpoint hook over `useTerminalDimensions`. Returns the active mode label
 * as a reactive accessor.
 *
 * Breakpoints are evaluated from largest `minWidth` to smallest. The first
 * threshold the current width meets wins.
 *
 * Throws if `breakpoints` is empty or has no `minWidth <= 0` entry. The
 * catch-all guarantees an answer at any width.
 */
export function useResponsiveLayout<TMode extends string>(breakpoints: readonly Breakpoint<TMode>[]): () => TMode {
  if (breakpoints.length === 0) {
    throw new Error("useResponsiveLayout: breakpoints array must not be empty")
  }
  const sorted = [...breakpoints].sort((a, b) => b.minWidth - a.minWidth)
  const smallest = sorted[sorted.length - 1]!
  if (smallest.minWidth > 0) {
    throw new Error(
      `useResponsiveLayout: missing catch-all breakpoint. Add an entry with minWidth: 0 (smallest is ${smallest.minWidth}).`,
    )
  }
  const dimensions = useTerminalDimensions()
  return createMemo<TMode>(() => {
    const width = dimensions().width
    for (const breakpoint of sorted) {
      if (width >= breakpoint.minWidth) return breakpoint.mode
    }
    return smallest.mode
  })
}

/**
 * Build a function that suspends the opentui renderer, runs the callback,
 * then resumes. For handing the terminal to a subprocess (editor, pager,
 * shell command).
 *
 * Re-entrant: nested calls share the outermost call's suspend/resume cycle.
 * Concurrent (non-nested) calls serialize through a promise chain so the
 * renderer can't be suspended twice in parallel.
 */
export function createTerminalHandover(renderer: CliRenderer): TerminalHandover {
  let depth = 0
  let chain: Promise<unknown> = Promise.resolve()

  return <T>(callback: () => Promise<T>): Promise<T> => {
    // Inside an outer callback. Skip the chain: queueing behind the
    // still-pending outer would deadlock. The outermost call owns
    // suspend/resume.
    if (depth > 0) {
      depth++
      return (async () => {
        try {
          return await callback()
        } finally {
          depth--
        }
      })()
    }
    const run = async (): Promise<T> => {
      depth++
      renderer.suspend()
      try {
        return await callback()
      } finally {
        depth--
        renderer.resume()
      }
    }
    const next = chain.then(run, run)
    chain = next.catch(() => undefined)
    return next
  }
}
