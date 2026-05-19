import { describe, expect, test } from "bun:test"
import { type Column, Table } from "@components/container/table.tsx"
import { testRender } from "@opentui/solid"

interface Row {
  name: string
  qty: number
}

const columns: Column<Row>[] = [
  { key: "name", label: "Name", width: 10, render: (r) => <text>{r.name}</text>, sortable: true },
  { key: "qty", label: "Qty", width: 6, align: "right", render: (r) => <text>{r.qty}</text>, sortable: true },
]

describe("Table", () => {
  test("renders headers and rows", async () => {
    const rows: Row[] = [
      { name: "apple", qty: 3 },
      { name: "pear", qty: 7 },
    ]
    const { captureCharFrame, renderOnce } = await testRender(() => <Table columns={columns} rows={() => rows} />, {
      width: 20,
      height: 5,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("Name")
    expect(frame).toContain("Qty")
    expect(frame).toContain("apple")
    expect(frame).toContain("pear")
  })

  test("active sort decorates the header with an arrow glyph", async () => {
    const rows: Row[] = [{ name: "x", qty: 1 }]
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Table columns={columns} rows={() => rows} sort={() => ({ key: "name", desc: false })} />,
      { width: 20, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("▲")
  })

  test("desc sort uses the down arrow", async () => {
    const rows: Row[] = [{ name: "x", qty: 1 }]
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Table columns={columns} rows={() => rows} sort={() => ({ key: "qty", desc: true })} />,
      { width: 20, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("▼")
  })

  test("loadingRows paints skeleton placeholders when there are no rows", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Table columns={columns} rows={() => []} loadingRows={2} />,
      { width: 20, height: 6 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("╌")
  })

  test("selected row callback drives highlighting (smoke)", async () => {
    const rows: Row[] = [
      { name: "a", qty: 1 },
      { name: "b", qty: 2 },
    ]
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Table
          columns={columns}
          rows={() => rows}
          selected={(r) => r.name === "b"}
          onRowClick={() => {}}
          onHeaderClick={() => {}}
        />
      ),
      { width: 20, height: 5 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("a")
    expect(frame).toContain("b")
  })
})
