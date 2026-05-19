import type { CliRenderer } from "@opentui/core"
import { useTerminalDimensions } from "@opentui/solid"
import { createMemo } from "solid-js"

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
 * Breakpoints are evaluated from largest `minWidth` to smallest; the first
 * whose threshold the current width meets wins.
 *
 * Throws if `breakpoints` is empty, or if no breakpoint has `minWidth <= 0`.
 * A catch-all is required so the result is always defined regardless of how
 * narrow the terminal becomes — otherwise a 60-col window with breakpoints
 * `[{minWidth:80},{minWidth:120}]` would have no honest answer.
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
    for (const bp of sorted) {
      if (width >= bp.minWidth) return bp.mode
    }
    return smallest.mode
  })
}

/**
 * Build a function that suspends the opentui renderer, runs `fn`, then resumes.
 * Use it to hand the terminal to a subprocess (editor, pager, shell command)
 * and pick up rendering where you left off.
 *
 * Re-entrant: nested calls share a single suspend/resume cycle anchored on the
 * outermost call. Two concurrent (non-nested) calls still serialize through a
 * promise chain to avoid interleaving suspend/resume of the same renderer.
 */
export function createTerminalHandover(renderer: CliRenderer): TerminalHandover {
  let depth = 0
  let chain: Promise<unknown> = Promise.resolve()

  return <T>(fn: () => Promise<T>): Promise<T> => {
    // Re-entrant call (we're inside an outer fn already): skip the chain —
    // queueing behind the still-pending outer would deadlock. The outermost
    // call owns the suspend/resume.
    if (depth > 0) {
      depth++
      return (async () => {
        try {
          return await fn()
        } finally {
          depth--
        }
      })()
    }
    const run = async (): Promise<T> => {
      depth++
      renderer.suspend()
      try {
        return await fn()
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
