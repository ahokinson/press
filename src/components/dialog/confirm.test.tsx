import { describe, expect, test } from "bun:test"
import { ConfirmDialog } from "@components/dialog/confirm.tsx"
import type { ConfirmAction } from "@models/dialog/confirm.ts"
import { testRender } from "@opentui/solid"

describe("ConfirmDialog", () => {
  test("renders nothing when action is null", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <ConfirmDialog action={() => null} />, {
      width: 30,
      height: 5,
    })
    await renderOnce()
    expect(captureCharFrame()).not.toContain("confirm")
  })

  test("renders the message and default key hints", async () => {
    const action: ConfirmAction = {
      message: "delete file?",
      onConfirm: () => {},
    }
    const { captureCharFrame, renderOnce } = await testRender(() => <ConfirmDialog action={() => action} />, {
      width: 40,
      height: 10,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("delete file?")
    expect(frame).toContain("enter")
    expect(frame).toContain("esc")
  })

  test("renders the optional detail and custom title", async () => {
    const action: ConfirmAction = {
      message: "discard?",
      detail: "this cannot be undone",
      title: " warning ",
      destructive: true,
      onConfirm: () => {},
    }
    const { captureCharFrame, renderOnce } = await testRender(() => <ConfirmDialog action={() => action} />, {
      width: 40,
      height: 10,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("discard?")
    expect(frame).toContain("this cannot be undone")
    expect(frame).toContain("warning")
  })

  test("renders custom key hints", async () => {
    const action: ConfirmAction = {
      message: "ok?",
      keyHints: [
        { key: "y", action: "yes" },
        { key: "n", action: "no" },
      ],
      onConfirm: () => {},
    }
    const { captureCharFrame, renderOnce } = await testRender(() => <ConfirmDialog action={() => action} />, {
      width: 30,
      height: 8,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("yes")
    expect(frame).toContain("no")
  })
})
