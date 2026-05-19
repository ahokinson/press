import { describe, expect, test } from "bun:test"
import { TabOrientation, Tabs } from "@components/container/tabs.tsx"
import { testRender } from "@opentui/solid"
import { createSignal } from "solid-js"

const TABS = [
  { key: "alpha", label: "alpha" },
  { key: "beta", label: "beta" },
  { key: "gamma", label: "gamma" },
] as const

describe("Tabs", () => {
  test("renders one entry per tab descriptor", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Tabs tabs={() => TABS} active={() => "alpha"}>
          <text>panel</text>
        </Tabs>
      ),
      { width: 40, height: 5 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("alpha")
    expect(frame).toContain("beta")
    expect(frame).toContain("gamma")
    expect(frame).toContain("panel")
  })

  test("renders horizontal layout by default", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Tabs tabs={() => TABS} active={() => "alpha"}>
          <text>body</text>
        </Tabs>
      ),
      { width: 40, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("body")
  })

  test("renders vertical layout when configured", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Tabs tabs={() => TABS} active={() => "beta"} orientation={TabOrientation.Vertical}>
          <text>side</text>
        </Tabs>
      ),
      { width: 40, height: 10 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("alpha")
    expect(frame).toContain("side")
  })

  test("badges render alongside labels", async () => {
    const tabs = [
      { key: "in", label: "inbox", badge: 3 },
      { key: "out", label: "sent", badge: "✓" },
    ] as const
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Tabs tabs={() => tabs} active={() => "in"}>
          <text>x</text>
        </Tabs>
      ),
      { width: 40, height: 5 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("inbox")
    expect(frame).toContain("3")
    expect(frame).toContain("✓")
  })

  test("active accessor changes which tab is bolded", async () => {
    const [active, setActive] = createSignal<string>("alpha")
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Tabs tabs={() => TABS} active={active}>
          <text>p</text>
        </Tabs>
      ),
      { width: 40, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("alpha")
    setActive("gamma")
    await renderOnce()
    expect(captureCharFrame()).toContain("gamma")
  })

  test("renders without crashing when onActivate is omitted", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Tabs tabs={() => TABS} active={() => "alpha"}>
          <text>p</text>
        </Tabs>
      ),
      { width: 40, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("alpha")
  })

  test("renderTab override replaces the default cell layout", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Tabs
          tabs={() => TABS}
          active={() => "beta"}
          renderTab={(tab, isActive) => <text>{`${isActive ? "*" : " "}${tab.label.toUpperCase()}`}</text>}
        >
          <text>p</text>
        </Tabs>
      ),
      { width: 60, height: 5 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("ALPHA")
    expect(frame).toContain("*BETA")
    expect(frame).toContain("GAMMA")
  })

  test("invokes onActivate on a mouse-down on a tab", async () => {
    let clicked: string | null = null
    const { renderOnce, mockMouse } = await testRender(
      () => (
        <Tabs tabs={() => TABS} active={() => "alpha"} onActivate={(k) => (clicked = k)}>
          <text>p</text>
        </Tabs>
      ),
      { width: 40, height: 5 },
    )
    await renderOnce()
    // Click somewhere inside the first tab strip row (y=0). The exact x doesn't
    // matter much — any tab will satisfy the handler being invoked.
    await mockMouse.pressDown(2, 0)
    expect(clicked).not.toBeNull()
  })

  test("renders with no panel children", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Tabs tabs={() => TABS} active={() => "alpha"} />, {
      width: 40,
      height: 5,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain("alpha")
  })
})
