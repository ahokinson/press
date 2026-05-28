import { BRAILLE_BASE, rasterize } from "@charts/braille.ts"
import { type OptimizedBuffer, Renderable, type RenderableOptions, type RenderContext, RGBA } from "@opentui/core"
import type { Theme } from "@theme/palette.ts"

export interface SparklineOptions extends RenderableOptions<SparklineRenderable> {
  values?: number[]
  upColor?: string
  downColor?: string
  /** When provided, seeds default colors from theme tokens before the hardcoded fallbacks. */
  theme?: Theme
}

/** 1-row inline braille sparkline. Effective resolution: width*2 × 4 sub-pixels. */
export class SparklineRenderable extends Renderable {
  private _values: number[] = []
  private _upColor: RGBA
  private _downColor: RGBA

  constructor(context: RenderContext, options: SparklineOptions) {
    super(context, options)
    this._values = options.values ?? []
    this._upColor = RGBA.fromHex(options.upColor ?? options.theme?.ok ?? "#7dd87a")
    this._downColor = RGBA.fromHex(options.downColor ?? options.theme?.err ?? "#ef6b6b")
  }

  get values(): number[] {
    return this._values
  }
  set values(next: number[]) {
    this._values = next
    this.requestRender()
  }

  protected override renderSelf(buffer: OptimizedBuffer): void {
    const width = this.width
    if (width <= 0 || this._values.length === 0) return

    const first = this._values[0]!
    const last = this._values[this._values.length - 1]!
    const color = last >= first ? this._upColor : this._downColor
    const transparent = RGBA.fromValues(0, 0, 0, 0)

    const grid = rasterize(this._values, width, 1)
    for (let x = 0; x < width; x++) {
      const bitMask = grid.cells[x]!
      if (bitMask === 0) continue
      buffer.setCellWithAlphaBlending(
        this.screenX + x,
        this.screenY,
        String.fromCharCode(BRAILLE_BASE | bitMask),
        color,
        transparent,
      )
    }
  }
}
