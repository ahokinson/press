import { BRAILLE_BASE, rasterize } from "@charts/braille.ts"
import { type OptimizedBuffer, Renderable, type RenderableOptions, type RenderContext, RGBA } from "@opentui/core"

export interface RefLine {
  value: number
  color: string
  label?: string
}

/** Vertical placement of a `ChartMarker` glyph relative to its line point. */
export enum MarkerSide {
  Above = "above",
  Below = "below",
}

/**
 * A point-of-interest annotation drawn over the chart line. Press's Chart
 * doesn't detect pivots or peaks itself; callers compute their own indices
 * and pass them in.
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
  /** Default `MarkerSide.Above`. */
  side?: MarkerSide
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
  /** Convert a timestamp into the short label drawn on the x-axis. Default `String(timestamp)`. */
  xLabel?: (timestamp: number) => string
  /** Convert a y value into the short label drawn on the y-axis. Default 2-decimal price-style. */
  yLabel?: (value: number) => string
}

const Y_AXIS_W = 7 // "999.99 "
const X_AXIS_H = 1 // x-axis line row
const X_LABEL_H = 1 // x-axis labels row

const TRANSPARENT = RGBA.fromValues(0, 0, 0, 0)

const defaultXLabel = (timestamp: number) => String(timestamp)

function defaultYLabel(value: number): string {
  const absolute = Math.abs(value)
  if (absolute >= 1000) return value.toFixed(0)
  return value.toFixed(2)
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
  private _xLabel: (timestamp: number) => string
  private _yLabel: (value: number) => string

  constructor(context: RenderContext, options: ChartOptions) {
    super(context, options)
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
  set values(next: number[]) {
    this._values = next
    this.requestRender()
  }

  get timestamps(): number[] {
    return this._timestamps
  }
  set timestamps(next: number[]) {
    this._timestamps = next
    this.requestRender()
  }

  get upColor(): RGBA {
    return this._upColor
  }
  set upColor(next: string) {
    this._upColor = RGBA.fromHex(next)
    this.requestRender()
  }
  get downColor(): RGBA {
    return this._downColor
  }
  set downColor(next: string) {
    this._downColor = RGBA.fromHex(next)
    this.requestRender()
  }

  get yMin(): number | undefined {
    return this._yMin
  }
  set yMin(next: number | undefined) {
    this._yMin = next
    this.requestRender()
  }

  get yMax(): number | undefined {
    return this._yMax
  }
  set yMax(next: number | undefined) {
    this._yMax = next
    this.requestRender()
  }

  get refLines(): RefLine[] {
    return this._refLines
  }
  set refLines(next: RefLine[]) {
    this._refLines = next
    this.requestRender()
  }

  get markers(): ChartMarker[] {
    return this._markers
  }
  set markers(next: ChartMarker[]) {
    this._markers = next
    this.requestRender()
  }

  get xLabel(): (timestamp: number) => string {
    return this._xLabel
  }
  set xLabel(next: (timestamp: number) => string) {
    this._xLabel = next
    this.requestRender()
  }

  get yLabel(): (value: number) => string {
    return this._yLabel
  }
  set yLabel(next: (value: number) => string) {
    this._yLabel = next
    this.requestRender()
  }

  protected override renderSelf(buffer: OptimizedBuffer): void {
    const width = this.width
    const height = this.height
    if (width < Y_AXIS_W + 4 || height < X_AXIS_H + X_LABEL_H + 2) return

    const originX = this.screenX
    const originY = this.screenY

    const plotWidth = width - Y_AXIS_W - 1 // 1 column for the y-axis line itself
    const plotHeight = height - X_AXIS_H - X_LABEL_H
    const plotX = originX + Y_AXIS_W
    const plotY = originY

    if (this._values.length === 0) {
      buffer.drawText(
        "(no data)",
        plotX + Math.floor(plotWidth / 2) - 4,
        plotY + Math.floor(plotHeight / 2),
        this._axisColor,
      )
      this.drawAxes(buffer, plotX, plotY, plotWidth)
      return
    }

    const first = this._values[0]!
    const last = this._values[this._values.length - 1]!
    const lineColor = last >= first ? this._upColor : this._downColor

    const grid = rasterize(this._values, plotWidth, plotHeight, this._yMin, this._yMax)

    // Use custom range if provided, otherwise data-derived range.
    const rangeMin = this._yMin ?? grid.min
    const rangeMax = this._yMax ?? grid.max

    // Reference line at the start-of-period value.
    if (rangeMax > rangeMin) {
      const referenceFraction = (first - rangeMin) / (rangeMax - rangeMin)
      const referenceSubPixelY = plotHeight * 4 - 1 - Math.round(referenceFraction * (plotHeight * 4 - 1))
      const referenceRow = referenceSubPixelY >> 2
      if (referenceRow >= 0 && referenceRow < plotHeight) {
        for (let x = 0; x < plotWidth; x++) {
          if (x % 2 === 0) {
            buffer.setCellWithAlphaBlending(plotX + x, plotY + referenceRow, "╌", this._refColor, TRANSPARENT)
          }
        }
      }
    }

    if (this._refLines.length > 0 && rangeMax > rangeMin) {
      this.drawRefLines(buffer, plotX, plotY, plotWidth, plotHeight, rangeMin, rangeMax)
    }

    // Braille line.
    for (let cellY = 0; cellY < plotHeight; cellY++) {
      for (let cellX = 0; cellX < plotWidth; cellX++) {
        const bitMask = grid.cells[cellY * plotWidth + cellX]!
        if (bitMask === 0) continue
        const character = String.fromCharCode(BRAILLE_BASE | bitMask)
        buffer.setCellWithAlphaBlending(plotX + cellX, plotY + cellY, character, lineColor, TRANSPARENT)
      }
    }

    if (this._markers.length > 0 && rangeMax > rangeMin) {
      this.drawMarkers(buffer, plotX, plotY, plotWidth, plotHeight, rangeMin, rangeMax)
    }

    this.drawAxes(buffer, plotX, plotY, plotWidth)
    this.drawYLabels(buffer, originX, plotY, plotHeight, rangeMin, rangeMax)
    this.drawXLabels(buffer, plotX, originY + height - 1, plotWidth)
  }

  private drawRefLines(
    buffer: OptimizedBuffer,
    plotX: number,
    plotY: number,
    plotWidth: number,
    plotHeight: number,
    rangeMin: number,
    rangeMax: number,
  ): void {
    const span = rangeMax - rangeMin
    const usedRows = new Set<number>()
    for (const line of this._refLines) {
      if (!Number.isFinite(line.value)) continue
      if (line.value < rangeMin || line.value > rangeMax) continue
      const fraction = (line.value - rangeMin) / span
      const subPixelY = plotHeight * 4 - 1 - Math.round(fraction * (plotHeight * 4 - 1))
      const row = subPixelY >> 2
      if (row < 0 || row >= plotHeight || usedRows.has(row)) continue
      usedRows.add(row)
      const color = RGBA.fromHex(line.color)
      const label = line.label ?? ""
      const labelLength = label.length
      const labelStart = labelLength > 0 ? plotX + plotWidth - labelLength - 1 : plotX + plotWidth
      for (let x = 0; x < plotWidth; x++) {
        if (x % 2 !== 0) continue
        const cellX = plotX + x
        if (labelLength > 0 && cellX >= labelStart && cellX < labelStart + labelLength) continue
        buffer.setCellWithAlphaBlending(cellX, plotY + row, "╌", color, TRANSPARENT)
      }
      if (labelLength > 0 && labelStart >= plotX) {
        buffer.drawText(label, labelStart, plotY + row, color)
      }
    }
  }

  private drawMarkers(
    buffer: OptimizedBuffer,
    plotX: number,
    plotY: number,
    plotWidth: number,
    plotHeight: number,
    rangeMin: number,
    rangeMax: number,
  ): void {
    const span = rangeMax - rangeMin
    const valueCount = this._values.length
    const subPixelWidth = plotWidth * 2
    const subPixelHeight = plotHeight * 4
    const lastIndex = Math.max(1, valueCount - 1)

    let lastLabelEndX = -Infinity

    for (const marker of this._markers) {
      if (marker.index < 0 || marker.index >= valueCount) continue
      const subPixelX = Math.round((marker.index / lastIndex) * (subPixelWidth - 1))
      const cellX = plotX + (subPixelX >> 1)
      const fraction = (marker.value - rangeMin) / span
      const subPixelY = subPixelHeight - 1 - Math.round(fraction * (subPixelHeight - 1))
      const cellY = plotY + (subPixelY >> 2)

      const side = marker.side ?? MarkerSide.Above
      const color = RGBA.fromHex(marker.color)
      const glyphY =
        side === MarkerSide.Above ? Math.max(plotY, cellY - 1) : Math.min(plotY + plotHeight - 1, cellY + 1)

      const label = marker.label ?? ""
      const leftOf = cellX - label.length - 1
      const rightOf = cellX + 2
      let labelX: number | null = label.length === 0 ? cellX : null
      if (label.length > 0) {
        if (rightOf + label.length <= plotX + plotWidth && rightOf >= lastLabelEndX + 1) {
          labelX = rightOf
        } else if (leftOf >= plotX && leftOf >= lastLabelEndX + 1) {
          labelX = leftOf
        }
      }

      if (labelX === null) continue

      buffer.setCellWithAlphaBlending(cellX, glyphY, marker.glyph, color, TRANSPARENT)
      if (label.length > 0) {
        buffer.drawText(label, labelX, glyphY, color)
        lastLabelEndX = labelX + label.length
      } else {
        lastLabelEndX = cellX + 1
      }
    }
  }

  private drawAxes(buffer: OptimizedBuffer, plotX: number, plotY: number, plotWidth: number): void {
    const axisY = plotY + (this.height - X_AXIS_H - X_LABEL_H)

    // Vertical axis just to the left of plot.
    for (let y = 0; y < this.height - X_AXIS_H - X_LABEL_H; y++) {
      buffer.setCellWithAlphaBlending(plotX - 1, plotY + y, "│", this._axisColor, TRANSPARENT)
    }
    // Corner.
    buffer.setCellWithAlphaBlending(plotX - 1, axisY, "└", this._axisColor, TRANSPARENT)
    // Horizontal axis.
    for (let x = 0; x < plotWidth; x++) {
      buffer.setCellWithAlphaBlending(plotX + x, axisY, "─", this._axisColor, TRANSPARENT)
    }
  }

  private drawYLabels(
    buffer: OptimizedBuffer,
    originX: number,
    plotY: number,
    plotHeight: number,
    minimum: number,
    maximum: number,
  ): void {
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum <= minimum || plotHeight <= 0) return
    const range = maximum - minimum
    const step = niceStep(range, 4)
    const firstTick = Math.ceil(minimum / step) * step
    const usedRows = new Set<number>()
    for (let tick = firstTick; tick <= maximum + 1e-9; tick += step) {
      const fraction = (maximum - tick) / range
      const y = plotY + Math.round(fraction * (plotHeight - 1))
      if (y < plotY || y >= plotY + plotHeight) continue
      let row = y
      while (usedRows.has(row) && row < plotY + plotHeight - 1) row++
      if (usedRows.has(row)) continue
      usedRows.add(row)
      const text = this._yLabel(tick).padStart(Y_AXIS_W - 1, " ")
      buffer.drawText(text, originX, row, this._axisColor)
    }
  }

  private drawXLabels(buffer: OptimizedBuffer, plotX: number, labelY: number, plotWidth: number): void {
    if (this._timestamps.length === 0) return
    const firstTimestamp = this._timestamps[0]!
    const lastTimestamp = this._timestamps[this._timestamps.length - 1]!
    const middleTimestamp = this._timestamps[Math.floor(this._timestamps.length / 2)] ?? firstTimestamp

    const leftLabel = this._xLabel(firstTimestamp)
    const middleLabel = this._xLabel(middleTimestamp)
    const rightLabel = this._xLabel(lastTimestamp)

    buffer.drawText(leftLabel, plotX, labelY, this._axisColor)
    buffer.drawText(
      middleLabel,
      plotX + Math.floor(plotWidth / 2) - Math.floor(middleLabel.length / 2),
      labelY,
      this._axisColor,
    )
    buffer.drawText(rightLabel, plotX + plotWidth - rightLabel.length, labelY, this._axisColor)
  }
}

function niceStep(range: number, target: number): number {
  if (range <= 0 || target <= 0) return 1
  const rough = range / target
  const exponent = Math.floor(Math.log10(rough))
  const base = 10 ** exponent
  const normalized = rough / base
  if (normalized < 1.5) return base
  if (normalized < 3) return 2 * base
  if (normalized < 7) return 5 * base
  return 10 * base
}
