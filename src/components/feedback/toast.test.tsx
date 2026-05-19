import { describe, expect, test } from "bun:test"
import { Toast } from "@components/feedback/toast.tsx"
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

  test("color override wins over severity", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Toast message={() => "custom"} severity={Severity.Error} color="#abcdef" />,
      { width: 30, height: 3 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("custom")
  })

  test("icon renders before the message", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Toast message={() => "saved"} icon="✓" />, {
      width: 30,
      height: 3,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("✓")
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
