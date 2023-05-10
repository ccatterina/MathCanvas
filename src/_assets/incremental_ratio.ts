import { displayAlert } from './utils'
import { evaluate } from 'mathjs'
import config from './config'
import { FxChart } from './fx/fx'
import { drawOffscreenAndTransferTo } from './canvas_utils'

declare global {
  interface Window {
    fx: FxChart
    xFixed: number
    xMoving: number
    animationTimerId: NodeJS.Timer
  }
}

export function init() {
  const xMin = Number((document.querySelector('#xmin') as HTMLInputElement).value)
  const xMax = Number((document.querySelector('#xmax') as HTMLInputElement).value)
  const yMin = Number((document.querySelector('#ymin') as HTMLInputElement).value)
  const yMax = Number((document.querySelector('#ymax') as HTMLInputElement).value)
  const xFixed = Number((document.querySelector('#xfix') as HTMLInputElement).value)
  const xMoving = Number((document.querySelector('#xmov') as HTMLInputElement).value)
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

  const fxCtx = (document.querySelector('#fx-layer-0')! as HTMLCanvasElement).getContext('2d')!
  const fxFgCtx = (document.querySelector('#fx-layer-1')! as HTMLCanvasElement).getContext('2d')!
  fxCtx.clearRect(0, 0, fxCtx.canvas.width, fxCtx.canvas.height)
  fxFgCtx.clearRect(0, 0, fxFgCtx.canvas.width, fxFgCtx.canvas.height)

  const resolution: [number, number] = [fxCtx.canvas.width, fxCtx.canvas.height]
  const fx = new FxChart(func, resolution, xMin, xMax, yMin, yMax)

  window.fx = fx
  window.xFixed = xFixed
  window.xMoving = xMoving

  fx.drawAxesOnCanvas(fxCtx)
  drawX0OnAxes(xFixed, fx, fxCtx)
  fx.drawFxOnCanvas(fxCtx)

  const startAnimationBtn: HTMLButtonElement = document.querySelector('#start')!
  startAnimationBtn.disabled = true

  const fxFgCanvas: HTMLCanvasElement = document.querySelector('#fx-layer-1')!
  fxFgCanvas.removeEventListener('mousemove', getCoordinatesAndDrawInteraction, true)
  fxFgCanvas.removeEventListener('mousedown', getCoordinatesAndDrawInteraction, true)
  clearInterval(window.animationTimerId)

  let count = -1
  window.animationTimerId = setInterval(() => {
    count += 1
    drawAnimation(count)
  }, 10)
}

export function drawAnimation(frame: number) {
  let { fx, xFixed, xMoving } = window

  const animationInterval = Math.abs(fx.XToPx(xFixed) - fx.XToPx(xMoving))
  if (frame >= animationInterval) {
    const startAnimationBtn: HTMLButtonElement = document.querySelector('#start')!
    startAnimationBtn.disabled = false

    const fxFgCanvas: HTMLCanvasElement = document.querySelector('#fx-layer-1')!
    fxFgCanvas.addEventListener('mousemove', getCoordinatesAndDrawInteraction, true)
    fxFgCanvas.addEventListener('mousedown', getCoordinatesAndDrawInteraction, true)
    return
  }

  const fxFgCtx = (document.querySelector('#fx-layer-1')! as HTMLCanvasElement).getContext('2d')!

  const shift = frame * (fx.xInterval / fx.resolution[0])
  xMoving = xFixed < xMoving ? xMoving - shift : xMoving + shift
  const yFixed = evaluate(fx.fx, { x: xFixed })
  const yMoving = evaluate(fx.fx, { x: xMoving })
  const r = Math.round((frame / Math.abs(fx.XToPx(xFixed) - fx.XToPx(xMoving))) * 255)
  const color = `rgb(${r}, 10, 100)`

  drawOffscreenAndTransferTo(fxFgCtx, (ctx: CanvasRenderingContext2D) => {
    if (xMoving != xFixed) {
      drawLineBetweeen(fx, xFixed, yFixed, xMoving, yMoving, ctx, { color })
    } else {
      const eps = fx.xInterval * 1e-10
      const der = (evaluate(fx.fx, { x: xMoving + eps }) - evaluate(fx.fx, { x: xMoving })) / eps
      const m = der
      const q = evaluate(fx.fx, { x: xMoving }) - der * xMoving
      const p0: [number, number] = [(fx.yRangeFrom - q) / m, fx.yRangeFrom]
      const p1: [number, number] = [(fx.yRangeTo - q) / m, fx.yRangeTo]
      fx.drawLineSegmentOnCanvas(ctx, p0, p1, { color })
    }
    fx.drawPointOnCanvas(ctx, xMoving, yMoving)
    fx.drawPointOnCanvas(ctx, xFixed, yFixed)
  })
}

export function drawInteraction(x: number) {
  const { fx, xFixed } = window

  const fxFgCtx = (document.querySelector('#fx-layer-1')! as HTMLCanvasElement).getContext('2d')!

  const xMoving = fx.XFromPx(x)
  const yFixed = evaluate(fx.fx, { x: xFixed })
  const yMoving = evaluate(fx.fx, { x: xMoving })
  const r = Math.round((1 - Math.abs(xFixed - xMoving) / (fx.xInterval / 2)) * 255)
  const color = `rgb(${r}, 10, 100)`

  drawOffscreenAndTransferTo(fxFgCtx, (ctx: CanvasRenderingContext2D) => {
    if (xMoving != xFixed) {
      drawLineBetweeen(fx, xFixed, yFixed, xMoving, yMoving, ctx, { color })
    } else {
      const eps = fx.xInterval * 1e-10
      const der = (evaluate(fx.fx, { x: xMoving + eps }) - evaluate(fx.fx, { x: xMoving })) / eps
      const m = der
      const q = evaluate(fx.fx, { x: xMoving }) - der * xMoving
      const p0: [number, number] = [(fx.yRangeFrom - q) / m, fx.yRangeFrom]
      const p1: [number, number] = [(fx.yRangeTo - q) / m, fx.yRangeTo]
      fx.drawLineSegmentOnCanvas(ctx, p0, p1, { color })
    }
    fx.drawPointOnCanvas(ctx, xMoving, yMoving)
    fx.drawPointOnCanvas(ctx, xFixed, yFixed)
  })
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
  const ftan = `(x-(${x0}))/((${x1})-(${x0}))*((${y1})-(${y0}))+(${y0})`
  ctx.strokeStyle = options.color || config.FX_COLOR
  ctx.lineWidth = options.lineWidth || config.FX_THICKNESS
  ctx.beginPath()
  ctx.moveTo(0, fx.YToPx(evaluate(ftan, { x: fx.xMin })))
  ctx.lineTo(ctx.canvas.width, fx.YToPx(evaluate(ftan, { x: fx.xMax })))
  ctx.stroke()
}

function drawX0OnAxes(X0: number, fx: FxChart, ctx: CanvasRenderingContext2D) {
  const X0_px = fx.XToPx(X0)
  const OrigY_px = fx.Y0_px || fx.resolution[1] - 2

  ctx.beginPath()
  ctx.fillStyle = config.AXIS_COLOR
  ctx.font = '12px Georgia'
  ctx.moveTo(X0_px, OrigY_px + 2)
  ctx.lineTo(X0_px, OrigY_px - 2)
  ctx.stroke()
  ctx.fillText('x0', X0_px - 5, OrigY_px + 15)
}

function getCoordinatesAndDrawInteraction(event: MouseEvent) {
  const fxFgCanvas: HTMLCanvasElement = document.querySelector('#fx-layer-1')!
  var rect = fxFgCanvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  drawInteraction(x)
}
