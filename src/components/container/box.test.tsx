import { describe, expect, test } from "bun:test"
import { Box } from "@components/container/box.tsx"
import { testRender } from "@opentui/solid"

describe("Box", () => {
  test("renders children without a title", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Box>
          <text>inside</text>
        </Box>
      ),
      { width: 20, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("inside")
  })

  test("renders title string in the header bar", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Box title="Settings" />,
      { width: 25, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("Settings")
  })

  test("renders optional description below title", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Box title="Settings" description="tweak options" />,
      { width: 25, height: 6 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("Settings")
    expect(frame).toContain("tweak options")
  })

  test("accepts a JSX title", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Box title={<text>Custom</text>} />,
      { width: 25, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("Custom")
  })

  test("focused() changes border color", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Box focused={() => true} padding={1}>
          <text>focused</text>
        </Box>
      ),
      { width: 20, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("focused")
  })

  test("unfocused renders with faint border", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Box focused={() => false} padding={1}>
          <text>bordered</text>
        </Box>
      ),
      { width: 20, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("bordered")
  })

  test("no focused prop renders with faint border", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Box>
          <text>static</text>
        </Box>
      ),
      { width: 20, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("static")
  })

  test("title in the border when no title prop", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Box title="files">
          <text>x</text>
        </Box>
      ),
      { width: 20, height: 5 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("files")
  })
})
