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

export function studyImproperIntegral(fx: FxChart, speed: string): Array<number | null> {
  const values: Array<number | null> = []
  let area = 0
  const px0 = fx.XToPx(0)
  for (let x_px = px0; x_px <= fx.resolution[0]; x_px++) {
    const x = fx.XFromPx(x_px)
    const x_plus_1px = fx.XFromPx(x_px + 1)
    const val = evaluate(fx.fx, { x })
    if (isNaN(val) || !isFinite(val)) {
      values.push(null)
      continue
    }
    area += (fx.xInterval / fx.resolution[0]) * val
    if (speed == "a=-b^2") {
      area += Math.abs(Math.pow(x, 2) - Math.pow(x_plus_1px, 2)) / 2 * (evaluate(fx.fx, { x: - Math.pow(x_plus_1px, 2) }) + evaluate(fx.fx, { x: - Math.pow(x, 2) }));
    }
    else {
      area += (fx.xInterval / fx.resolution[0]) * evaluate(fx.fx, { x: -x })
    }
    values.push(area)
  }
  return values
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
  const speed = (document.getElementById("optionsRadios1") as HTMLInputElement).checked ? (document.querySelector('#optionsRadios1') as HTMLInputElement).value : (document.querySelector('#optionsRadios2') as HTMLInputElement).value

  const func = (document.querySelector('#function') as HTMLInputElement).value

  if (yMin < -1000 || xMax > 1000 || yMin < -1000 || yMax > 1000) {
    displayAlert('min_max')
    return
  }

  if (Math.abs(xMax)!=Math.abs(xMin)) {
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

  const integralValues = studyImproperIntegral(fx, speed)
  if (!manualYAxes || !yMin2 || !yMax2) {
    const min = Math.min(...integralValues.filter(n => n != null) as number[])
    const max = Math.max(...integralValues.filter(n => n != null) as number[])
    const interval = (max - min) > 0 ? (max - min) : 1
    yMin2 = min - interval / 2
    yMax2 = max + interval / 2
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
    drawAnimation(count, integralValues, speed)
  }, 10)
}

function drawAnimation(frame: number, integralValues: Array<number | null>, speed: string) {
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
      framePx * 2 >= (fx.domain![fx.domain!.length - 1]!.to || ctx.canvas.width)
    ) {
      const startAnimationBtn: HTMLButtonElement =
        document.querySelector('#start')!
      startAnimationBtn.disabled = false
      return
    }

    const color = `rgb(0,128,255)`


    const pxForward = (fx.resolution[0] / 2) + framePx
    const [xForward, yForward] = fx.points![pxForward]!
    let OrigY_px = ctx.canvas.height - 2 // Origin Y is outside the chart
    if (fx.yMax > 0 && fx.yMin < 0) {
      OrigY_px = fx.YToPx(0)
    }
    ctx.beginPath()

    // Draw the area under the function 
    ctx.fillStyle = color
    const rectHeight = -(yForward * fx.resolution[1]) / fx.yInterval
    ctx.fillRect(pxForward, OrigY_px, 2, rectHeight)

    if (speed != "a=-b^2") {
      const pxBackward = (fx.resolution[0] / 2) - framePx
      const [_, yBackward] = fx.points![pxBackward]!
      const rectHeight = -(yBackward * fx.resolution[1]) / fx.yInterval
      ctx.fillRect(pxBackward, OrigY_px, 2, rectHeight);
    }
    else {
      const from = -Math.pow(fx.XFromPx(pxForward), 2)
      const to = -Math.pow(fx.XFromPx(pxForward + 1), 2)
      const fromPx = Math.round(fx.XToPx(from))
      const toPx = Math.round(fx.XToPx(to))
      if (toPx >= 0) {
        for (let px = fromPx; px >= toPx; px--) {
          const [_, yBackward] = fx.points![px]!
          const rectHeight = -(yBackward * fx.resolution[1]) / fx.yInterval
          ctx.fillRect(px, OrigY_px, 2, rectHeight)
        }
      }
    }

    ctx.fill();


    if (integralValues[framePx] != null) {
      fx2.drawPoint(xForward, integralValues[framePx] as number, fx2Ctx, { color, radius: 2 })
    }
  }
}