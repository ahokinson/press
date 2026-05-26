import { describe, expect, test } from "bun:test"
import { Cycle } from "@components/display/cycle.tsx"
import { testRender } from "@opentui/solid"
import { createSignal } from "solid-js"

const sleep = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds))

interface Task {
  id: string
  label: string
}

describe("Cycle", () => {
  test("renders fallback when items is empty", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Cycle items={() => []} render={(item: string) => item} fallback={() => "idle"} />,
      { width: 30, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("idle")
  })

  test("renders an empty span when items is empty and no fallback", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Cycle items={() => []} render={(item: string) => item} />,
      { width: 30, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame().trim()).toBe("")
  })

  test("renders the only item without rotation", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Cycle items={() => ["only"]} render={(item) => item} />,
      { width: 30, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("only")
    expect(captureCharFrame()).not.toContain("1/1")
  })

  test("rotates through multiple items at the configured interval", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Cycle items={() => ["alpha", "beta", "gamma"]} render={(item) => item} intervalMs={20} />,
      { width: 30, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("alpha")
    await sleep(60)
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame.includes("beta") || frame.includes("gamma") || frame.includes("alpha")).toBe(true)
    expect(frame).toMatch(/[123]\/3/)
  })

  test("position suffix is hidden when showPosition is false", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Cycle items={() => ["a", "b"]} render={(item) => item} intervalMs={50} showPosition={false} />,
      { width: 30, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).not.toContain("1/2")
  })

  test("prefix slot renders before the item", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Cycle items={() => ["task"]} render={(item) => item} prefix={() => "⏱"} />,
      { width: 30, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("⏱")
    expect(frame).toContain("task")
  })

  test("resets index when items goes from non-empty to empty", async () => {
    const [items, setItems] = createSignal<string[]>(["x", "y"])
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Cycle items={items} render={(item) => item} intervalMs={50} />,
      { width: 30, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("x")
    setItems([])
    await renderOnce()
    expect(captureCharFrame()).not.toContain("x")
    setItems(["new"])
    await renderOnce()
    expect(captureCharFrame()).toContain("new")
  })

  test("uses default interval when intervalMs is omitted", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Cycle items={() => ["a", "b"]} render={(item) => item} />,
      { width: 30, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("a")
  })

  test("renders generic items via render slot", async () => {
    const tasks: Task[] = [
      { id: "1", label: "running" },
      { id: "2", label: "queued" },
    ]
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Cycle items={() => tasks} render={(task) => `${task.id}:${task.label}`} intervalMs={50} />,
      { width: 30, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("1:running")
  })
})
