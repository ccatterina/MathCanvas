import { evaluate } from 'mathjs'
import config from '../config'

export type Domain = { from: number; to: number }[]
export type Point = [number, number]

export class FxChart {
  readonly fx: string
  readonly xMin: number
  readonly xMax: number
  readonly yMin: number
  readonly yMax: number
  readonly xRangeFrom: number
  readonly xRangeTo: number
  readonly yRangeFrom: number
  readonly yRangeTo: number
  readonly resolution: [number, number]
  readonly domain: Domain
  readonly isLimited: boolean
  readonly points: Point[]

  get xInterval() {
    return this.xRangeTo - this.xRangeFrom
  }

  get yInterval() {
    return this.yRangeTo - this.yRangeFrom
  }

  get X0_px() {
    return this.xRangeTo > 0 && this.xRangeFrom < 0 ? this.XToPx(0) : null
  }

  get Y0_px() {
    return this.yRangeTo > 0 && this.yRangeFrom < 0 ? this.YToPx(0) : null
  }

  constructor(
    fx: string,
    resolution: [number, number],
    xRangeFrom: number,
    xRangeTo: number,
    yRangeFrom: number | undefined = undefined,
    yRangeTo: number | undefined = undefined,
    evaluateOptions: Record<string, string> = {}
  ) {
    this.fx = fx
    this.resolution = resolution

    this.xMin = this.xRangeFrom = xRangeFrom
    this.xMax = this.xRangeTo = xRangeTo

    this.points = this.evaluate(evaluateOptions)

    this.isLimited = this.points.every(([_, y]) => isNaN(y) || isFinite(y))
    this.domain = this.getDomain(this.points)

    const points = this.points.map(([_, y]) => y).filter((y) => !isNaN(y) && isFinite(y))
    this.yMin = Math.min(...points)
    this.yMax = Math.max(...points)

    if (yRangeFrom != undefined && yRangeTo != undefined) {
      this.yRangeFrom = yRangeFrom
      this.yRangeTo = yRangeTo
    } else {
      const padding = (this.yMax - this.yMin > 0 ? this.yMax - this.yMin : 1) / 2
      this.yRangeFrom = this.yMin - padding
      this.yRangeTo = this.yMax + padding
    }
  }

  protected getDomain(points: Point[]) {
    return points.reduce((domain: Domain, [x, y]) => {
      if (!isNaN(y)) {
        if (!domain[domain.length - 1]) {
          domain.push({ from: x, to: x })
        }
        domain[domain.length - 1]!.to = x
      }
      return domain
    }, [])
  }

  protected evaluate(_options: Record<string, string>): Point[] {
    const points: [number, number][] = []

    for (let x_px = 0; x_px <= this.resolution[0]; x_px++) {
      const x = this.XFromPx(x_px)
      const y = evaluate(this.fx, { x })
      points.push([x, y])
    }
    return points
  }

  /**
   * Get the x-coordinate pixel corresponding to the function
   * x-value passed by parameter.
   * @param  {number} x [X value]
   */
  XToPx(x: number) {
    return ((x - this.xRangeFrom) / this.xInterval) * this.resolution[0]
  }

  /**
   * Get the function x-value corresponding to the x-coordiante
   * in pixel passed by parameter.
   * @param  {number} x_px [X in pixel]
   */
  XFromPx(x_px: number) {
    return (x_px * this.xInterval) / this.resolution[0] + this.xRangeFrom
  }

  /**
   * Get the y-coordinate pixel corresponding to the function
   * y-value passed by parameter.
   * @param  {number} y [Y value]
   */
  YToPx(y: number) {
    return ((this.yRangeTo - y) / this.yInterval) * this.resolution[1]
  }

  /**
   * Get the function y-value corresponding to the y-coordiante
   * in pixel passed by parameter.
   * @param  {number} y_px [Y in pixel]
   */
  YFromPx(y_px: number) {
    return this.yRangeTo - (y_px * this.yInterval) / this.resolution[1]
  }

  checkCanvasCtxCompatibility(ctx: CanvasRenderingContext2D) {
    if (this.resolution[0] == ctx.canvas.width && this.resolution[1] != ctx.canvas.height) {
      throw Error('FxChart resolution must be equal to canvas resolution.')
    }
  }

  /**
   * Draw the cartesian axes of the fx on the canvas.
   * @param  {CanvasRenderingContext2D} ctx [Canvas context]
   */
  drawAxesOnCanvas(ctx: CanvasRenderingContext2D) {
    this.checkCanvasCtxCompatibility(ctx)

    ctx.beginPath()
    ctx.fillStyle = config.AXIS_COLOR
    ctx.font = config.FONT
    ctx.strokeStyle = config.AXIS_COLOR
    ctx.lineWidth = config.AXIS_THICKNESS

    // Draw x-axis
    const OrigY_px = this.Y0_px || ctx.canvas.height - 2
    ctx.moveTo(0, OrigY_px)
    ctx.lineTo(ctx.canvas.width, OrigY_px)
    ctx.stroke()

    // Draw y-axis
    const OrigX_px = this.X0_px || 2
    ctx.moveTo(OrigX_px, 0)
    ctx.lineTo(OrigX_px, ctx.canvas.width)
    ctx.stroke()

    // Draw x-axis steps
    let orderOfMagnitude = Math.floor(Math.log10(this.xInterval))
    let xStep: number
    if (orderOfMagnitude > 0) {
      xStep = Math.ceil(this.xInterval / (10 * orderOfMagnitude))
    } else {
      xStep =
        Math.ceil((this.xInterval / 10) * Math.pow(10, -orderOfMagnitude)) /
        Math.pow(10, -orderOfMagnitude)
    }

    // https://math.stackexchange.com/a/3854112
    let currentXStep = xStep * (Math.floor(this.xRangeFrom / xStep) + 1)
    while (currentXStep < this.xRangeTo) {
      const currentXStep_px = this.XToPx(currentXStep)
      ctx.moveTo(currentXStep_px, OrigY_px + 2)
      ctx.lineTo(currentXStep_px, OrigY_px - 2)
      ctx.stroke()
      ctx.fillText(
        (Math.round(currentXStep * 100) / 100).toString(),
        currentXStep_px - 4,
        OrigY_px - 5
      )
      currentXStep += xStep
    }

    // Draw y-axis steps
    orderOfMagnitude = Math.floor(Math.log10(this.yInterval))
    let yStep: number
    if (orderOfMagnitude > 0) {
      yStep = Math.ceil(this.yInterval / (10 * orderOfMagnitude))
    } else {
      yStep =
        Math.ceil((this.yInterval / 10) * Math.pow(10, -orderOfMagnitude)) /
        Math.pow(10, -orderOfMagnitude)
    }

    // https://math.stackexchange.com/a/3854112
    let currentYStep = yStep * (Math.floor(this.yRangeFrom / yStep) + 1)
    while (currentYStep < this.yRangeTo) {
      const currentYStep_px = this.YToPx(currentYStep)
      ctx.moveTo(OrigX_px - 2, currentYStep_px)
      ctx.lineTo(OrigX_px + 2, currentYStep_px)
      ctx.stroke()
      ctx.fillText(
        (Math.round(currentYStep * 100) / 100).toString(),
        OrigX_px + 5,
        currentYStep_px - 4
      )
      currentYStep += yStep
    }
  }

  /**
   * Draw the `fx` function on the canvas.
   * @param  {CanvasRenderingContext2D} ctx [Canvas context]
   */
  drawFxOnCanvas(ctx: CanvasRenderingContext2D) {
    this.checkCanvasCtxCompatibility(ctx)

    for (let i = 1; i < this.points.length; i++) {
      const [x, y] = this.points[i]!
      if (isNaN(y)) {
        ctx.beginPath()
        ctx.fillStyle = config.FX_NOT_DEFINED_COLOR
        ctx.fillRect(this.XToPx(x), 0, 1, ctx.canvas.height)
        continue
      }

      this.drawLineSegmentOnCanvas(ctx, this.points[i - 1]!, [x, y])
    }
  }

  /**
   * Draw a line segment from p0 to p1 on the canvas.
   * @param  {CanvasRenderingContext2D} ctx [Canvas context]
   */
  drawLineSegmentOnCanvas(
    ctx: CanvasRenderingContext2D,
    p0: Point,
    p1: Point,
    options: { color?: string; radius?: number } = {}
  ) {
    this.checkCanvasCtxCompatibility(ctx)

    if (isNaN(p0[1]) || isNaN(p1[1])) {
      return
    }
    ctx.beginPath()
    ctx.strokeStyle = options.color || config.FX_COLOR
    ctx.lineWidth = options.radius || config.FX_THICKNESS
    ctx.moveTo(this.XToPx(p0[0]), this.YToPx(p0[1]))
    ctx.lineTo(this.XToPx(p1[0]), this.YToPx(p1[1]))
    ctx.stroke()
  }

  /**
   * Draw a `fx` point on the canvas.
   * @param  {CanvasRenderingContext2D} ctx [Canvas context]
   * @param  {number} x [x value]
   * @param  {number} y [y value]
   * @param  {object} options [options]
   */
  drawPointOnCanvas(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    options: { color?: string; radius?: number } = {}
  ) {
    this.checkCanvasCtxCompatibility(ctx)

    const sAngle = 0
    const eAngle = 2 * Math.PI
    const radius = options.radius || 5
    ctx.beginPath()
    ctx.fillStyle = options.color || config.FX_COLOR
    ctx.arc(this.XToPx(x), this.YToPx(y), radius, sAngle, eAngle)
    ctx.fill()
  }
}
