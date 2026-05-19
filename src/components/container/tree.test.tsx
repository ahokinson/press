import { describe, expect, test } from "bun:test"
import { Tree } from "@components/container/tree.tsx"
import { createTreeState, type TreeNode } from "@models/cursor/tree.ts"
import { testRender } from "@opentui/solid"
import { createRoot } from "solid-js"

interface Folder {
  name: string
}

function build(): TreeNode<Folder>[] {
  return [
    {
      id: "src",
      data: { name: "src" },
      children: [
        { id: "src/index.ts", data: { name: "index.ts" } },
        { id: "src/util.ts", data: { name: "util.ts" } },
      ],
    },
    { id: "README", data: { name: "README" } },
  ]
}

describe("Tree", () => {
  test("renders one row per visible node", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const t = createTreeState(() => build())
        const { captureCharFrame, renderOnce } = await testRender(
          () => <Tree state={t} render={(ctx) => <text>{ctx.row.node.data.name}</text>} />,
          { width: 40, height: 10 },
        )
        await renderOnce()
        const frame = captureCharFrame()
        expect(frame).toContain("src")
        expect(frame).toContain("README")
        // collapsed by default — children not visible
        expect(frame).not.toContain("index.ts")
        dispose()
        resolve()
      })
    })
  })

  test("expanded children render with deeper indent and the expanded chevron", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const t = createTreeState(() => build(), { initialExpanded: ["src"] })
        const { captureCharFrame, renderOnce } = await testRender(
          () => <Tree state={t} render={(ctx) => <text>{ctx.row.node.data.name}</text>} />,
          { width: 40, height: 10 },
        )
        await renderOnce()
        const frame = captureCharFrame()
        expect(frame).toContain("index.ts")
        expect(frame).toContain("util.ts")
        expect(frame).toContain("▾")
        dispose()
        resolve()
      })
    })
  })

  test("collapsed expandable node shows the collapsed chevron", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const t = createTreeState(() => build())
        const { captureCharFrame, renderOnce } = await testRender(
          () => <Tree state={t} render={(ctx) => <text>{ctx.row.node.data.name}</text>} />,
          { width: 40, height: 10 },
        )
        await renderOnce()
        const frame = captureCharFrame()
        expect(frame).toContain("▸")
        expect(frame).not.toContain("▾")
        dispose()
        resolve()
      })
    })
  })

  test("leaf rows render no chevron", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const t = createTreeState<Folder>(() => [{ id: "only", data: { name: "only" } }])
        const { captureCharFrame, renderOnce } = await testRender(
          () => <Tree state={t} render={(ctx) => <text>{ctx.row.node.data.name}</text>} />,
          { width: 30, height: 5 },
        )
        await renderOnce()
        const frame = captureCharFrame()
        expect(frame).toContain("only")
        expect(frame).not.toContain("▸")
        expect(frame).not.toContain("▾")
        dispose()
        resolve()
      })
    })
  })

  test("passes isCursor true for the cursor row in render context", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const t = createTreeState(() => build())
        t.setCursor(1)
        const seen: Array<{ id: string; isCursor: boolean }> = []
        const { renderOnce } = await testRender(
          () => (
            <Tree
              state={t}
              render={(ctx) => {
                seen.push({ id: ctx.row.node.id, isCursor: ctx.isCursor })
                return <text>{ctx.row.node.data.name}</text>
              }}
            />
          ),
          { width: 40, height: 10 },
        )
        await renderOnce()
        const cursorEntries = seen.filter((s) => s.isCursor)
        expect(cursorEntries.length).toBeGreaterThan(0)
        expect(cursorEntries[0]!.id).toBe("README")
        dispose()
        resolve()
      })
    })
  })

  test("empty tree renders no rows", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const t = createTreeState<Folder>(() => [])
        const { captureCharFrame, renderOnce } = await testRender(
          () => <Tree state={t} render={(ctx) => <text>{ctx.row.node.data.name}</text>} />,
          { width: 30, height: 5 },
        )
        await renderOnce()
        expect(captureCharFrame().trim()).toBe("")
        dispose()
        resolve()
      })
    })
  })
})
