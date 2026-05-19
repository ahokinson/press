import { describe, expect, test } from "bun:test"
import type { SparklineRenderable } from "@charts/sparkline.tsx"
import { testRender } from "@opentui/solid"
import { createSignal } from "solid-js"
import "@charts/register.ts"

describe("Sparkline (renderable)", () => {
  test("renders braille glyphs for sample data", async () => {
    const values = [1, 2, 3, 4, 5, 4, 3, 2, 1]
    const { captureCharFrame, renderOnce } = await testRender(() => <sparkline values={values} width={20} />, {
      width: 30,
      height: 1,
    })
    await renderOnce()
    const frame = captureCharFrame()
    // Braille block starts at U+2800
    const hasBraille = Array.from(frame).some((ch) => {
      const code = ch.codePointAt(0) ?? 0
      return code >= 0x2800 && code <= 0x28ff
    })
    expect(hasBraille).toBe(true)
  })

  test("empty values renders nothing (smoke)", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <sparkline values={[]} width={10} />, {
      width: 20,
      height: 1,
    })
    await renderOnce()
    expect(typeof captureCharFrame()).toBe("string")
  })

  test("custom up/down colors are accepted", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <sparkline values={[5, 4, 3, 2, 1]} width={10} upColor="#00ff00" downColor="#ff0000" />,
      { width: 20, height: 1 },
    )
    await renderOnce()
    expect(typeof captureCharFrame()).toBe("string")
  })

  test("reactive values prop drives the getter/setter pair", async () => {
    const [values, setValues] = createSignal<number[]>([1, 2, 3])
    let ref: SparklineRenderable | undefined
    const { renderOnce } = await testRender(
      () => (
        <sparkline
          ref={(el) => {
            ref = el
          }}
          values={values()}
          width={10}
        />
      ),
      { width: 20, height: 1 },
    )
    await renderOnce()
    expect(ref?.values).toEqual([1, 2, 3])
    setValues([9, 8, 7])
    await renderOnce()
    expect(ref?.values).toEqual([9, 8, 7])
  })
})
