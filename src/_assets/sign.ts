import { displayAlert } from './utils'
import { FxChart } from './fx/fx'
import { DerivativeFxChart } from './fx/derivative_fx'
import { evaluate } from 'mathjs'
import { drawOffscreenAndTransferTo } from './canvas_utils'
import config from './config'

declare global {
  interface Window {
    fx: FxChart
    fx2: FxChart
    animationTimerId: NodeJS.Timer
  }
}

function getCoordinatesAndDrawInteraction(event: MouseEvent) {
  const fxFgCanvas: HTMLCanvasElement = document.querySelector('#fx-layer-1')!
  const rect = fxFgCanvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  drawInteraction(x)
}

export function init() {
  const xMin = Number((document.querySelector('#xmin') as HTMLInputElement).value)
  const xMax = Number((document.querySelector('#xmax') as HTMLInputElement).value)
  const yMin = Number((document.querySelector('#ymin') as HTMLInputElement).value)
  const yMax = Number((document.querySelector('#ymax') as HTMLInputElement).value)
  const manualYAxes = (document.querySelector('#check_man_axes') as HTMLInputElement).checked
  const func = (document.querySelector('#function') as HTMLInputElement).value
  let yMin2, yMax2
  if (manualYAxes) {
    yMin2 = Number((document.querySelector('#ymin_2') as HTMLInputElement).value)
    yMax2 = Number((document.querySelector('#ymax_2') as HTMLInputElement).value)
  }

  if (yMin < -1000 || xMax > 1000 || yMin < -1000 || yMax > 1000) {
    displayAlert('min_max')
    return
  }

  if (xMax - xMin <= 0) {
    displayAlert('axes')
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
  const fx2Ctx = (document.querySelector('#fx2-layer-0')! as HTMLCanvasElement).getContext('2d')!
  const fxFgCtx = (document.querySelector('#fx-layer-1')! as HTMLCanvasElement).getContext('2d')!
  const fx2FgCtx = (document.querySelector('#fx2-layer-1')! as HTMLCanvasElement).getContext('2d')!
  fxCtx.clearRect(0, 0, fxCtx.canvas.width, fxCtx.canvas.height)
  fx2Ctx.clearRect(0, 0, fx2Ctx.canvas.width, fx2Ctx.canvas.height)
  fxFgCtx.clearRect(0, 0, fxFgCtx.canvas.width, fxFgCtx.canvas.height)
  fx2FgCtx.clearRect(0, 0, fx2FgCtx.canvas.width, fx2FgCtx.canvas.height)

  const resolution: [number, number] = [fxCtx.canvas.width, fxCtx.canvas.height]

  const fx = new FxChart(func, resolution, xMin, xMax, yMin, yMax)
  fx.drawAxesOnCanvas(fxCtx)
  fx.drawFxOnCanvas(fxCtx)

  const fx2 = new DerivativeFxChart(func, resolution, xMin, xMax, yMin2, yMax2)
  fx2.drawAxesOnCanvas(fx2Ctx)

  const startAnimationBtn: HTMLButtonElement = document.querySelector('#start')!
  startAnimationBtn.disabled = true

  const fxFgCanvas: HTMLCanvasElement = document.querySelector('#fx-layer-1')!
  fxFgCanvas.removeEventListener('mousemove', getCoordinatesAndDrawInteraction, true)
  fxFgCanvas.removeEventListener('mousedown', getCoordinatesAndDrawInteraction, true)
  clearInterval(window.animationTimerId)

  window.fx = fx
  window.fx2 = fx2

  let count = -1
  window.animationTimerId = setInterval(() => {
    count += 1
    drawAnimation(count)
  }, 20)
}

function drawAnimation(frame: number) {
  const { fx, fx2 } = window
  const framePx = frame + fx.XToPx(fx.domain[0]!.from)
  const lastDomainPx = fx.XToPx(fx.domain[fx.domain!.length - 1]!.to)
  if (framePx >= lastDomainPx) {
    const startAnimationBtn: HTMLButtonElement = document.querySelector('#start')!
    startAnimationBtn.disabled = false

    const fxFgCanvas: HTMLCanvasElement = document.querySelector('#fx-layer-1')!
    fxFgCanvas.addEventListener('mousemove', getCoordinatesAndDrawInteraction, true)
    fxFgCanvas.addEventListener('mousedown', getCoordinatesAndDrawInteraction, true)
    return
  }

  const fx2Ctx = (document.querySelector('#fx2-layer-0')! as HTMLCanvasElement).getContext('2d')!
  const fxFgCtx = (document.querySelector('#fx-layer-1')! as HTMLCanvasElement).getContext('2d')!

  const positiveColor = 'rgb(0, 128, 255)'
  const negativeColor = 'rgb(255, 51, 51)'

  const [x, y] = fx2.points[framePx]!
  const color = y >= 0 ? positiveColor : negativeColor

  drawOffscreenAndTransferTo(fxFgCtx, (ctx: CanvasRenderingContext2D) => {
    // Draw tangent line to fx at x
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = config.FX_THICKNESS
    const m = y
    const q = evaluate(fx.fx, { x }) - y * x
    ctx.moveTo(fx.XToPx((fx.yRangeFrom - q) / m), ctx.canvas.height)
    ctx.lineTo(fx.XToPx((fx.yRangeTo - q) / m), 0)
    ctx.stroke()

    // Draw fx(x)
    fx.drawPointOnCanvas(ctx, x, fx.points![framePx]![1]!, { radius: 6 })
  })

  // Draw fx'
  fx2.drawLineSegmentOnCanvas(fx2Ctx, fx2.points[framePx - 1] || [NaN, NaN], [x, y], { color })
}

function drawInteraction(x_px: number) {
  const fx2FgCtx = (document.querySelector('#fx2-layer-1')! as HTMLCanvasElement).getContext('2d')!
  const fxFgCtx = (document.querySelector('#fx-layer-1')! as HTMLCanvasElement).getContext('2d')!
  const { fx, fx2 } = window

  const positiveColor = 'rgb(0, 128, 255)'
  const negativeColor = 'rgb(255, 51, 51)'

  const [x, y] = fx2.points[x_px]!
  const color = y >= 0 ? positiveColor : negativeColor

  drawOffscreenAndTransferTo(fxFgCtx, (ctx: CanvasRenderingContext2D) => {
    // Draw tangent line to fx at x
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = config.FX_THICKNESS
    const m = y
    const q = evaluate(fx.fx, { x }) - y * x
    ctx.moveTo(fx.XToPx((fx.yRangeFrom - q) / m), ctx.canvas.height)
    ctx.lineTo(fx.XToPx((fx.yRangeTo - q) / m), 0)
    ctx.stroke()

    // Draw fx(x)
    fx.drawPointOnCanvas(ctx, x, fx.points![x_px]![1]!, { radius: 6 })
  })

  // Draw fx'(x)
  fx2FgCtx.clearRect(0, 0, fx2FgCtx.canvas.width, fx2FgCtx.canvas.height)
  fx2.drawPointOnCanvas(fx2FgCtx, x, y, { color, radius: 6 })
}
