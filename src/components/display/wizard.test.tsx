import { describe, expect, test } from "bun:test"
import { WizardRail } from "@components/display/wizard.tsx"
import { testRender } from "@opentui/solid"
import { createSignal } from "solid-js"

enum Step {
  Symbol = "symbol",
  Shares = "shares",
  Cost = "cost",
}

const STEPS = [
  { key: Step.Symbol, label: "symbol" },
  { key: Step.Shares, label: "shares" },
  { key: Step.Cost, label: "cost" },
] as const

describe("WizardRail", () => {
  test("renders one bullet per step with labels", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <WizardRail steps={STEPS} current={() => Step.Symbol} />,
      { width: 60, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("symbol")
    expect(frame).toContain("shares")
    expect(frame).toContain("cost")
  })

  test("uses the active glyph for the current step", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <WizardRail steps={STEPS} current={() => Step.Shares} />,
      { width: 60, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("◉")
    expect(frame).toContain("●")
    expect(frame).toContain("○")
  })

  test("connector renders between steps but not after the last", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <WizardRail steps={STEPS} current={() => Step.Symbol} />,
      { width: 60, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    // two connectors expected (between 3 steps)
    const matches = frame.match(/─/g) ?? []
    expect(matches.length).toBe(2)
  })

  test("reacts to current() changes", async () => {
    const [step, setStep] = createSignal<Step>(Step.Symbol)
    const { captureCharFrame, renderOnce } = await testRender(() => <WizardRail steps={STEPS} current={step} />, {
      width: 60,
      height: 1,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain("◉ symbol")
    setStep(Step.Cost)
    await renderOnce()
    expect(captureCharFrame()).toContain("◉ cost")
    expect(captureCharFrame()).toContain("● symbol")
  })

  test("accepts custom glyphs (partial override)", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <WizardRail
          steps={STEPS}
          current={() => Step.Shares}
          glyphs={{ done: "✔", active: "▶", pending: "·", connector: "→" }}
        />
      ),
      { width: 60, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("✔ symbol")
    expect(frame).toContain("▶ shares")
    expect(frame).toContain("· cost")
    expect(frame).toContain("→")
  })

  test("falls back to default glyphs when only some are overridden", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <WizardRail steps={STEPS} current={() => Step.Symbol} glyphs={{ active: "★" }} />,
      { width: 60, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("★ symbol")
    expect(frame).toContain("○ shares")
    expect(frame).toContain("─")
  })

  test("single-step rail renders the only step as active", async () => {
    enum Only {
      Done = "done",
    }
    const { captureCharFrame, renderOnce } = await testRender(
      () => <WizardRail steps={[{ key: Only.Done, label: "done" }] as const} current={() => Only.Done} />,
      { width: 30, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("◉ done")
    expect(frame).not.toContain("─")
  })
})
