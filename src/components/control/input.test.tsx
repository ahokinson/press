import { describe, expect, test } from "bun:test"
import { InputBar } from "@components/control/input.tsx"
import { testRender } from "@opentui/solid"

describe("InputBar", () => {
  test("renders label, separator, buffer and cursor", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <InputBar label="search" buffer={() => "abc"} />, {
      width: 30,
      height: 1,
    })
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("search")
    expect(frame).toContain("›")
    expect(frame).toContain("abc")
    expect(frame).toContain("▎")
  })

  test("shows the placeholder when the buffer is empty", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <InputBar label="search" buffer={() => ""} placeholder="type to filter" />,
      { width: 40, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("type to filter")
  })

  test("respects custom cursor and separator", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <InputBar label="cmd" buffer={() => "ls"} cursor="|" separator=" $ " />,
      { width: 30, height: 1 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("cmd")
    expect(frame).toContain("$")
    expect(frame).toContain("ls")
    expect(frame).toContain("|")
  })

  test("renders trailing string content", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <InputBar label="q" buffer={() => "hello"} trailing={() => "(3 matches)"} />,
      { width: 40, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("(3 matches)")
  })

  test("renders trailing JSX content", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <InputBar label="q" buffer={() => "hi"} trailing={() => <text>JSX-TRAIL</text>} />,
      { width: 40, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("JSX-TRAIL")
  })
})
