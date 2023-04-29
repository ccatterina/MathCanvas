import { displayAlert } from './utils'
import { Fx, IntegralFx } from './fx'
import { evaluate } from 'mathjs'
import { drawFxAxes, drawFxPoint, drawFxPoints } from './canvas_utils'

declare global {
  interface Window {
    fx: Fx
    fx2: Fx
    animationTimerId: NodeJS.Timer
  }
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

  const fxCtx = (document.querySelector('#fx')! as HTMLCanvasElement).getContext('2d')!
  const animCtx = (document.querySelector('#animation')! as HTMLCanvasElement).getContext('2d')!
  const bufferCtx = (document.querySelector('#buffer')! as HTMLCanvasElement).getContext('2d')!
  const fxCtx2 = (document.querySelector('#fx2')! as HTMLCanvasElement).getContext('2d')!

  fxCtx.clearRect(0, 0, fxCtx.canvas.width, fxCtx.canvas.height)
  animCtx.clearRect(0, 0, animCtx.canvas.width, animCtx.canvas.height)
  bufferCtx.clearRect(0, 0, bufferCtx.canvas.width, bufferCtx.canvas.height)
  fxCtx2.clearRect(0, 0, fxCtx.canvas.width, fxCtx.canvas.height)

  const resolution: [number, number] = [fxCtx.canvas.width, fxCtx.canvas.height]
  const fx = new Fx(func, resolution, xMin, xMax, yMin, yMax)
  if (!fx.isLimited) {
    displayAlert('unlimited')
    return
  }

  drawFxAxes(fxCtx, fx)
  drawFxPoints(fxCtx, fx)

  const fx2 = new IntegralFx(func, resolution, xMin, xMax, yMin2, yMax2)
  drawFxAxes(fxCtx2, fx2)

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

    const framePx = frame + fx.XToPx(fx.domain[0]!.from)
    if (framePx >= fx.XToPx(fx.domain![fx.domain!.length - 1]!.to)) {
      const startAnimationBtn: HTMLButtonElement = document.querySelector('#start')!
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

    drawFxPoint(fx2Ctx, fx2, x, fx2.points![framePx]![1], { color, radius: 2 })
  }
}
