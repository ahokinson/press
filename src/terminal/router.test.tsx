import { describe, expect, test } from "bun:test"
import { testRender } from "@opentui/solid"
import { createResponsiveRouter } from "@terminal"

type Mode = "narrow" | "standard" | "wide"

const ROUTES = {
  narrow: { mode: "narrow" as Mode, panes: [{ key: "list", flex: 1 }] },
  standard: {
    mode: "standard" as Mode,
    panes: [
      { key: "list", flex: 65 },
      { key: "details", flex: 35 },
    ],
  },
  wide: {
    mode: "wide" as Mode,
    panes: [
      { key: "sidebar", flex: 20 },
      { key: "list", flex: 50 },
      { key: "details", flex: 30 },
    ],
  },
} as const

const BREAKPOINTS = [
  { minWidth: 0, mode: "narrow" as Mode },
  { minWidth: 80, mode: "standard" as Mode },
  { minWidth: 140, mode: "wide" as Mode },
]

describe("createResponsiveRouter", () => {
  test("picks the standard route at a medium width", async () => {
    let mode = ""
    let keys: string[] = []
    let overlaySidebar = true
    let overlayDetails = true
    const { renderOnce } = await testRender(
      () => {
        const router = createResponsiveRouter({ breakpoints: BREAKPOINTS, routes: ROUTES })
        mode = router.mode()
        keys = router.panes().map((pane) => pane.key)
        overlaySidebar = router.isOverlay("sidebar")
        overlayDetails = router.isOverlay("details")
        return <text>x</text>
      },
      { width: 100, height: 1 },
    )
    await renderOnce()
    expect(mode).toBe("standard")
    expect(keys).toEqual(["list", "details"])
    // sidebar only exists in wide → collapsed (overlay) at standard
    expect(overlaySidebar).toBe(true)
    // details exists in standard inline → not overlay
    expect(overlayDetails).toBe(false)
  })

  test("falls back to narrow at small widths", async () => {
    let mode = ""
    let keys: string[] = []
    let overlayDetails = false
    const { renderOnce } = await testRender(
      () => {
        const router = createResponsiveRouter({ breakpoints: BREAKPOINTS, routes: ROUTES })
        mode = router.mode()
        keys = router.panes().map((pane) => pane.key)
        overlayDetails = router.isOverlay("details")
        return <text>x</text>
      },
      { width: 40, height: 1 },
    )
    await renderOnce()
    expect(mode).toBe("narrow")
    expect(keys).toEqual(["list"])
    // details exists in standard+wide but not narrow → overlay
    expect(overlayDetails).toBe(true)
  })

  test("exposes the wide route's full pane list", async () => {
    let keys: string[] = []
    let sidebarFlex: number | undefined
    const { renderOnce } = await testRender(
      () => {
        const router = createResponsiveRouter({ breakpoints: BREAKPOINTS, routes: ROUTES })
        keys = router.panes().map((pane) => pane.key)
        sidebarFlex = router.paneByKey("sidebar")?.flex
        return <text>x</text>
      },
      { width: 200, height: 1 },
    )
    await renderOnce()
    expect(keys).toEqual(["sidebar", "list", "details"])
    expect(sidebarFlex).toBe(20)
  })

  test("paneByKey returns undefined for collapsed panes", async () => {
    let sidebar: unknown = "init"
    const { renderOnce } = await testRender(
      () => {
        const router = createResponsiveRouter({ breakpoints: BREAKPOINTS, routes: ROUTES })
        sidebar = router.paneByKey("sidebar")
        return <text>x</text>
      },
      { width: 40, height: 1 },
    )
    await renderOnce()
    expect(sidebar).toBeUndefined()
  })

  test("isOverlay returns false for unknown keys", async () => {
    let overlayBogus = true
    const { renderOnce } = await testRender(
      () => {
        const router = createResponsiveRouter({ breakpoints: BREAKPOINTS, routes: ROUTES })
        overlayBogus = router.isOverlay("never-declared")
        return <text>x</text>
      },
      { width: 100, height: 1 },
    )
    await renderOnce()
    expect(overlayBogus).toBe(false)
  })
})
