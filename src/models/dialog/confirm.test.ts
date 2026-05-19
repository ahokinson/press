import { describe, expect, test } from "bun:test"
import { createConfirmState } from "@models/dialog/confirm.ts"

describe("createConfirmState", () => {
  test("starts empty; request sets the action", () => {
    const c = createConfirmState()
    expect(c.action()).toBeNull()
    expect(c.dialogAction()).toBeNull()
    c.request({ message: "Delete?", onConfirm: () => {} })
    expect(c.action()?.message).toBe("Delete?")
    expect(c.dialogAction()?.message).toBe("Delete?")
  })

  test("execute runs onConfirm and clears the action", () => {
    const c = createConfirmState()
    let ran = 0
    c.request({
      message: "go",
      onConfirm: () => {
        ran++
      },
    })
    c.execute()
    expect(ran).toBe(1)
    expect(c.action()).toBeNull()
  })

  test("execute on empty state is a no-op", () => {
    const c = createConfirmState()
    c.execute()
    expect(c.action()).toBeNull()
  })

  test("cancel clears without running onConfirm", () => {
    const c = createConfirmState()
    let ran = 0
    c.request({
      message: "go",
      onConfirm: () => {
        ran++
      },
    })
    c.cancel()
    expect(ran).toBe(0)
    expect(c.action()).toBeNull()
  })

  test("dialogAction wires onConfirm/onCancel into the dialog shape", () => {
    const c = createConfirmState()
    let confirmed = 0
    c.request({
      message: "yes?",
      destructive: true,
      title: " warning ",
      onConfirm: () => {
        confirmed++
      },
    })
    const action = c.dialogAction()!
    expect(action.destructive).toBe(true)
    expect(action.title).toBe(" warning ")
    action.onConfirm()
    expect(confirmed).toBe(1)
    expect(c.action()).toBeNull()

    c.request({
      message: "go again",
      onConfirm: () => {
        confirmed++
      },
    })
    const action2 = c.dialogAction()!
    action2.onCancel!()
    expect(c.action()).toBeNull()
    expect(confirmed).toBe(1)
  })

  test("request overwrites a pending action", () => {
    const c = createConfirmState()
    c.request({ message: "a", onConfirm: () => {} })
    c.request({ message: "b", onConfirm: () => {} })
    expect(c.action()?.message).toBe("b")
  })

  test("onError catches a synchronous throw from onConfirm", () => {
    const c = createConfirmState()
    const errors: unknown[] = []
    c.request({
      message: "go",
      onConfirm: () => {
        throw new Error("boom")
      },
      onError: (err) => errors.push(err),
    })
    c.execute()
    expect(errors).toHaveLength(1)
    expect((errors[0] as Error).message).toBe("boom")
    expect(c.action()).toBeNull()
  })

  test("onError catches an async rejection from onConfirm", async () => {
    const c = createConfirmState()
    const errors: unknown[] = []
    c.request({
      message: "go",
      onConfirm: () => Promise.reject(new Error("async-boom")),
      onError: (err) => errors.push(err),
    })
    c.execute()
    await Promise.resolve()
    await Promise.resolve()
    expect(errors).toHaveLength(1)
    expect((errors[0] as Error).message).toBe("async-boom")
  })
})
