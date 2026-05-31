import { describe, expect, test } from "bun:test"
import { Badge } from "@components/atom/badge.tsx"
import { testRender } from "@opentui/solid"
import { Severity } from "@theme"

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

  test("renders with each severity bucket", async () => {
    for (const sev of [Severity.Neutral, Severity.Info, Severity.Success, Severity.Warning, Severity.Error]) {
      const { captureCharFrame, renderOnce } = await testRender(() => <Badge text={`s-${sev}`} severity={sev} />, {
        width: 20,
        height: 1,
      })
      await renderOnce()
      expect(captureCharFrame()).toContain(`s-${sev}`)
    }
  })
})
