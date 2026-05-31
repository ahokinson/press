import { describe, expect, test } from "bun:test"
import { Toast } from "@components/feedback/toast.tsx"
import { Icon } from "@icons"
import { testRender } from "@opentui/solid"
import { Severity } from "@theme"
import { createSignal } from "solid-js"

describe("Toast", () => {
  test("renders nothing when message is null", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Toast message={() => null} />, {
      width: 30,
      height: 3,
    })
    await renderOnce()
    expect(captureCharFrame().trim()).toBe("")
  })

  test("renders the message text when non-null", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Toast message={() => "saved"} />, {
      width: 30,
      height: 3,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain("saved")
  })

  test("appends the trail when supplied", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Toast message={() => "ok"} trail={() => " ┄┄"} />,
      { width: 30, height: 3 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("ok")
    expect(captureCharFrame()).toContain("┄")
  })

  test("renders without trail when accessor returns falsy", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Toast message={() => "bare"} trail={() => ""} />, {
      width: 30,
      height: 3,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain("bare")
  })

  test("renders each severity bucket", async () => {
    for (const sev of [Severity.Info, Severity.Success, Severity.Warning, Severity.Error, Severity.Neutral]) {
      const { captureCharFrame, renderOnce } = await testRender(
        () => <Toast message={() => `m-${sev}`} severity={sev} />,
        { width: 30, height: 3 },
      )
      await renderOnce()
      expect(captureCharFrame()).toContain(`m-${sev}`)
    }
  })

  test("auto-derives glyph from severity", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Toast message={() => "saved"} severity={Severity.Success} />,
      { width: 30, height: 3 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain(Icon.circleSuccess.char)
    expect(frame).toContain("saved")
    expect(frame.indexOf(Icon.circleSuccess.char)).toBeLessThan(frame.indexOf("saved"))
  })

  test("Neutral severity renders no auto glyph", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Toast message={() => "note"} severity={Severity.Neutral} />,
      { width: 30, height: 3 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("note")
    expect(frame).not.toContain(Icon.circleInfo.char)
    expect(frame).not.toContain(Icon.circleSuccess.char)
  })

  test("explicit glyph overrides the auto-derived one", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Toast message={() => "saved"} glyph="✓" />, {
      width: 30,
      height: 3,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("✓")
    expect(frame).not.toContain(Icon.circleInfo.char)
    expect(frame).toContain("saved")
    expect(frame.indexOf("✓")).toBeLessThan(frame.indexOf("saved"))
  })

  test("updates when the message accessor changes", async () => {
    const [msg, setMsg] = createSignal<string | null>("first")
    const { captureCharFrame, renderOnce } = await testRender(() => <Toast message={msg} />, {
      width: 30,
      height: 3,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain("first")
    setMsg("second")
    await renderOnce()
    expect(captureCharFrame()).toContain("second")
    setMsg(null)
    await renderOnce()
    expect(captureCharFrame()).not.toContain("second")
  })
})
