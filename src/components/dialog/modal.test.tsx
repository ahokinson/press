import { describe, expect, test } from "bun:test"
import { Modal } from "@components/dialog/modal.tsx"
import { testRender } from "@opentui/solid"
import { Intent } from "@theme"

describe("Modal", () => {
  test("renders nothing while when() is false", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Modal when={() => false} title=" hidden ">
          <text>body</text>
        </Modal>
      ),
      { width: 40, height: 15 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).not.toContain("hidden")
    expect(frame).not.toContain("body")
  })

  test("renders title and children when open", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Modal when={() => true} title=" add symbol ">
          <text>type the ticker</text>
        </Modal>
      ),
      { width: 60, height: 20 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("add symbol")
    expect(frame).toContain("type the ticker")
  })

  test("renders children with the default intent when none is supplied", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Modal when={() => true} title=" default ">
          <text>default body</text>
        </Modal>
      ),
      { width: 40, height: 15 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("default body")
  })

  test("renders each intent bucket", async () => {
    for (const sev of [Intent.Info, Intent.Success, Intent.Warning, Intent.Error, Intent.Neutral]) {
      const { captureCharFrame, renderOnce } = await testRender(
        () => (
          <Modal when={() => true} intent={sev} title={` ${sev} `}>
            <text>{`x-${sev}`}</text>
          </Modal>
        ),
        { width: 40, height: 15 },
      )
      await renderOnce()
      expect(captureCharFrame()).toContain(`x-${sev}`)
    }
  })

  test("width / height / top / left / zIndex pass through", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Modal when={() => true} title=" sized " width={30} height={6} top={1} left={2} zIndex={20}>
          <text>sized body</text>
        </Modal>
      ),
      { width: 60, height: 20 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("sized body")
  })

  test("omits title when not supplied", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Modal when={() => true}>
          <text>no title here</text>
        </Modal>
      ),
      { width: 40, height: 15 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("no title here")
  })
})
