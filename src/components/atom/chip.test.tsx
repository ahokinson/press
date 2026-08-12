import { describe, expect, test } from "bun:test"
import { Chip } from "@components/atom/chip.tsx"
import { testRender } from "@opentui/solid"

describe("Chip", () => {
  test("renders a plain colored label", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Chip label="aikido" color="#8caaee" />, {
      width: 20,
      height: 1,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain("aikido")
  })

  test("renders a filled label padded with spaces", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Chip label="crit" color="#e78284" filled textColor="#232634" />,
      { width: 20, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("crit")
  })
})
