import { describe, expect, test } from "bun:test"
import { Markdown } from "@markdown/render.tsx"
import { testRender } from "@opentui/solid"

describe("Markdown", () => {
  test("renders an ATX heading", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Markdown source={() => "# Welcome"} width={() => 40} />,
      { width: 40, height: 6 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("Welcome")
  })

  test("renders a paragraph with inline bold and code", async () => {
    const source = "This is **strong** and `code`."
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Markdown source={() => source} width={() => 60} />,
      { width: 60, height: 6 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("strong")
    expect(frame).toContain("code")
    // Marker characters do not leak into the rendered output
    expect(frame).not.toContain("**")
    expect(frame).not.toContain("`code`")
  })

  test("renders a fenced code block verbatim", async () => {
    const source = ["```ts", "const x = 1", "const y = 2", "```"].join("\n")
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Markdown source={() => source} width={() => 60} />,
      { width: 60, height: 8 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("const x = 1")
    expect(frame).toContain("const y = 2")
    expect(frame).not.toContain("```")
  })

  test("renders unordered list items with a bullet marker", async () => {
    const source = "- one\n- two\n- three"
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Markdown source={() => source} width={() => 40} />,
      { width: 40, height: 8 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("•")
    expect(frame).toContain("one")
    expect(frame).toContain("two")
    expect(frame).toContain("three")
  })

  test("renders ordered list items with numeric markers", async () => {
    const source = "1. first\n2. second"
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Markdown source={() => source} width={() => 40} />,
      { width: 40, height: 6 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("1.")
    expect(frame).toContain("2.")
    expect(frame).toContain("first")
    expect(frame).toContain("second")
  })

  test("renders a blockquote with a left gutter", async () => {
    const source = "> a note worth remembering"
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Markdown source={() => source} width={() => 40} />,
      { width: 40, height: 6 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("│")
    expect(frame).toContain("a note worth remembering")
  })

  test("renders a link as its label without the URL", async () => {
    const source = "Visit [the site](https://x.example/path)."
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Markdown source={() => source} width={() => 60} />,
      { width: 60, height: 6 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("the site")
    // URL should not appear in v1
    expect(frame).not.toContain("https://x.example/path")
  })

  test("wraps paragraph text to the supplied width", async () => {
    const source = "alpha bravo charlie delta echo foxtrot"
    const { captureCharFrame, renderOnce } = await testRender(
      () => <Markdown source={() => source} width={() => 16} />,
      { width: 20, height: 6 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("alpha bravo")
    expect(frame).toContain("foxtrot")
  })
})
