import { type ChartOptions, ChartRenderable } from "@charts/chart.tsx"
import { type SparklineOptions, SparklineRenderable } from "@charts/sparkline.tsx"
import { extend } from "@opentui/solid"

declare module "@opentui/solid" {
  namespace JSX {
    interface IntrinsicElements {
      chart: ChartOptions & { ref?: (el: ChartRenderable) => void }
      sparkline: SparklineOptions & { ref?: (el: SparklineRenderable) => void }
    }
  }
}

let registered = false

/**
 * Register `<chart>` and `<sparkline>` as opentui-solid JSX intrinsics.
 * Idempotent. Called automatically when this module is imported so the JSX
 * type augmentation above and the runtime registration stay in sync — there
 * is no scenario where one is active without the other. Exported for callers
 * that want to force registration explicitly.
 */
export function registerChartElements(): void {
  if (registered) return
  extend({ chart: ChartRenderable, sparkline: SparklineRenderable })
  registered = true
}

registerChartElements()
