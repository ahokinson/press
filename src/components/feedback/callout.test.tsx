import { describe, expect, test } from "bun:test"
import { Callout } from "@components/feedback/callout.tsx"
import { Icon } from "@icons"
import { testRender } from "@opentui/solid"
import { Intent } from "@theme"

describe("Callout", () => {
  test("renders the rail glyph and string children", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <Callout variant="rail">heads up</Callout>, {
      width: 20,
      height: 1,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("▌")
    expect(frame).toContain("heads up")
  })

  test("no glyph shown without explicit glyph prop", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Callout variant="rail" intent={Intent.Error}>
          error
        </Callout>
      ),
      { width: 30, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).not.toContain(Icon.circleError.char)
    expect(frame).toContain("error")
  })

  test("Neutral intent renders no auto glyph", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Callout variant="rail" intent={Intent.Neutral}>
          note
        </Callout>
      ),
      { width: 20, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("▌")
    expect(frame).toContain("note")
    expect(frame).not.toContain(Icon.circleInfo.char)
    expect(frame).not.toContain(Icon.circleError.char)
  })

  test("explicit glyph prop renders before children", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Callout variant="rail" intent={Intent.Error} glyph="!">
          error
        </Callout>
      ),
      { width: 20, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("!")
    expect(frame).not.toContain(Icon.circleError.char)
    expect(frame).toContain("error")
    expect(frame.indexOf("!")).toBeLessThan(frame.indexOf("error"))
  })

  test("renders JSX children verbatim", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Callout variant="rail">
          <text>OK</text>
        </Callout>
      ),
      { width: 10, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("OK")
  })

  test("renders each intent bucket", async () => {
    for (const sev of [Intent.Neutral, Intent.Info, Intent.Success, Intent.Warning, Intent.Error]) {
      const { captureCharFrame, renderOnce } = await testRender(
        () => <Callout variant="rail" intent={sev}>{`c-${sev}`}</Callout>,
        { width: 30, height: 1 },
      )
      await renderOnce()
      expect(captureCharFrame()).toContain(`c-${sev}`)
    }
  })
})

describe("Callout variant=banner", () => {
  test("renders children without rail glyph", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Callout variant="banner">
          <text>save complete</text>
        </Callout>
      ),
      { width: 30, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("save complete")
    expect(frame).not.toContain("▌")
  })

  test("renders each intent bucket in banner variant", async () => {
    for (const sev of [Intent.Neutral, Intent.Info, Intent.Success, Intent.Warning, Intent.Error]) {
      const { captureCharFrame, renderOnce } = await testRender(
        () => (
          <Callout variant="banner" intent={sev}>
            <text>{`b-${sev}`}</text>
          </Callout>
        ),
        { width: 20, height: 1 },
      )
      await renderOnce()
      expect(captureCharFrame()).toContain(`b-${sev}`)
    }
  })
})
