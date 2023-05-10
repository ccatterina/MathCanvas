import { displayAlert } from './utils'
import { FxChart } from './fx/fx'
import { IntegralFxChart } from './fx/integral_fx'
import { evaluate } from 'mathjs'

declare global {
  interface Window {
    fx: FxChart
    fx2: FxChart
    animationTimerId: NodeJS.Timer
  }
}

const INTEGRAL_COLOR = `rgb(0,128,255)`

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
  fxCtx.clearRect(0, 0, fxCtx.canvas.width, fxCtx.canvas.height)
  fx2Ctx.clearRect(0, 0, fx2Ctx.canvas.width, fx2Ctx.canvas.height)
  fxFgCtx.clearRect(0, 0, fxFgCtx.canvas.width, fxFgCtx.canvas.height)

  const resolution: [number, number] = [fxCtx.canvas.width, fxCtx.canvas.height]
  const fx = new FxChart(func, resolution, xMin, xMax, yMin, yMax)
  if (!fx.isLimited) {
    displayAlert('unlimited')
    return
  }

  fx.drawAxesOnCanvas(fxFgCtx)
  fx.drawFxOnCanvas(fxFgCtx)

  const fx2 = new IntegralFxChart(func, resolution, xMin, xMax, yMin2, yMax2)
  fx2.drawAxesOnCanvas(fx2Ctx)

  const startAnimationBtn: HTMLButtonElement = document.querySelector('#start')!
  startAnimationBtn.disabled = true

  clearInterval(window.animationTimerId)

  window.fx = fx
  window.fx2 = fx2

  let count = -1
  window.animationTimerId = setInterval(() => {
    count += 1
    drawAnimation(count)
  }, 10)
}

function drawAnimation(frame: number) {
  const { fx, fx2 } = window
  const lastDomainPx = fx.XToPx(fx.domain[fx.domain!.length - 1]!.to)
  const framePx = frame + fx.XToPx(fx.domain[0]!.from)
  if (framePx >= lastDomainPx) {
    const startAnimationBtn: HTMLButtonElement = document.querySelector('#start')!
    startAnimationBtn.disabled = false
    return
  }

  const fxCtx = (document.querySelector('#fx-layer-0')! as HTMLCanvasElement).getContext('2d')!
  const fx2Ctx = (document.querySelector('#fx2-layer-0')! as HTMLCanvasElement).getContext('2d')!

  const [_, y] = fx.points![framePx]!
  const OrigY_px = fx.Y0_px || fx.resolution[1]

  //Draw the area under the function
  fxCtx.fillStyle = INTEGRAL_COLOR
  fxCtx.fillRect(framePx, OrigY_px, 2, -(y * fx.resolution[1]) / fx.yInterval)

  fx2.drawLineSegmentOnCanvas(fx2Ctx, fx2.points[framePx - 1] || [NaN, NaN], fx2.points[framePx]!, {
    color: INTEGRAL_COLOR
  })
}
