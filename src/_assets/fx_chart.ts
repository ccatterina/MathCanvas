import { evaluate } from 'mathjs'

export type Domain = { from: number; to: number }[]

export class FxChart {
  FONT = '10px Georgia black'
  FX_NOT_DEFINED_COLOR = 'rgba(11, 13, 15, 0.3)'
  FX_COLOR = 'black'
  FX_LINE_WIDTH = 1

  private _fx: string
  private _xMin: number
  private _xMax: number
  private _yMin: number
  private _yMax: number
  private _xInterval: number
  private _yInterval: number
  private _resolution: [number, number]
  private _domain?: Domain | undefined
  private _isLimited?: Boolean | undefined
  private _points?: [number, number][] | undefined

  get fx() {
    return this._fx
  }

  get xMin() {
    return this._xMin
  }

  get xMax() {
    return this._xMax
  }

  get yMin() {
    return this._yMin
  }

  get yMax() {
    return this._yMax
  }

  get xInterval() {
    return this._xInterval
  }

  get yInterval() {
    return this._yInterval
  }

  get domain() {
    return this._domain
  }

  get isLimited() {
    return this._isLimited
  }

  get points() {
    return this._points
  }

  get resolution() {
    return this._resolution
  }

  constructor(
    fx: string,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    resolution: [number, number]
  ) {
    this._fx = fx
    this._xMin = xMin
    this._xMax = xMax
    this._yMin = yMin
    this._yMax = yMax
    this._xInterval = xMax - xMin
    this._yInterval = yMax - yMin
    this._resolution = resolution
  }

  evaluate() {
    const domain: Domain = []
    const points: [number, number][] = []
    let isLimited = true

    for (let x_px = 0; x_px <= this.resolution[0]; x_px++) {
      const x = (x_px * this.xInterval) / this.resolution[0] + this.xMin
      const y = evaluate(this.fx, { x })

      points.push([x, y])

      if (!isFinite(y)) {
        isLimited = false
      }

      if (!isNaN(y)) {
        if (!domain[domain.length - 1]) {
          domain.push({ from: x_px, to: x_px })
        }
        domain[domain.length - 1]!.to = x_px
      }
    }
    this._isLimited = isLimited
    this._points = points
    this._domain = domain
  }

  /**
   * Draw the cartesian axes of the fx on the canvas
   * @param  {CanvasRenderingContext2D} ctx [Canvas context]
   */
  drawFxAxes(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    ctx.fillStyle = this.FX_COLOR
    ctx.font = this.FONT
    ctx.strokeStyle = this.FX_COLOR
    ctx.lineWidth = this.FX_LINE_WIDTH

    // Calculate Origin y-coordinate position in px.
    let OrigY_px = ctx.canvas.height - 2 // Origin Y is outside the chart
    if (this.yMax > 0 && this.yMin < 0) {
      OrigY_px = this.YToPx(0)
    }
    // Draw x-axis
    ctx.moveTo(0, OrigY_px)
    ctx.lineTo(ctx.canvas.width, OrigY_px)
    ctx.stroke()

    // Calculate Origin x-coordinate position in px.
    let OrigX_px = 2 // Origin X is outside the chart
    if (this.xMax > 0 && this.xMin < 0) {
      OrigX_px = this.XToPx(0)
    }
    // Draw y-axis
    ctx.moveTo(OrigX_px, 0)
    ctx.lineTo(OrigX_px, ctx.canvas.width)
    ctx.stroke()

    // Draw x-axis steps
    let orderOfMagnitude = Math.floor(Math.log10(this.xInterval))
    let xStep = null;
    if (orderOfMagnitude > 0) {
      xStep = Math.ceil(this.xInterval / (10 * orderOfMagnitude))
    } else {
      xStep = Math.ceil((this.xInterval / 10) * Math.pow(10, -orderOfMagnitude)) / Math.pow(10, -orderOfMagnitude)
    }

    // https://math.stackexchange.com/a/3854112
    let currentXStep = xStep * (Math.floor(this.xMin / xStep) + 1)
    while (currentXStep < this.xMax) {
      const currentXStep_px = this.XToPx(currentXStep)
      ctx.moveTo(currentXStep_px, OrigY_px + 2)
      ctx.lineTo(currentXStep_px, OrigY_px - 2)
      ctx.stroke()
      ctx.fillText((Math.round(currentXStep * 100) / 100).toString(), currentXStep_px - 4, OrigY_px - 5)
      ctx.fill()
      currentXStep += xStep
    }

    orderOfMagnitude = Math.floor(Math.log10(this.yInterval))
    let yStep = null;
    if (orderOfMagnitude > 0) {
      yStep = Math.ceil(this.yInterval / (10 * orderOfMagnitude))
    } else {
      yStep = Math.ceil((this.yInterval / 10) * Math.pow(10, -orderOfMagnitude)) / Math.pow(10, -orderOfMagnitude)
    }

    // https://math.stackexchange.com/a/3854112
    let currentYStep = yStep * (Math.floor(this.yMin / yStep) + 1)
    while (currentYStep < this.yMax) {
      const currentYStep_px = this.YToPx(currentYStep)
      ctx.moveTo(OrigX_px - 2, currentYStep_px)
      ctx.lineTo(OrigX_px + 2, currentYStep_px)
      ctx.stroke()
      ctx.fillText((Math.round(currentYStep * 100) / 100).toString(), OrigX_px + 5, currentYStep_px - 4)
      ctx.fill()
      currentYStep += yStep
    }
    ctx.closePath()
  }

  /**
   * Draw the `fx` function on the canvas
   * @param  {CanvasRenderingContext2D} ctx [Canvas context]
   */
  drawFxPoints(ctx: CanvasRenderingContext2D) {
    if (!this.points) {
      throw Error('Fx must be evaluated before drawing it.')
    }

    for (const [x, y] of this.points) {
      if (isNaN(y)) {
        ctx.beginPath()
        ctx.fillStyle = this.FX_NOT_DEFINED_COLOR
        ctx.fillRect(this.XToPx(x), 0, 1, ctx.canvas.height)
        ctx.fill()
        ctx.closePath()
        continue
      }

      ctx.beginPath()
      ctx.fillStyle = this.FX_COLOR
      ctx.arc(this.XToPx(x), this.YToPx(y), 2, 0, 2 * Math.PI)
      ctx.fill()
      ctx.closePath()
    }
  }

  drawPoint(
    x: number,
    y: number,
    ctx: CanvasRenderingContext2D,
    options: { color?: string; radius?: number } = {}
  ) {
    const sAngle = 0
    const eAngle = 2 * Math.PI
    const radius = options.radius || 5
    ctx.beginPath()
    ctx.fillStyle = options.color || 'black'
    ctx.arc(this.XToPx(x), this.YToPx(y), radius, sAngle, eAngle)
    ctx.fill()
    ctx.closePath()
  }

  /**
   * Get the x-coordinate pixel corresponding to the function
   * x-value passed by parameter.
   * @param  {number} x [X value]
   */
  XToPx(x: number) {
    return ((x - this.xMin) / this.xInterval) * this.resolution[0]
  }

  /**
   * Get the function x-value corresponding to the x-coordiante
   * in pixel passed by parameter.
   * @param  {number} x_px [X in pixel]
   */
  XFromPx(x_px: number) {
    return (x_px * this.xInterval) / this.resolution[0] + this.xMin
  }

  /**
   * Get the y-coordinate pixel corresponding to the function
   * y-value passed by parameter.
   * @param  {number} y [Y value]
   */
  YToPx(y: number) {
    return ((this.yMax - y) / this.yInterval) * this.resolution[1]
  }

  /**
   * Get the function y-value corresponding to the y-coordiante
   * in pixel passed by parameter.
   * @param  {number} y_px [Y in pixel]
   */
  YFromPx(y_px: number) {
    return this.yMax - (y_px * this.yInterval) / this.resolution[1]
  }
}
