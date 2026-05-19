import { BRAILLE_BASE, rasterize } from "@charts/braille.ts"
import { type OptimizedBuffer, Renderable, type RenderableOptions, type RenderContext, RGBA } from "@opentui/core"

export interface SparklineOptions extends RenderableOptions<SparklineRenderable> {
  values?: number[]
  upColor?: string
  downColor?: string
}

/** 1-row inline braille sparkline. Effective resolution: width*2 × 4 sub-pixels. */
export class SparklineRenderable extends Renderable {
  private _values: number[] = []
  private _up: RGBA
  private _down: RGBA

  constructor(ctx: RenderContext, options: SparklineOptions) {
    super(ctx, options)
    this._values = options.values ?? []
    this._up = RGBA.fromHex(options.upColor ?? "#7dd87a")
    this._down = RGBA.fromHex(options.downColor ?? "#ef6b6b")
  }

  get values(): number[] {
    return this._values
  }
  set values(v: number[]) {
    this._values = v
    this.requestRender()
  }

  protected override renderSelf(buffer: OptimizedBuffer): void {
    const w = this.width
    if (w <= 0 || this._values.length === 0) return

    const first = this._values[0]!
    const last = this._values[this._values.length - 1]!
    const color = last >= first ? this._up : this._down
    const transparent = RGBA.fromValues(0, 0, 0, 0)

    const grid = rasterize(this._values, w, 1)
    for (let x = 0; x < w; x++) {
      const bits = grid.cells[x]!
      if (bits === 0) continue
      buffer.setCellWithAlphaBlending(
        this.screenX + x,
        this.screenY,
        String.fromCharCode(BRAILLE_BASE | bits),
        color,
        transparent,
      )
    }
  }
}
