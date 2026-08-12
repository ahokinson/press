import { describe, expect, test } from "bun:test"
import { createToastStack } from "@models/feedback/toasts.ts"
import { Intent } from "@theme"

describe("createToastStack", () => {
  test("push adds a toast with defaults and returns its id", () => {
    const stack = createToastStack()
    const id = stack.push("saved", { durationMilliseconds: 0 })
    const toasts = stack.toasts()
    expect(toasts).toHaveLength(1)
    expect(toasts[0]!.id).toBe(id)
    expect(toasts[0]!.text).toBe("saved")
    expect(toasts[0]!.intent).toBe(Intent.Neutral)
  })

  test("carries intent + glyph", () => {
    const stack = createToastStack()
    stack.push("boom", { intent: Intent.Error, glyph: "✖", durationMilliseconds: 0 })
    expect(stack.toasts()[0]).toMatchObject({ intent: Intent.Error, glyph: "✖" })
  })

  test("dismiss removes one; clear empties all", () => {
    const stack = createToastStack()
    const a = stack.push("a", { durationMilliseconds: 0 })
    stack.push("b", { durationMilliseconds: 0 })
    stack.dismiss(a)
    expect(stack.toasts().map((t) => t.text)).toEqual(["b"])
    stack.clear()
    expect(stack.toasts()).toHaveLength(0)
  })

  test("auto-dismisses after the duration", async () => {
    const stack = createToastStack()
    stack.push("bye", { durationMilliseconds: 20 })
    expect(stack.toasts()).toHaveLength(1)
    await new Promise((resolve) => setTimeout(resolve, 40))
    expect(stack.toasts()).toHaveLength(0)
  })
})
