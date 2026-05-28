import { describe, expect, test } from "bun:test"
import { List } from "@components/container/list.tsx"
import { testRender } from "@opentui/solid"
import { createSignal } from "solid-js"

describe("List", () => {
  test("renders each item via renderItem", async () => {
    const items = ["alpha", "beta", "gamma"]
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <List items={() => items} cursor={() => 0} focused={() => true} renderItem={(item) => <text>{item}</text>} />
      ),
      { width: 20, height: 10 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("alpha")
    expect(frame).toContain("beta")
    expect(frame).toContain("gamma")
  })

  test("renders the empty message when there are no items", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <List
          items={() => []}
          cursor={() => 0}
          renderItem={(item) => <text>{item as string}</text>}
          emptyMessage="nothing"
        />
      ),
      { width: 20, height: 10 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("nothing")
  })

  test("falls back to default empty message when none provided", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <List items={() => []} cursor={() => 0} renderItem={(item) => <text>{item as string}</text>} />,
      { width: 20, height: 10 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("No items")
  })

  test("scrolls forward to keep cursor row visible when it moves past the viewport", async () => {
    const rows = Array.from({ length: 20 }, (_, i) => `row-${i}`)
    let setCursor!: (n: number) => void
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const [cursor, set] = createSignal(0)
        setCursor = set
        return (
          <List
            items={() => rows}
            cursor={cursor}
            focused={() => true}
            renderItem={(item) => <text>{item}</text>}
            height={5}
          />
        )
      },
      { width: 20, height: 7 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("row-0")

    setCursor(15)
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("row-15")
    expect(frame).not.toContain("row-0")
  })

  test("accepts title and sizing props", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <List
          title="things"
          items={() => ["one"]}
          cursor={() => 0}
          focused={() => false}
          renderItem={(item) => <text>{item}</text>}
          flexGrow={1}
          flexBasis="auto"
          width="100%"
          height="auto"
        />
      ),
      { width: 30, height: 10 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("things")
    expect(frame).toContain("one")
  })

  test("renderItem active accessor updates reactively when cursor moves", async () => {
    let setCursor!: (n: number) => void
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const [cursor, set] = createSignal(0)
        setCursor = set
        return (
          <List
            items={() => ["alpha", "beta", "gamma"]}
            cursor={cursor}
            focused={() => true}
            renderItem={(item, _i, active) => <text>{active() ? `[${item}]` : item}</text>}
          />
        )
      },
      { width: 20, height: 10 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("[alpha]")
    expect(captureCharFrame()).not.toContain("[beta]")

    setCursor(1)
    await renderOnce()
    expect(captureCharFrame()).toContain("[beta]")
    expect(captureCharFrame()).not.toContain("[alpha]")
  })

  test("re-renders when items signal changes", async () => {
    let setItems!: (items: string[]) => void
    const { captureCharFrame, renderOnce } = await testRender(
      () => {
        const [items, set] = createSignal(["alpha", "beta"])
        setItems = set
        return <List items={items} cursor={() => 0} renderItem={(item) => <text>{item}</text>} />
      },
      { width: 20, height: 10 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("alpha")

    setItems(["gamma", "delta"])
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("gamma")
    expect(frame).not.toContain("alpha")
  })
})
