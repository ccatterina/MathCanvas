import { displayAlert } from './utils'
import { FxChart } from './fx_chart'
import { evaluate } from 'mathjs'

declare global {
  interface Window {
    fx: FxChart
    fx2: FxChart
    animationTimerId: NodeJS.Timer
  }
}

export function integralMinMax(fx: FxChart): [number, number] {
  if (!fx.domain) {
    fx.evaluate()
  }

  let max = -Infinity
  let min = Infinity
  let area = 0
  fx.domain!.forEach((dom) => {
    const fromPx = fx.XToPx(dom.from || fx.xMin)
    const toPx = fx.XToPx(dom.to || fx.xMax)
    for (let x_px = fromPx; x_px <= toPx; x_px++) {
      const x = fx.XFromPx(x_px)
      const val = evaluate(fx.fx, { x })
      if (isNaN(val) || !isFinite(val)) {
        continue
      }
      area += (fx.xInterval / fx.resolution[0]) * evaluate(fx.fx, { x })
      min = Math.min(min, area)
      max = Math.max(max, area)
    }
  })
  return [min, max]
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
  let yMin2 = parseFloat(
    (document.querySelector('#ymin_2') as HTMLInputElement).value
  )
  let yMax2 = parseFloat(
    (document.querySelector('#ymax_2') as HTMLInputElement).value
  )
  const manualYAxes = (
    document.querySelector('#check_man_axes') as HTMLInputElement
  ).checked

  const func = (document.querySelector('#function') as HTMLInputElement).value

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

  const fxCanvas: HTMLCanvasElement = document.querySelector('#fx')!
  const animCanvas: HTMLCanvasElement = document.querySelector('#animation')!
  const bufferCanvas: HTMLCanvasElement = document.querySelector('#buffer')!
  const fxCanvas2: HTMLCanvasElement = document.querySelector('#fx2')!

  const fxCtx = fxCanvas.getContext('2d')!
  const animCtx = animCanvas.getContext('2d')!
  const bufferCtx = bufferCanvas.getContext('2d')!
  const fxCtx2 = fxCanvas2.getContext('2d')!

  fxCtx.clearRect(0, 0, fxCtx.canvas.width, fxCtx.canvas.height)
  animCtx.clearRect(0, 0, animCtx.canvas.width, animCtx.canvas.height)
  bufferCtx.clearRect(0, 0, bufferCtx.canvas.width, bufferCtx.canvas.height)
  fxCtx2.clearRect(0, 0, fxCtx.canvas.width, fxCtx.canvas.height)

  const resolution: [number, number] = [fxCtx.canvas.width, fxCtx.canvas.height]
  const fx = new FxChart(func, xMin, xMax, yMin, yMax, resolution)
  fx.evaluate()
  if (!fx.isLimited) {
    displayAlert('unlimited')
    return
  }

  if (!manualYAxes || !yMin2 || !yMax2) {
    const dMinMax = integralMinMax(fx)
    yMin2 = dMinMax[0] - (dMinMax[1] - dMinMax[0]) / 2
    yMax2 = dMinMax[1] + (dMinMax[1] - dMinMax[0]) / 2
  }

  fx.drawFxAxes(fxCtx)
  fx.drawFxPoints(fxCtx)

  const fx2 = new FxChart(func, xMin, xMax, yMin2, yMax2, resolution)
  fx2.drawFxAxes(fxCtx2)

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
  {
    const fx2Canvas: HTMLCanvasElement = document.querySelector('#fx2')!
    const fx2Ctx = fx2Canvas.getContext('2d')!

    const animCanvas: HTMLCanvasElement = document.querySelector('#animation')!
    const bufferCanvas: HTMLCanvasElement = document.querySelector('#buffer')!

    // To prevent flickering draw the frame on an invisible canvas and
    // switch visibility when frame is completed.
    let ctx: CanvasRenderingContext2D
    if (!animCanvas.classList.contains('invisible')) {
      ctx = animCanvas.getContext('2d')!
    } else {
      ctx = bufferCanvas.getContext('2d')!
    }

    const { fx, fx2 } = window
    if (!fx.domain) {
      fx.evaluate()
    }

    const framePx = frame + (fx.domain?.[0]?.from || 0)
    if (
      framePx >= (fx.domain![fx.domain!.length - 1]!.to || ctx.canvas.width)
    ) {
      const startAnimationBtn: HTMLButtonElement =
        document.querySelector('#start')!
      startAnimationBtn.disabled = false
      return
    }

    const color = `rgb(0,128,255)`

    const [x, y] = fx.points![framePx]!
    const OrigY_px = fx.Y0_px || fx.resolution[1]

    // Draw the area under the function 
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.fillRect(framePx, OrigY_px, 2, -(y * fx.resolution[1]) / fx.yInterval)
    ctx.fill()

    // Calculate the surface of the area under the function from the beginning of the chart to the `animationPx`.
    const area = fx.points!.slice(0, framePx).reduce((sum, point) => {
      if (isNaN(point[1]) || !isFinite(point[1])) {
        return sum
      }
      return sum + point[1] * (fx.xInterval / fx.resolution[0])
    }, 0)

    fx2.drawPoint(x, area, fx2Ctx, { color, radius: 2 })
  }
}