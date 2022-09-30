import type { Fx } from './fx'

const FONT = '10px Georgia black'
const FX_NOT_DEFINED_COLOR = 'rgba(11, 13, 15, 0.3)'
const FX_COLOR = 'black'
const FX_LINE_WIDTH = 1

/**
 * Draw the cartesian axes of the fx on the canvas
 * @param  {Fx} fx [Function]
 * @param  {CanvasRenderingContext2D} ctx [Canvas context]
 */
export function drawFxAxes(ctx: CanvasRenderingContext2D, fx: Fx) {
  ctx.beginPath()
  ctx.fillStyle = FX_COLOR
  ctx.font = FONT
  ctx.strokeStyle = FX_COLOR
  ctx.lineWidth = FX_LINE_WIDTH

  // Calculate Origin y-coordinate position in px.
  let OrigY_px = ctx.canvas.height - 2 // Origin Y is outside the chart
  if (fx.yMax > 0 && fx.yMin < 0) {
    OrigY_px = scaleY(fx, 0, ctx)
  }
  // Draw x-axis
  ctx.moveTo(0, OrigY_px)
  ctx.lineTo(ctx.canvas.width, OrigY_px)
  ctx.stroke()

  // Calculate Origin x-coordinate position in px.
  let OrigX_px = 2 // Origin X is outside the chart
  if (fx.xMax > 0 && fx.xMin < 0) {
    OrigX_px = scaleX(fx, 0, ctx)
  }
  // Draw y-axis
  ctx.moveTo(0, OrigX_px)
  ctx.lineTo(OrigX_px, ctx.canvas.width)
  ctx.stroke()

  // Draw x-axis steps
  const xStep = Math.pow(10, Math.floor(Math.log10(fx.xInterval)))
  // https://math.stackexchange.com/a/3854112
  let currentXStep = xStep * (Math.floor(fx.xMin / xStep) + 1)
  while (currentXStep < fx.xMax) {
    const currentXStep_px = scaleX(fx, currentXStep, ctx)
    ctx.moveTo(currentXStep_px, OrigY_px + 2)
    ctx.lineTo(currentXStep_px, OrigY_px - 2)
    ctx.stroke()
    ctx.fillText(currentXStep.toString(), currentXStep_px - 4, OrigY_px - 5)
    ctx.fill()
    currentXStep += xStep
  }

  // Draw y-axis steps
  const yStep = Math.pow(10, Math.floor(Math.log10(fx.yInterval)))
  // https://math.stackexchange.com/a/3854112
  let currentYStep = yStep * (Math.floor(fx.yMin / xStep) + 1)
  while (currentYStep < fx.yMax) {
    const currentYStep_px = scaleY(fx, currentYStep, ctx)
    ctx.moveTo(OrigX_px - 2, currentYStep_px)
    ctx.lineTo(OrigX_px + 2, currentYStep_px)
    ctx.stroke()
    ctx.fillText(currentYStep_px.toString(), OrigY_px + 5, currentYStep_px - 4)
    ctx.fill()
    currentXStep += xStep
  }
  ctx.closePath()
}

/**
 * Draw the `fx` function on the canvas
 * @param  {Fx} fx [Function]
 * @param  {CanvasRenderingContext2D} ctx [Canvas context]
 */
export function drawFxPoints(fx: Fx, ctx: CanvasRenderingContext2D) {
  if (!fx.points) {
    throw Error('Fx must be evaluated before drawing it.')
  }

  ctx.beginPath()

  for (const [x, y] of fx.points) {
    if (isNaN(y)) {
      ctx.fillStyle = FX_NOT_DEFINED_COLOR
      ctx.fillRect(scaleX(fx, x, ctx), 0, 1, ctx.canvas.height)
      ctx.fill()
      continue
    }

    ctx.fillStyle = FX_COLOR
    ctx.arc(scaleX(fx, x, ctx), scaleY(fx, y, ctx), 2, 0, 2 * Math.PI)
    ctx.fill()
  }

  ctx.closePath()
}

/**
 * Get the canvas x-coordinate pixel corresponding to the
 * x-value passed by parameter.
 * @param  {Fx} fx [Function]
 * @param  {number} x [X value]
 * @param  {CanvasRenderingContext2D} ctx [Canvas context]
 */
export function scaleX(fx: Fx, x: number, ctx: CanvasRenderingContext2D) {
  return ((x - fx.xMin) / fx.xInterval) * ctx.canvas.width
}

/**
 * Get the canvas y-coordinate pixel corresponding to the
 * y-value passed by parameter.
 * @param  {Fx} fx [Function]
 * @param  {number} y [Y value]
 * @param  {CanvasRenderingContext2D} ctx [Canvas context]
 */
export function scaleY(fx: Fx, y: number, ctx: CanvasRenderingContext2D) {
  return ((fx.yMax - y) / fx.yInterval) * ctx.canvas.height
}
