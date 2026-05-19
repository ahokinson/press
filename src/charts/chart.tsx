import { BRAILLE_BASE, rasterize } from "@charts/braille.ts"
import { type OptimizedBuffer, Renderable, type RenderableOptions, type RenderContext, RGBA } from "@opentui/core"

export interface RefLine {
  value: number
  color: string
  label?: string
}

/**
 * A point-of-interest annotation drawn over the chart line. Press's Chart does
 * not detect pivots/peaks itself — callers compute their own indices and pass
 * them in (e.g. pivot detection, signal triggers, event markers).
 */
export interface ChartMarker {
  /** Index into the `values` array. Out-of-range markers are skipped. */
  index: number
  /** Y value at this marker (used to position the glyph and label vertically). */
  value: number
  /** Single-character glyph (e.g. "▲", "▼", "●"). */
  glyph: string
  /** Hex color for both glyph and label. */
  color: string
  /** Optional label drawn next to the glyph. */
  label?: string
  /**
   * Whether the glyph sits above ("above") or below ("below") the line point.
   * Default "above".
   */
  side?: "above" | "below"
}

export interface ChartOptions extends RenderableOptions<ChartRenderable> {
  values?: number[]
  timestamps?: number[]
  upColor?: string
  downColor?: string
  axisColor?: string
  refColor?: string
  yMin?: number
  yMax?: number
  refLines?: RefLine[]
  markers?: ChartMarker[]
  /** Convert a timestamp into the short label drawn on the x-axis. Default `String(ts)`. */
  xLabel?: (ts: number) => string
  /** Convert a y value into the short label drawn on the y-axis. Default 2-decimal price-style. */
  yLabel?: (v: number) => string
}

const Y_AXIS_W = 7 // "999.99 "
const X_AXIS_H = 1 // x-axis line row
const X_LABEL_H = 1 // x-axis labels row

const TRANSPARENT = RGBA.fromValues(0, 0, 0, 0)

const defaultXLabel = (ts: number) => String(ts)

function defaultYLabel(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1000) return v.toFixed(0)
  return v.toFixed(2)
}

export class ChartRenderable extends Renderable {
  private _values: number[] = []
  private _timestamps: number[] = []
  private _upColor: RGBA
  private _downColor: RGBA
  private _axisColor: RGBA
  private _refColor: RGBA
  private _yMin?: number
  private _yMax?: number
  private _refLines: RefLine[] = []
  private _markers: ChartMarker[] = []
  private _xLabel: (ts: number) => string
  private _yLabel: (v: number) => string

  constructor(ctx: RenderContext, options: ChartOptions) {
    super(ctx, options)
    this._values = options.values ?? []
    this._timestamps = options.timestamps ?? []
    this._upColor = RGBA.fromHex(options.upColor ?? "#7dd87a")
    this._downColor = RGBA.fromHex(options.downColor ?? "#ef6b6b")
    this._axisColor = RGBA.fromHex(options.axisColor ?? "#666666")
    this._refColor = RGBA.fromHex(options.refColor ?? "#444444")
    this._yMin = options.yMin
    this._yMax = options.yMax
    this._refLines = options.refLines ?? []
    this._markers = options.markers ?? []
    this._xLabel = options.xLabel ?? defaultXLabel
    this._yLabel = options.yLabel ?? defaultYLabel
  }

  get values(): number[] {
    return this._values
  }
  set values(v: number[]) {
    this._values = v
    this.requestRender()
  }

  get timestamps(): number[] {
    return this._timestamps
  }
  set timestamps(v: number[]) {
    this._timestamps = v
    this.requestRender()
  }

  get upColor(): RGBA {
    return this._upColor
  }
  set upColor(v: string) {
    this._upColor = RGBA.fromHex(v)
    this.requestRender()
  }
  get downColor(): RGBA {
    return this._downColor
  }
  set downColor(v: string) {
    this._downColor = RGBA.fromHex(v)
    this.requestRender()
  }

  get yMin(): number | undefined {
    return this._yMin
  }
  set yMin(v: number | undefined) {
    this._yMin = v
    this.requestRender()
  }

  get yMax(): number | undefined {
    return this._yMax
  }
  set yMax(v: number | undefined) {
    this._yMax = v
    this.requestRender()
  }

  get refLines(): RefLine[] {
    return this._refLines
  }
  set refLines(v: RefLine[]) {
    this._refLines = v
    this.requestRender()
  }

  get markers(): ChartMarker[] {
    return this._markers
  }
  set markers(v: ChartMarker[]) {
    this._markers = v
    this.requestRender()
  }

  get xLabel(): (ts: number) => string {
    return this._xLabel
  }
  set xLabel(v: (ts: number) => string) {
    this._xLabel = v
    this.requestRender()
  }

  get yLabel(): (v: number) => string {
    return this._yLabel
  }
  set yLabel(v: (v: number) => string) {
    this._yLabel = v
    this.requestRender()
  }

  protected override renderSelf(buffer: OptimizedBuffer): void {
    const w = this.width
    const h = this.height
    if (w < Y_AXIS_W + 4 || h < X_AXIS_H + X_LABEL_H + 2) return

    const x0 = this.screenX
    const y0 = this.screenY

    const plotW = w - Y_AXIS_W - 1 // 1 col for the y-axis line itself
    const plotH = h - X_AXIS_H - X_LABEL_H
    const plotX = x0 + Y_AXIS_W
    const plotY = y0

    if (this._values.length === 0) {
      buffer.drawText("(no data)", plotX + Math.floor(plotW / 2) - 4, plotY + Math.floor(plotH / 2), this._axisColor)
      this.drawAxes(buffer, plotX, plotY, plotW)
      return
    }

    const first = this._values[0]!
    const last = this._values[this._values.length - 1]!
    const lineColor = last >= first ? this._upColor : this._downColor

    const grid = rasterize(this._values, plotW, plotH, this._yMin, this._yMax)

    // Use custom range if provided, otherwise data-derived range.
    const rangeMin = this._yMin ?? grid.min
    const rangeMax = this._yMax ?? grid.max

    // Reference line at the start-of-period value.
    if (rangeMax > rangeMin) {
      const refFrac = (first - rangeMin) / (rangeMax - rangeMin)
      const refSubY = plotH * 4 - 1 - Math.round(refFrac * (plotH * 4 - 1))
      const refRow = refSubY >> 2
      if (refRow >= 0 && refRow < plotH) {
        for (let x = 0; x < plotW; x++) {
          if (x % 2 === 0) {
            buffer.setCellWithAlphaBlending(plotX + x, plotY + refRow, "╌", this._refColor, TRANSPARENT)
          }
        }
      }
    }

    if (this._refLines.length > 0 && rangeMax > rangeMin) {
      this.drawRefLines(buffer, plotX, plotY, plotW, plotH, rangeMin, rangeMax)
    }

    // Braille line.
    for (let cy = 0; cy < plotH; cy++) {
      for (let cx = 0; cx < plotW; cx++) {
        const bits = grid.cells[cy * plotW + cx]!
        if (bits === 0) continue
        const ch = String.fromCharCode(BRAILLE_BASE | bits)
        buffer.setCellWithAlphaBlending(plotX + cx, plotY + cy, ch, lineColor, TRANSPARENT)
      }
    }

    if (this._markers.length > 0 && rangeMax > rangeMin) {
      this.drawMarkers(buffer, plotX, plotY, plotW, plotH, rangeMin, rangeMax)
    }

    this.drawAxes(buffer, plotX, plotY, plotW)
    this.drawYLabels(buffer, x0, plotY, plotH, rangeMin, rangeMax)
    this.drawXLabels(buffer, plotX, y0 + h - 1, plotW)
  }

  private drawRefLines(
    buffer: OptimizedBuffer,
    plotX: number,
    plotY: number,
    plotW: number,
    plotH: number,
    rangeMin: number,
    rangeMax: number,
  ): void {
    const span = rangeMax - rangeMin
    const usedRows = new Set<number>()
    for (const line of this._refLines) {
      if (!Number.isFinite(line.value)) continue
      if (line.value < rangeMin || line.value > rangeMax) continue
      const frac = (line.value - rangeMin) / span
      const subY = plotH * 4 - 1 - Math.round(frac * (plotH * 4 - 1))
      const row = subY >> 2
      if (row < 0 || row >= plotH || usedRows.has(row)) continue
      usedRows.add(row)
      const color = RGBA.fromHex(line.color)
      const label = line.label ?? ""
      const labelLen = label.length
      const labelStart = labelLen > 0 ? plotX + plotW - labelLen - 1 : plotX + plotW
      for (let x = 0; x < plotW; x++) {
        if (x % 2 !== 0) continue
        const cellX = plotX + x
        if (labelLen > 0 && cellX >= labelStart && cellX < labelStart + labelLen) continue
        buffer.setCellWithAlphaBlending(cellX, plotY + row, "╌", color, TRANSPARENT)
      }
      if (labelLen > 0 && labelStart >= plotX) {
        buffer.drawText(label, labelStart, plotY + row, color)
      }
    }
  }

  private drawMarkers(
    buffer: OptimizedBuffer,
    plotX: number,
    plotY: number,
    plotW: number,
    plotH: number,
    rangeMin: number,
    rangeMax: number,
  ): void {
    const span = rangeMax - rangeMin
    const n = this._values.length
    const subW = plotW * 2
    const subH = plotH * 4
    const lastIdx = Math.max(1, n - 1)

    let lastLabelEndX = -Infinity

    for (const m of this._markers) {
      if (m.index < 0 || m.index >= n) continue
      const subX = Math.round((m.index / lastIdx) * (subW - 1))
      const cellX = plotX + (subX >> 1)
      const frac = (m.value - rangeMin) / span
      const subY = subH - 1 - Math.round(frac * (subH - 1))
      const cellY = plotY + (subY >> 2)

      const side = m.side ?? "above"
      const color = RGBA.fromHex(m.color)
      const glyphY = side === "above" ? Math.max(plotY, cellY - 1) : Math.min(plotY + plotH - 1, cellY + 1)

      const label = m.label ?? ""
      const leftOf = cellX - label.length - 1
      const rightOf = cellX + 2
      let labelX: number | null = label.length === 0 ? cellX : null
      if (label.length > 0) {
        if (rightOf + label.length <= plotX + plotW && rightOf >= lastLabelEndX + 1) {
          labelX = rightOf
        } else if (leftOf >= plotX && leftOf >= lastLabelEndX + 1) {
          labelX = leftOf
        }
      }

      if (labelX === null) continue

      buffer.setCellWithAlphaBlending(cellX, glyphY, m.glyph, color, TRANSPARENT)
      if (label.length > 0) {
        buffer.drawText(label, labelX, glyphY, color)
        lastLabelEndX = labelX + label.length
      } else {
        lastLabelEndX = cellX + 1
      }
    }
  }

  private drawAxes(buffer: OptimizedBuffer, plotX: number, plotY: number, plotW: number): void {
    const axisY = plotY + (this.height - X_AXIS_H - X_LABEL_H)

    // Vertical axis just to the left of plot.
    for (let y = 0; y < this.height - X_AXIS_H - X_LABEL_H; y++) {
      buffer.setCellWithAlphaBlending(plotX - 1, plotY + y, "│", this._axisColor, TRANSPARENT)
    }
    // Corner.
    buffer.setCellWithAlphaBlending(plotX - 1, axisY, "└", this._axisColor, TRANSPARENT)
    // Horizontal axis.
    for (let x = 0; x < plotW; x++) {
      buffer.setCellWithAlphaBlending(plotX + x, axisY, "─", this._axisColor, TRANSPARENT)
    }
  }

  private drawYLabels(
    buffer: OptimizedBuffer,
    x0: number,
    plotY: number,
    plotH: number,
    min: number,
    max: number,
  ): void {
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min || plotH <= 0) return
    const range = max - min
    const step = niceStep(range, 4)
    const firstTick = Math.ceil(min / step) * step
    const usedRows = new Set<number>()
    for (let tick = firstTick; tick <= max + 1e-9; tick += step) {
      const frac = (max - tick) / range
      const y = plotY + Math.round(frac * (plotH - 1))
      if (y < plotY || y >= plotY + plotH) continue
      let row = y
      while (usedRows.has(row) && row < plotY + plotH - 1) row++
      if (usedRows.has(row)) continue
      usedRows.add(row)
      const text = this._yLabel(tick).padStart(Y_AXIS_W - 1, " ")
      buffer.drawText(text, x0, row, this._axisColor)
    }
  }

  private drawXLabels(buffer: OptimizedBuffer, plotX: number, labelY: number, plotW: number): void {
    if (this._timestamps.length === 0) return
    const tsFirst = this._timestamps[0]!
    const tsLast = this._timestamps[this._timestamps.length - 1]!
    const tsMid = this._timestamps[Math.floor(this._timestamps.length / 2)] ?? tsFirst

    const left = this._xLabel(tsFirst)
    const mid = this._xLabel(tsMid)
    const right = this._xLabel(tsLast)

    buffer.drawText(left, plotX, labelY, this._axisColor)
    buffer.drawText(mid, plotX + Math.floor(plotW / 2) - Math.floor(mid.length / 2), labelY, this._axisColor)
    buffer.drawText(right, plotX + plotW - right.length, labelY, this._axisColor)
  }
}

function niceStep(range: number, target: number): number {
  if (range <= 0 || target <= 0) return 1
  const rough = range / target
  const exp = Math.floor(Math.log10(rough))
  const base = 10 ** exp
  const norm = rough / base
  if (norm < 1.5) return base
  if (norm < 3) return 2 * base
  if (norm < 7) return 5 * base
  return 10 * base
}
