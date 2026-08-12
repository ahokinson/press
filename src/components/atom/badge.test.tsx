import { describe, expect, test } from "bun:test"
import { Badge } from "@components/atom/badge.tsx"
import { testRender } from "@opentui/solid"
import { Intent } from "@theme"

describe("Badge", () => {
  test("renders the label with surrounding spaces", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Badge text="ok" />, {
      width: 20,
      height: 1,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain(" ok ")
  })

  test("active state renders as a filled chip (same label text)", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Badge text="ok" active />, {
      width: 20,
      height: 1,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain(" ok ")
  })

  test("renders with each intent bucket", async () => {
    for (const sev of [Intent.Neutral, Intent.Info, Intent.Success, Intent.Warning, Intent.Error]) {
      const { captureCharFrame, renderOnce } = await testRender(() => <Badge text={`s-${sev}`} intent={sev} />, {
        width: 20,
        height: 1,
      })
      await renderOnce()
      expect(captureCharFrame()).toContain(`s-${sev}`)
    }
  })
})
