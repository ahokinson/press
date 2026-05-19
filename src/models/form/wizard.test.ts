import { describe, expect, test } from "bun:test"
import { createWizard } from "@models/form/wizard.ts"

enum Step {
  Symbol = "symbol",
  Shares = "shares",
  Cost = "cost",
}

const STEPS = [Step.Symbol, Step.Shares, Step.Cost] as const

describe("createWizard", () => {
  test("starts at the first configured step", () => {
    const w = createWizard(STEPS)
    expect(w.step()).toBe(Step.Symbol)
    expect(w.index()).toBe(0)
    expect(w.isFirst()).toBe(true)
    expect(w.isLast()).toBe(false)
  })

  test("honours `initial` override", () => {
    const w = createWizard(STEPS, { initial: Step.Shares })
    expect(w.step()).toBe(Step.Shares)
    expect(w.index()).toBe(1)
    expect(w.isFirst()).toBe(false)
    expect(w.isLast()).toBe(false)
  })

  test("next() advances and stops at the last step", () => {
    const w = createWizard(STEPS)
    w.next()
    expect(w.step()).toBe(Step.Shares)
    w.next()
    expect(w.step()).toBe(Step.Cost)
    expect(w.isLast()).toBe(true)
    w.next()
    expect(w.step()).toBe(Step.Cost)
  })

  test("prev() retreats and stops at the first step", () => {
    const w = createWizard(STEPS, { initial: Step.Cost })
    w.prev()
    expect(w.step()).toBe(Step.Shares)
    w.prev()
    expect(w.step()).toBe(Step.Symbol)
    expect(w.isFirst()).toBe(true)
    w.prev()
    expect(w.step()).toBe(Step.Symbol)
  })

  test("goto() jumps to a known step", () => {
    const w = createWizard(STEPS)
    w.goto(Step.Cost)
    expect(w.step()).toBe(Step.Cost)
    expect(w.isLast()).toBe(true)
  })

  test("goto() ignores unknown steps", () => {
    const w = createWizard(STEPS)
    w.goto("nonexistent" as Step)
    expect(w.step()).toBe(Step.Symbol)
  })

  test("reset() returns to initial step (default)", () => {
    const w = createWizard(STEPS)
    w.next()
    w.next()
    expect(w.step()).toBe(Step.Cost)
    w.reset()
    expect(w.step()).toBe(Step.Symbol)
  })

  test("reset() returns to initial step (overridden)", () => {
    const w = createWizard(STEPS, { initial: Step.Shares })
    w.next()
    expect(w.step()).toBe(Step.Cost)
    w.reset()
    expect(w.step()).toBe(Step.Shares)
  })

  test("single-step wizard reports both isFirst and isLast", () => {
    enum Only {
      Done = "done",
    }
    const w = createWizard([Only.Done] as const)
    expect(w.step()).toBe(Only.Done)
    expect(w.isFirst()).toBe(true)
    expect(w.isLast()).toBe(true)
    w.next()
    w.prev()
    expect(w.step()).toBe(Only.Done)
  })

  test("throws when constructed with no steps", () => {
    expect(() => createWizard([] as const)).toThrow(/at least one step/)
  })

  test("throws when initial step is not in steps", () => {
    expect(() => createWizard(STEPS, { initial: "ghost" as Step })).toThrow(/not in steps/)
  })
})
