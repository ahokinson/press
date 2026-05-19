import { describe, expect, test } from "bun:test"
import { composeTrailing, createStatusState } from "@models/feedback/status.ts"

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

describe("createStatusState", () => {
  test("showMessage sets message and trail; busy starts inactive", () => {
    const state = createStatusState()
    expect(state.message()).toBeNull()
    expect(state.busy.active()).toBe(false)
    state.showMessage("hello", 100)
    expect(state.message()).toBe("hello")
    expect(state.trail().length).toBeGreaterThan(0)
  })

  test("trail shortens over time and message clears at the end", async () => {
    const state = createStatusState()
    state.showMessage("bye", 60)
    expect(state.trail().length).toBeGreaterThan(0)
    await sleep(80)
    expect(state.message()).toBeNull()
    expect(state.trail()).toBe("")
  })

  test("showMessage called twice resets the timer", async () => {
    const state = createStatusState()
    state.showMessage("first", 30)
    await sleep(10)
    state.showMessage("second", 60)
    await sleep(40)
    expect(state.message()).toBe("second")
    await sleep(40)
    expect(state.message()).toBeNull()
  })

  test("busy.showReason toggles active; clear returns to inactive", () => {
    const state = createStatusState()
    state.busy.showReason("working...")
    expect(state.busy.active()).toBe(true)
    expect(state.busy.reason()).toBe("working...")
    state.busy.clear()
    expect(state.busy.active()).toBe(false)
    expect(state.busy.reason()).toBeNull()
  })

  test("dispose cancels pending timers so message does not clear after teardown", async () => {
    const state = createStatusState()
    state.showMessage("pending", 50)
    expect(state.message()).toBe("pending")
    state.dispose()
    await sleep(80)
    // Without dispose the timer would have nulled `message` by now.
    expect(state.message()).toBe("pending")
  })
})

describe("composeTrailing", () => {
  test("falls back when no message and no busy reason", () => {
    const state = createStatusState()
    const trailing = composeTrailing(state, () => "idle")
    expect(trailing()).toBe("idle")
  })

  test("busy reason overrides fallback", () => {
    const state = createStatusState()
    const trailing = composeTrailing(state, () => "idle")
    state.busy.showReason("working")
    expect(trailing()).toBe("working")
  })

  test("transient message overrides busy reason, and appends the trail", () => {
    const state = createStatusState()
    const trailing = composeTrailing(state, () => "idle")
    state.busy.showReason("working")
    state.showMessage("done", 1000)
    const out = trailing()
    expect(out.startsWith("done")).toBe(true)
    expect(out.length).toBeGreaterThan("done".length) // trail tacked on
  })
})
