import { displayAlert } from './utils'
import { FxChart } from './fx/fx'
import { ImproperIntegralFxChart } from './fx/improper_integral_fx'
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
  const speed = (document.getElementById('optionsRadios1') as HTMLInputElement).checked
    ? (document.querySelector('#optionsRadios1') as HTMLInputElement).value
    : (document.querySelector('#optionsRadios2') as HTMLInputElement).value
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

  if (Math.abs(xMax) != Math.abs(xMin)) {
    displayAlert('x-range-not-symmetric')
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

  const fx2 = new ImproperIntegralFxChart(func, resolution, xMin, xMax, yMin2, yMax2, { speed })
  fx2.drawAxesOnCanvas(fx2Ctx)

  const startAnimationBtn: HTMLButtonElement = document.querySelector('#start')!
  startAnimationBtn.disabled = true

  clearInterval(window.animationTimerId)

  window.fx = fx
  window.fx2 = fx2

  let count = -1
  window.animationTimerId = setInterval(() => {
    count += 1
    drawAnimation(count, speed)
  }, 10)
}

function drawAnimation(frame: number, speed: string) {
  const { fx, fx2 } = window
  const lastDomainPx = fx.XToPx(fx.domain[fx.domain!.length - 1]!.to)
  const framePx = frame + fx.XToPx(fx.domain[0]!.from)
  if (framePx * 2 >= lastDomainPx) {
    const startAnimationBtn: HTMLButtonElement = document.querySelector('#start')!
    startAnimationBtn.disabled = false
    return
  }

  const fxCtx = (document.querySelector('#fx-layer-0')! as HTMLCanvasElement).getContext('2d')!
  const fx2Ctx = (document.querySelector('#fx2-layer-0')! as HTMLCanvasElement).getContext('2d')!

  const pxForward = fx.resolution[0] / 2 + framePx
  const [_, yForward] = fx.points[pxForward]!

  // Draw the area under the function.
  const OrigY_px = fx.Y0_px || fx.resolution[1]
  fxCtx.fillStyle = INTEGRAL_COLOR
  const rectHeight = -(yForward * fx.resolution[1]) / fx.yInterval
  fxCtx.fillRect(pxForward, OrigY_px, 2, rectHeight)

  if (speed != 'a=-b^2') {
    const pxBackward = fx.resolution[0] / 2 - framePx
    const [_, yBackward] = fx.points![pxBackward]!
    const rectHeight = -(yBackward * fx.resolution[1]) / fx.yInterval
    fxCtx.fillRect(pxBackward, OrigY_px, 2, rectHeight)
  } else {
    const from = -Math.pow(fx.XFromPx(pxForward), 2)
    const to = -Math.pow(fx.XFromPx(pxForward + 1), 2)
    const fromPx = Math.round(fx.XToPx(from))
    const toPx = Math.round(fx.XToPx(to))
    if (toPx >= 0) {
      for (let px = fromPx; px >= toPx; px--) {
        const [_, yBackward] = fx.points![px]!
        const rectHeight = -(yBackward * fx.resolution[1]) / fx.yInterval
        fxCtx.fillRect(px, OrigY_px, 2, rectHeight)
      }
    }
  }

  // Draw the integral function on the second canvas.
  if (fx2.points[framePx]![1] != null) {
    fx2.drawLineSegmentOnCanvas(
      fx2Ctx,
      fx2.points[framePx - 1] || [NaN, NaN],
      fx2.points[framePx]!,
      {
        color: INTEGRAL_COLOR
      }
    )
  }
}
