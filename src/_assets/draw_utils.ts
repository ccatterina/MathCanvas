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
    OrigY_px = YToPx(fx, 0, ctx)
  }
  // Draw x-axis
  ctx.moveTo(0, OrigY_px)
  ctx.lineTo(ctx.canvas.width, OrigY_px)
  ctx.stroke()

  // Calculate Origin x-coordinate position in px.
  let OrigX_px = 2 // Origin X is outside the chart
  if (fx.xMax > 0 && fx.xMin < 0) {
    OrigX_px = XToPx(fx, 0, ctx)
  }
  // Draw y-axis
  ctx.moveTo(OrigX_px, 0)
  ctx.lineTo(OrigX_px, ctx.canvas.width)
  ctx.stroke()

  // Draw x-axis steps
  let d = -Math.floor(Math.log10(fx.xInterval))
  const xStep =
    d >= 0
      ? Math.ceil((fx.xInterval / 10) * Math.pow(10, d)) / Math.pow(10, d)
      : Math.ceil(fx.xInterval / (10 * -d))

  // https://math.stackexchange.com/a/3854112
  let currentXStep = xStep * (Math.floor(fx.xMin / xStep) + 1)
  while (currentXStep < fx.xMax) {
    const currentXStep_px = XToPx(fx, currentXStep, ctx)
    ctx.moveTo(currentXStep_px, OrigY_px + 2)
    ctx.lineTo(currentXStep_px, OrigY_px - 2)
    ctx.stroke()
    ctx.fillText(currentXStep.toString(), currentXStep_px - 4, OrigY_px - 5)
    ctx.fill()
    currentXStep += xStep
  }

  // Draw y-axis steps
  d = -Math.floor(Math.log10(fx.yInterval))
  const yStep =
    d >= 0
      ? Math.ceil((fx.yInterval / 10) * Math.pow(10, d)) / Math.pow(10, d)
      : Math.ceil(fx.yInterval / (10 * -d))

  // https://math.stackexchange.com/a/3854112
  let currentYStep = yStep * (Math.floor(fx.yMin / yStep) + 1)
  while (currentYStep < fx.yMax) {
    const currentYStep_px = YToPx(fx, currentYStep, ctx)
    ctx.moveTo(OrigX_px - 2, currentYStep_px)
    ctx.lineTo(OrigX_px + 2, currentYStep_px)
    ctx.stroke()
    ctx.fillText(currentYStep.toString(), OrigX_px + 5, currentYStep_px - 4)
    ctx.fill()
    currentYStep += yStep
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

  for (const [x, y] of fx.points) {
    if (isNaN(y)) {
      ctx.beginPath()
      ctx.fillStyle = FX_NOT_DEFINED_COLOR
      ctx.fillRect(XToPx(fx, x, ctx), 0, 1, ctx.canvas.height)
      ctx.fill()
      ctx.closePath()
      continue
    }

    ctx.beginPath()
    ctx.fillStyle = FX_COLOR
    ctx.arc(XToPx(fx, x, ctx), YToPx(fx, y, ctx), 2, 0, 2 * Math.PI)
    ctx.fill()
    ctx.closePath()
  }
}


export function drawPoint(
  fx: Fx,
  x: number,
  y: number,
  ctx: CanvasRenderingContext2D,
  options: { color?: string; size?: number } = {}
) {
  ctx.strokeStyle = options.color || 'black'
  const size = options.size || 2 * Math.PI
  ctx.beginPath()
  ctx.arc(XToPx(fx, x, ctx), YToPx(fx, y, ctx), 5, 0, size)
  ctx.fill()
  ctx.closePath()
}

/**
 * Get the canvas x-coordinate pixel corresponding to the
 * x-value passed by parameter.
 * @param  {Fx} fx [Function]
 * @param  {number} x [X value]
 * @param  {CanvasRenderingContext2D} ctx [Canvas context]
 */
export function XToPx(fx: Fx, x: number, ctx: CanvasRenderingContext2D) {
  return ((x - fx.xMin) / fx.xInterval) * ctx.canvas.width
}

/**
 * Get the canvas x-value corresponding to the x-coordiante
 * in pixel passed by parameter.
 * @param  {Fx} fx [Function]
 * @param  {number} x_px [X in pixel]
 * @param  {CanvasRenderingContext2D} ctx [Canvas context]
 */
export function XFromPx(fx: Fx, x_px: number, ctx: CanvasRenderingContext2D) {
  return (x_px * fx.xInterval) / ctx.canvas.width + fx.xMin
}

/**
 * Get the canvas y-coordinate pixel corresponding to the
 * y-value passed by parameter.
 * @param  {Fx} fx [Function]
 * @param  {number} y [Y value]
 * @param  {CanvasRenderingContext2D} ctx [Canvas context]
 */
export function YToPx(fx: Fx, y: number, ctx: CanvasRenderingContext2D) {
  return ((fx.yMax - y) / fx.yInterval) * ctx.canvas.height
}

/**
 * Get the canvas y-value corresponding to the y-coordiante
 * in pixel passed by parameter.
 * @param  {Fx} fx [Function]
 * @param  {number} y_px [Y in pixel]
 * @param  {CanvasRenderingContext2D} ctx [Canvas context]
 */
export function YFromPx(fx: Fx, y_px: number, ctx: CanvasRenderingContext2D) {
  return fx.yMax - (y_px * fx.yInterval) / ctx.canvas.height
}


// function getPosition(event) {
//   if (!$('#start').prop('disabled')) {
//     var x = new Number()
//     var y = new Number()
//     var canvas = document.getElementById('BackgroundFunction')
//     var menu = document.getElementById('menu')
//     var col = document.getElementById('col1')
//     if (event.x != undefined && event.y != undefined) {
//       x = event.pageX
//       y = event.pageY
//     } // Firefox method to get the position
//     else {
//       x =
//         event.clientX +
//         document.body.scrollLeft +
//         document.documentElement.scrollLeft
//       y =
//         event.clientY +
//         document.body.scrollTop +
//         document.documentElement.scrollTop
//     }

//     if (col.offsetWidth + canvas.offsetWidth < $(window).width())
//       x -= canvas.offsetLeft + col.offsetWidth + col.offsetLeft
//     else x -= canvas.offsetLeft
//     y -= canvas.offsetTop + menu.offsetHeight + menu.offsetTop

//     mouseX = x
//     mouseY = y
//     drawInteractive(mouseX, mouseY)
//   }
// }
// function drawSelector(
//   ctx,
//   canvas,
//   closed,
//   first_x_perc,
//   first_y_perc,
//   sec_y_perc
// ) {
//   ctx.beginPath()
//   ctx.strokeStyle = 'black'
//   ctx.moveTo(canvas.width * first_x_perc, canvas.height * first_y_perc)
//   if (closed)
//     ctx.lineTo(canvas.width * first_x_perc, canvas.height * sec_y_perc)
//   else
//     ctx.lineTo(
//       canvas.width * (first_x_perc - 0.02),
//       canvas.height * (sec_y_perc + 0.01)
//     )
//   ctx.moveTo(canvas.width * first_x_perc, canvas.height * first_y_perc)
//   // ctx.arc(canvas.width*first_x_perc,canvas.height*first_y_perc, 5, 0, 2 * Math.PI, false);
//   // ctx.fillStyle = 'black';
//   // ctx.fill();
//   ctx.closePath()
//   ctx.stroke()
// }
