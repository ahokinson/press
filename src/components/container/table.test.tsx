import { describe, expect, test } from "bun:test"
import { type Column, ColumnAlign, Table, TableHeader, TableRowCells } from "@components/container/table.tsx"
import { testRender } from "@opentui/solid"

interface Row {
  name: string
  qty: number
}

const columns: Column<Row>[] = [
  { key: "name", label: "Name", width: 10, render: (row) => <text>{row.name}</text>, sortable: true },
  {
    key: "qty",
    label: "Qty",
    width: 6,
    align: ColumnAlign.Right,
    render: (row) => <text>{row.qty}</text>,
    sortable: true,
  },
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
          selected={(row) => row.name === "b"}
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

describe("TableHeader", () => {
  test("paints column labels standalone (for reuse above a scrolling body)", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <TableHeader columns={columns} />, {
      width: 20,
      height: 3,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("Name")
    expect(frame).toContain("Qty")
  })

  test("decorates the active sort column with an arrow", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <TableHeader columns={columns} sort={() => ({ key: "name", desc: false })} />,
      { width: 20, height: 3 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("▲")
  })
})

describe("flex column", () => {
  const flexColumns: Column<Row>[] = [
    { key: "name", label: "Name", width: 0, flex: true, render: (row) => <text>{row.name}</text> },
    { key: "qty", label: "Qty", width: 6, align: ColumnAlign.Right, render: (row) => <text>{row.qty}</text> },
  ]

  test("a flex column grows to fill and still renders header + cells", async () => {
    const rows: Row[] = [{ name: "a-long-flexible-name", qty: 9 }]
    const { captureCharFrame, renderOnce } = await testRender(() => <Table columns={flexColumns} rows={() => rows} />, {
      width: 40,
      height: 4,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("Name")
    expect(frame).toContain("a-long-flexible-name")
    expect(frame).toContain("9")
  })
})

describe("TableRowCells", () => {
  test("renders each column's cell for a row, no outer selection box", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <box flexDirection="row">
          <TableRowCells columns={columns} row={{ name: "widget", qty: 42 }} />
        </box>
      ),
      { width: 20, height: 3 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("widget")
    expect(frame).toContain("42")
  })
})
