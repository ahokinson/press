import { describe, expect, test } from "bun:test"
import { List } from "@components/container/list.tsx"
import { testRender } from "@opentui/solid"

describe("List", () => {
  test("renders each item via renderItem", async () => {
    const items = ["alpha", "beta", "gamma"]
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <List items={() => items} selected={() => 0} focused={() => true} renderItem={(item) => <text>{item}</text>} />
      ),
      { width: 20, height: 10 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("alpha")
    expect(frame).toContain("beta")
    expect(frame).toContain("gamma")
  })

  test("renders the empty label when there are no items", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <List
          items={() => []}
          selected={() => 0}
          renderItem={(item) => <text>{item as string}</text>}
          emptyLabel="(none)"
        />
      ),
      { width: 20, height: 10 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("(none)")
  })

  test("falls back to default empty label when none provided", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <List items={() => []} selected={() => 0} renderItem={(item) => <text>{item as string}</text>} />,
      { width: 20, height: 10 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("(empty)")
  })

  test("accepts title and sizing props", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <List
          title="things"
          items={() => ["one"]}
          selected={() => 0}
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
})
