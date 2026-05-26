import { type ChartOptions, ChartRenderable } from "@charts/chart.tsx"
import { type SparklineOptions, SparklineRenderable } from "@charts/sparkline.tsx"
import { extend } from "@opentui/solid"

declare module "@opentui/solid" {
  namespace JSX {
    interface IntrinsicElements {
      chart: ChartOptions & { ref?: (element: ChartRenderable) => void }
      sparkline: SparklineOptions & { ref?: (element: SparklineRenderable) => void }
    }
  }
}

let registered = false

/**
 * Register `<chart>` and `<sparkline>` as opentui-solid JSX intrinsics.
 * Idempotent. Called automatically on import so the JSX type augmentation
 * above and the runtime registration stay in sync.
 */
export function registerChartElements(): void {
  if (registered) return
  extend({ chart: ChartRenderable, sparkline: SparklineRenderable })
  registered = true
}

registerChartElements()
