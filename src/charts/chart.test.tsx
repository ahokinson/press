import { describe, expect, test } from "bun:test"
import type { ChartRenderable } from "@charts/chart.tsx"
import { testRender } from "@opentui/solid"
import { createSignal } from "solid-js"
import "@charts/register.ts"

describe("Chart (renderable)", () => {
  test("renders an axis and braille line for sample data", async () => {
    const values = Array.from({ length: 50 }, (_, i) => Math.sin(i / 5) + 1)
    const { captureCharFrame, renderOnce } = await testRender(() => <chart values={values} width={40} height={10} />, {
      width: 50,
      height: 12,
    })
    await renderOnce()
    const frame = captureCharFrame()
    // y-axis vertical bar and x-axis horizontal bar should appear
    expect(frame).toContain("│")
    expect(frame).toContain("─")
  })

  test("renders '(no data)' message when values is empty", async () => {
    const { captureCharFrame, renderOnce } = await testRender(() => <chart values={[]} width={40} height={10} />, {
      width: 50,
      height: 12,
    })
    await renderOnce()
    expect(captureCharFrame()).toContain("(no data)")
  })

  test("supports refLines and markers props (smoke)", async () => {
    const values = [1, 2, 3, 4, 5, 4, 3, 2, 1]
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <chart
          values={values}
          width={40}
          height={10}
          refLines={[{ value: 3, color: "#ff0000", label: "avg" }]}
          markers={[{ index: 4, value: 5, glyph: "▲", color: "#00ff00", label: "peak" }]}
        />
      ),
      { width: 50, height: 12 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("avg")
    expect(frame).toContain("peak")
  })

  test("renders x-axis labels from timestamps + xLabel", async () => {
    const values = [1, 2, 3]
    const timestamps = [100, 200, 300]
    const { captureCharFrame, renderOnce } = await testRender(
      () => <chart values={values} timestamps={timestamps} width={30} height={8} xLabel={(ts) => `t${ts}`} />,
      { width: 40, height: 10 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("t100")
    expect(frame).toContain("t300")
  })

  test("yMin/yMax bound the range; tiny dimensions render nothing (smoke)", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => <chart values={[1, 2, 3]} width={3} height={2} yMin={0} yMax={10} />,
      { width: 20, height: 5 },
    )
    await renderOnce()
    // Just confirms no crash — too small to draw anything meaningful.
    expect(typeof captureCharFrame()).toBe("string")
  })

  test("reactive props drive every getter/setter pair on ChartRenderable", async () => {
    const [values, setValues] = createSignal<number[]>([1, 2, 3])
    const [timestamps, setTimestamps] = createSignal<number[]>([10, 20, 30])
    const [upColor, setUpColor] = createSignal<string>("#7dd87a")
    const [downColor, setDownColor] = createSignal<string>("#ef6b6b")
    const [yMin, setYMin] = createSignal<number | undefined>(undefined)
    const [yMax, setYMax] = createSignal<number | undefined>(undefined)
    const [refLines, setRefLines] = createSignal<{ value: number; color: string }[]>([])
    const [markers, setMarkers] = createSignal<{ index: number; value: number; glyph: string; color: string }[]>([])
    const [xLabel, setXLabel] = createSignal<(ts: number) => string>((ts) => String(ts))
    const [yLabel, setYLabel] = createSignal<(v: number) => string>((v) => v.toFixed(2))

    let chartRef: ChartRenderable | undefined
    const { renderOnce } = await testRender(
      () => (
        <chart
          ref={(el) => {
            chartRef = el
          }}
          values={values()}
          timestamps={timestamps()}
          upColor={upColor()}
          downColor={downColor()}
          yMin={yMin()}
          yMax={yMax()}
          refLines={refLines()}
          markers={markers()}
          xLabel={xLabel()}
          yLabel={yLabel()}
          width={40}
          height={10}
        />
      ),
      { width: 50, height: 12 },
    )
    await renderOnce()
    expect(chartRef).toBeDefined()

    // Read every getter to cover those branches.
    expect(chartRef!.values).toEqual([1, 2, 3])
    expect(chartRef!.timestamps).toEqual([10, 20, 30])
    expect(chartRef!.upColor).toBeDefined()
    expect(chartRef!.downColor).toBeDefined()
    expect(chartRef!.yMin).toBeUndefined()
    expect(chartRef!.yMax).toBeUndefined()
    expect(chartRef!.refLines).toEqual([])
    expect(chartRef!.markers).toEqual([])
    expect(typeof chartRef!.xLabel).toBe("function")
    expect(typeof chartRef!.yLabel).toBe("function")

    // Mutate every signal to cover the setters.
    setValues([4, 5, 6])
    setTimestamps([100, 200, 300])
    setUpColor("#00ff00")
    setDownColor("#ff0000")
    setYMin(0)
    setYMax(10)
    setRefLines([{ value: 5, color: "#0000ff" }])
    setMarkers([{ index: 0, value: 4, glyph: "▲", color: "#ffff00" }])
    setXLabel(() => (ts: number) => `t${ts}`)
    setYLabel(() => (v: number) => `$${v}`)
    await renderOnce()

    expect(chartRef!.values).toEqual([4, 5, 6])
    expect(chartRef!.timestamps).toEqual([100, 200, 300])
    expect(chartRef!.yMin).toBe(0)
    expect(chartRef!.yMax).toBe(10)
    expect(chartRef!.refLines).toEqual([{ value: 5, color: "#0000ff" }])
    expect(chartRef!.markers).toHaveLength(1)
  })
})
