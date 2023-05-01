import type { Fx } from './fx'

const FONT = '10px Georgia black'
const FX_NOT_DEFINED_COLOR = 'rgba(11, 13, 15, 0.3)'
const FX_COLOR = 'black'
const FX_LINE_WIDTH = 1

/**
 * Draw the cartesian axes of the fx on the canvas
 * @param  {CanvasRenderingContext2D} ctx [Canvas context]
 * @param  {Fx} fx [function]
 */
export function drawFxAxes(ctx: CanvasRenderingContext2D, fx: Fx) {
  if (fx.resolution[0] == ctx.canvas.width && fx.resolution[1] != ctx.canvas.height) {
    throw Error('Fx resolution must be equal to canvas resolution.')
  }

  ctx.beginPath()
  ctx.fillStyle = FX_COLOR
  ctx.font = FONT
  ctx.strokeStyle = FX_COLOR
  ctx.lineWidth = FX_LINE_WIDTH

  // Draw x-axis
  const OrigY_px = fx.Y0_px || ctx.canvas.height - 2
  ctx.moveTo(0, OrigY_px)
  ctx.lineTo(ctx.canvas.width, OrigY_px)
  ctx.stroke()

  // Draw y-axis
  const OrigX_px = fx.X0_px || 2
  ctx.moveTo(OrigX_px, 0)
  ctx.lineTo(OrigX_px, ctx.canvas.width)
  ctx.stroke()

  // Draw x-axis steps
  let orderOfMagnitude = Math.floor(Math.log10(fx.xInterval))
  let xStep = null
  if (orderOfMagnitude > 0) {
    xStep = Math.ceil(fx.xInterval / (10 * orderOfMagnitude))
  } else {
    xStep =
      Math.ceil((fx.xInterval / 10) * Math.pow(10, -orderOfMagnitude)) /
      Math.pow(10, -orderOfMagnitude)
  }

  // https://math.stackexchange.com/a/3854112
  let currentXStep = xStep * (Math.floor(fx.xMin / xStep) + 1)
  while (currentXStep < fx.xMax) {
    const currentXStep_px = fx.XToPx(currentXStep)
    ctx.moveTo(currentXStep_px, OrigY_px + 2)
    ctx.lineTo(currentXStep_px, OrigY_px - 2)
    ctx.stroke()
    ctx.fillText(
      (Math.round(currentXStep * 100) / 100).toString(),
      currentXStep_px - 4,
      OrigY_px - 5
    )
    ctx.fill()
    currentXStep += xStep
  }

  orderOfMagnitude = Math.floor(Math.log10(fx.yInterval))
  let yStep = null
  if (orderOfMagnitude > 0) {
    yStep = Math.ceil(fx.yInterval / (10 * orderOfMagnitude))
  } else {
    yStep =
      Math.ceil((fx.yInterval / 10) * Math.pow(10, -orderOfMagnitude)) /
      Math.pow(10, -orderOfMagnitude)
  }

  // https://math.stackexchange.com/a/3854112
  let currentYStep = yStep * (Math.floor(fx.yMin / yStep) + 1)
  while (currentYStep < fx.yMax) {
    const currentYStep_px = fx.YToPx(currentYStep)
    ctx.moveTo(OrigX_px - 2, currentYStep_px)
    ctx.lineTo(OrigX_px + 2, currentYStep_px)
    ctx.stroke()
    ctx.fillText(
      (Math.round(currentYStep * 100) / 100).toString(),
      OrigX_px + 5,
      currentYStep_px - 4
    )
    ctx.fill()
    currentYStep += yStep
  }
  ctx.closePath()
}

/**
 * Draw the `fx` function on the canvas
 * @param  {CanvasRenderingContext2D} ctx [Canvas context]
 * @param  {Fx} fx [function]
 */
export function drawFxPoints(ctx: CanvasRenderingContext2D, fx: Fx) {
  if (fx.resolution[0] == ctx.canvas.width && fx.resolution[1] != ctx.canvas.height) {
    throw Error('Fx resolution must be equal to canvas resolution.')
  }

  for (let i = 1; i < fx.points.length; i++) {
    const [x, y] = fx.points[i]!
    if (isNaN(y)) {
      ctx.beginPath()
      ctx.fillStyle = FX_NOT_DEFINED_COLOR
      ctx.fillRect(fx.XToPx(x), 0, 1, ctx.canvas.height)
      ctx.fill()
      ctx.closePath()
      continue
    }

    drawLineSegment(ctx, fx, fx.points[i - 1]!, [x, y])
  }
}

/**
 * Draw a line segment from p0 to p1.
 * @param  {CanvasRenderingContext2D} ctx [Canvas context]
 * @param  {Fx} fx [function]
 */
export function drawLineSegment(
  ctx: CanvasRenderingContext2D,
  fx: Fx,
  p0: [number, number],
  p1: [number, number],
  options: { color?: string; radius?: number } = {}
) {
  if (fx.resolution[0] == ctx.canvas.width && fx.resolution[1] != ctx.canvas.height) {
    throw Error('Fx resolution must be equal to canvas resolution.')
  }
  if (isNaN(p0[1]) || isNaN(p1[1])) {
    return
  }
  ctx.beginPath()
  ctx.strokeStyle = options.color || FX_COLOR
  ctx.lineWidth = options.radius || 2
  console.log(ctx)
  ctx.moveTo(fx.XToPx(p0[0]), fx.YToPx(p0[1]))
  ctx.lineTo(fx.XToPx(p1[0]), fx.YToPx(p1[1]))
  ctx.stroke()
}

/**
 * Draw a `fx` point on the canvas
 * @param  {CanvasRenderingContext2D} ctx [Canvas context]
 * @param  {Fx} fx [function]
 * @param  {number} x [x value]
 * @param  {number} y [y value]
 * @param  {object} options [options]
 */
export function drawFxPoint(
  ctx: CanvasRenderingContext2D,
  fx: Fx,
  x: number,
  y: number,
  options: { color?: string; radius?: number } = {}
) {
  if (fx.resolution[0] == ctx.canvas.width && fx.resolution[1] != ctx.canvas.height) {
    throw Error('Fx resolution must be equal to canvas resolution.')
  }

  const sAngle = 0
  const eAngle = 2 * Math.PI
  const radius = options.radius || 5
  ctx.beginPath()
  ctx.fillStyle = options.color || 'black'
  ctx.arc(fx.XToPx(x), fx.YToPx(y), radius, sAngle, eAngle)
  ctx.fill()
  ctx.closePath()
}

/**
 * Creates an offscreen canvas and passes its context to the draw
 * callback, then draw the content of the offscreen canvas
 * into the `destinationCtx`.
 * @param  {CanvasRenderingContext2D} destinationCtx [Canvas context]
 * @param  {Function} drawCallback [callback]
 */
export function drawOffscreenAndTransferTo(
  destinationCtx: CanvasRenderingContext2D,
  drawCallback: (ctx: CanvasRenderingContext2D) => void
) {
  const offscreenCanvas = document.createElement('canvas') as HTMLCanvasElement
  offscreenCanvas.width = destinationCtx.canvas.width
  offscreenCanvas.height = destinationCtx.canvas.height
  drawCallback(offscreenCanvas.getContext('2d')!)
  destinationCtx.clearRect(0, 0, destinationCtx.canvas.width, destinationCtx.canvas.height)
  destinationCtx.drawImage(offscreenCanvas, 0, 0)
}
