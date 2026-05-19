import { describe, expect, test } from "bun:test"
import { Field } from "@components/control/field.tsx"
import { testRender } from "@opentui/solid"

describe("Field", () => {
  test("renders label and child value", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Field label="Name">
          <text>Anders</text>
        </Field>
      ),
      { width: 30, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("Name")
    expect(frame).toContain("Anders")
  })

  test("respects labelWidth, labelColor, and bold", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Field label="Email" labelWidth={20} labelColor="#ff00ff" bold>
          <text>x@y.z</text>
        </Field>
      ),
      { width: 40, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("Email")
    expect(frame).toContain("x@y.z")
  })
})
