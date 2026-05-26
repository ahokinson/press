import { type Breakpoint, useResponsiveLayout } from "@terminal/index.ts"
import { createMemo } from "solid-js"

/**
 * One pane in a responsive layout. `flex` maps to opentui's `flexGrow`.
 * `minWidth` is enforced by the renderer's layout when set.
 */
export interface LayoutPane {
  key: string
  flex: number
  minWidth?: number
}

/**
 * Layout for a single responsive mode. `panes` is the inline arrangement.
 * Any pane key declared in another mode but missing from this one is
 * collapsed. Render collapsed keys as overlays or modals.
 */
export interface PaneRoute<TMode extends string> {
  mode: TMode
  panes: ReadonlyArray<LayoutPane>
}

export interface ResponsiveRouterOptions<TMode extends string> {
  breakpoints: readonly Breakpoint<TMode>[]
  routes: Record<TMode, PaneRoute<TMode>>
}

export interface ResponsiveRouter<TMode extends string> {
  /** Active mode label, driven by terminal width. */
  mode: () => TMode
  /** Inline panes at the active mode, in declared order. */
  panes: () => ReadonlyArray<LayoutPane>
  /** Look up a pane by key in the active mode. `undefined` when collapsed. */
  paneByKey: (key: string) => LayoutPane | undefined
  /**
   * `true` when `key` is declared in some other mode's `panes` but not the
   * active one. Branch on this to render a pane inline vs. as an overlay.
   */
  isOverlay: (key: string) => boolean
}

/**
 * Drive a multi-pane layout off the terminal width. Each mode declares its
 * own pane list, and the router exposes the active arrangement as reactive
 * accessors. Throws via `useResponsiveLayout` when `breakpoints` is empty or
 * has no catch-all.
 *
 *   const router = createResponsiveRouter({
 *     breakpoints: [
 *       { minWidth: 0, mode: "narrow" },
 *       { minWidth: 80, mode: "standard" },
 *       { minWidth: 120, mode: "wide" },
 *     ],
 *     routes: {
 *       narrow:   { mode: "narrow",   panes: [{ key: "list", flex: 1 }] },
 *       standard: { mode: "standard", panes: [{ key: "list", flex: 65 }, { key: "details", flex: 35 }] },
 *       wide:     { mode: "wide",     panes: [{ key: "list", flex: 55 }, { key: "details", flex: 45 }] },
 *     },
 *   })
 */
export function createResponsiveRouter<TMode extends string>(
  options: ResponsiveRouterOptions<TMode>,
): ResponsiveRouter<TMode> {
  const mode = useResponsiveLayout(options.breakpoints)

  // Union of pane keys across every route. Lets `isOverlay` tell "collapsed
  // at this width" apart from "never declared".
  const knownKeys = new Set<string>()
  for (const route of Object.values(options.routes) as ReadonlyArray<PaneRoute<TMode>>) {
    for (const pane of route.panes) knownKeys.add(pane.key)
  }

  const panes = createMemo<ReadonlyArray<LayoutPane>>(() => options.routes[mode()].panes)
  const paneKeys = createMemo<ReadonlySet<string>>(() => new Set(panes().map((pane) => pane.key)))

  function paneByKey(key: string): LayoutPane | undefined {
    return panes().find((pane) => pane.key === key)
  }

  function isOverlay(key: string): boolean {
    return knownKeys.has(key) && !paneKeys().has(key)
  }

  return {
    mode,
    panes,
    paneByKey,
    isOverlay,
  }
}
