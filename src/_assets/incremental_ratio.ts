import { displayAlert } from './utils'
import { evaluate } from 'mathjs'
import { FxChart } from './fx_chart'

declare global {
  interface Window {
    fx: FxChart
    xFixed: number
    xMoving: number
    animationTimerId: NodeJS.Timer
  }
}

export function init() {
  const xMin = parseFloat(
    (document.querySelector('#xmin') as HTMLInputElement).value
  )
  const xMax = parseFloat(
    (document.querySelector('#xmax') as HTMLInputElement).value
  )
  const yMin = parseFloat(
    (document.querySelector('#ymin') as HTMLInputElement).value
  )
  const yMax = parseFloat(
    (document.querySelector('#ymax') as HTMLInputElement).value
  )
  const xFixed = parseFloat(
    (document.querySelector('#xfix') as HTMLInputElement).value
  )
  const xMoving = parseFloat(
    (document.querySelector('#xmov') as HTMLInputElement).value
  )
  const func = (document.querySelector('#function') as HTMLInputElement).value

  if (yMin < -1000 || xMax > 1000 || yMin < -1000 || yMax > 1000) {
    displayAlert('min_max')
    return
  }

  if (xMax - xMin <= 0) {
    displayAlert('axes')
    return
  }

  if (xFixed > xMax || xMoving > xMax || xFixed < xMin || xMoving < xMin) {
    displayAlert('xfis_xmob')
    return
  }

  try {
    evaluate(func, { x: 0 })
  } catch (e) {
    displayAlert('function')
    return
  }

  document.querySelector('#alert')!.classList.add('d-none')

  const fxCanvas: HTMLCanvasElement = document.querySelector('#fx')!
  const animCanvas: HTMLCanvasElement = document.querySelector('#animation')!
  const bufferCanvas: HTMLCanvasElement = document.querySelector('#buffer')!

  const fxCtx = fxCanvas.getContext('2d')!
  const animCtx = animCanvas.getContext('2d')!
  const bufferCtx = bufferCanvas.getContext('2d')!

  fxCtx.clearRect(0, 0, fxCtx.canvas.width, fxCtx.canvas.height)
  animCtx.clearRect(0, 0, animCtx.canvas.width, animCtx.canvas.height)
  bufferCtx.clearRect(0, 0, bufferCtx.canvas.width, bufferCtx.canvas.height)

  const resolution: [number, number] = [fxCtx.canvas.width, fxCtx.canvas.height]
  const fx = new FxChart(func, xMin, xMax, yMin, yMax, resolution)

  window.fx = fx
  window.xFixed = xFixed
  window.xMoving = xMoving

  fx.drawFxAxes(fxCtx)
  drawX0OnAxes(xFixed, fx, fxCtx)

  fx.evaluate()
  fx.drawFxPoints(fxCtx)

  const startAnimationBtn: HTMLButtonElement = document.querySelector('#start')!
  startAnimationBtn.disabled = true

  fxCanvas.removeEventListener(
    'mousemove',
    getCoordinatesAndDrawInteraction,
    true
  )
  fxCanvas.removeEventListener(
    'mousedown',
    getCoordinatesAndDrawInteraction,
    true
  )
  clearInterval(window.animationTimerId)

  let count = -1
  window.animationTimerId = setInterval(() => {
    count += 1
    drawAnimation(count)
  }, 10)
}

export function drawAnimation(frame: number) {
  const animCanvas: HTMLCanvasElement = document.querySelector('#animation')!
  const buffCanvas: HTMLCanvasElement = document.querySelector('#buffer')!

  let { fx, xFixed, xMoving } = window

  // To prevent flickering draw the frame on an invisible canvas and
  // switch visibility when frame is completed.
  let ctx: CanvasRenderingContext2D
  if (animCanvas.classList.contains('invisible')) {
    ctx = animCanvas.getContext('2d')!
  } else {
    ctx = buffCanvas.getContext('2d')!
  }

  const xConversionFactor = ctx.canvas.width / fx.xInterval
  const animationInterval = Math.abs(xFixed - xMoving)

  const framePx = frame + (fx.domain?.[0]?.from || 0)
  if (framePx >= animationInterval * xConversionFactor) {
    const startAnimationBtn: HTMLButtonElement =
      document.querySelector('#start')!
    startAnimationBtn.disabled = false

    const fxCanvas: HTMLCanvasElement = document.querySelector('#fx')!
    fxCanvas.addEventListener(
      'mousemove',
      getCoordinatesAndDrawInteraction,
      true
    )
    fxCanvas.addEventListener(
      'mousedown',
      getCoordinatesAndDrawInteraction,
      true
    )
    return
  }

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  const shift = framePx / xConversionFactor
  xMoving = xFixed < xMoving ? xMoving - shift : xMoving + shift
  const yFixed = evaluate(fx.fx, { x: xFixed })
  const yMoving = evaluate(fx.fx, { x: xMoving })

  const newInterval = Math.abs(xFixed - xMoving)
  let r = Math.round((framePx / (newInterval * xConversionFactor)) * 255)
  const color = `rgb(${r}, 10, 100)`

  drawLineBetweeen(fx, xFixed, yFixed, xMoving, yMoving, ctx, { color })
  fx.drawPoint(xMoving, yMoving, ctx)
  fx.drawPoint(xFixed, yFixed, ctx)

  animCanvas.classList.toggle('invisible')
  buffCanvas.classList.toggle('invisible')
}

export function drawInteraction(x: number) {
  const animCanvas: HTMLCanvasElement = document.querySelector('#animation')!
  const buffCanvas: HTMLCanvasElement = document.querySelector('#buffer')!

  let { fx, xFixed } = window

  let ctx: CanvasRenderingContext2D
  if (animCanvas.classList.contains('invisible')) {
    ctx = buffCanvas.getContext('2d')!
  } else {
    ctx = animCanvas.getContext('2d')!
  }
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  const xMoving = fx.XFromPx(x)

  const yFixed = evaluate(fx.fx, { x: xFixed })
  const yMoving = evaluate(fx.fx, { x: xMoving })

  const interval = Math.abs(xFixed - xMoving)

  let r = Math.round((1 - interval / (fx.xInterval / 2)) * 255)
  const color = `rgb(${r}, 10, 100)`

  drawLineBetweeen(fx, xFixed, yFixed, xMoving, yMoving, ctx, { color })
  fx.drawPoint(xMoving, yMoving, ctx)
  fx.drawPoint(xFixed, yFixed, ctx)
}

function drawLineBetweeen(
  fx: FxChart,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  ctx: CanvasRenderingContext2D,
  options: { color?: string; lineWidth?: number } = {}
) {
  let ftan = `(x-(${x0}))/((${x1})-(${x0}))*((${y1})-(${y0}))+(${y0})`
  ctx.strokeStyle = options.color || 'black'
  ctx.lineWidth = options.lineWidth || 2
  ctx.beginPath()
  ctx.moveTo(0, fx.YToPx(evaluate(ftan, { x: fx.xMin })))
  ctx.lineTo(ctx.canvas.width, fx.YToPx(evaluate(ftan, { x: fx.xMax })))
  ctx.stroke()
  ctx.closePath()
}

function drawX0OnAxes(X0: number, fx: FxChart, ctx: CanvasRenderingContext2D) {
  let X0_x = fx.XToPx(X0)

  let OrigY_px = ctx.canvas.height - 2 // Origin Y is outside the chart
  if (fx.yMax > 0 && fx.yMin < 0) {
    OrigY_px = fx.YToPx(0)
  }

  ctx.beginPath()
  ctx.fillStyle = 'black'
  ctx.font = '12px Georgia'
  ctx.moveTo(X0_x, OrigY_px + 2)
  ctx.lineTo(X0_x, OrigY_px - 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.fillText('x0', X0_x - 5, OrigY_px + 15)
  ctx.fill()
}

function getCoordinatesAndDrawInteraction(event: MouseEvent) {
  const animCanvas: HTMLCanvasElement = document.querySelector('#animation')!
  var rect = animCanvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  // const _y = event.clientY - rect.top
  drawInteraction(x)
}
