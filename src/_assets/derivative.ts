import { displayAlert } from './utils'
import { DerivativeFx, Fx } from './fx'
import { drawFxAxes, drawFxPoint, drawFxPoints, drawLineSegment } from './canvas_utils'
import { evaluate } from 'mathjs'

declare global {
  interface Window {
    fx: Fx
    fx2: Fx
    animationTimerId: NodeJS.Timer
  }
}

function getCoordinatesAndDrawInteraction(event: MouseEvent) {
  const animCanvas: HTMLCanvasElement = document.querySelector('#animation')!
  var rect = animCanvas.getBoundingClientRect()
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

  const fxCtx = (document.querySelector('#fx')! as HTMLCanvasElement).getContext('2d')!
  const animCtx = (document.querySelector('#animation')! as HTMLCanvasElement).getContext('2d')!
  const bufferCtx = (document.querySelector('#buffer')! as HTMLCanvasElement).getContext('2d')!
  const fxCtx2 = (document.querySelector('#fx2')! as HTMLCanvasElement).getContext('2d')!
  const intCtx2 = (document.querySelector('#interaction2')! as HTMLCanvasElement).getContext('2d')!

  fxCtx.clearRect(0, 0, fxCtx.canvas.width, fxCtx.canvas.height)
  animCtx.clearRect(0, 0, animCtx.canvas.width, animCtx.canvas.height)
  bufferCtx.clearRect(0, 0, bufferCtx.canvas.width, bufferCtx.canvas.height)
  fxCtx2.clearRect(0, 0, fxCtx.canvas.width, fxCtx.canvas.height)
  intCtx2.clearRect(0, 0, animCtx.canvas.width, animCtx.canvas.height)

  const resolution: [number, number] = [fxCtx.canvas.width, fxCtx.canvas.height]

  const fx = new Fx(func, resolution, xMin, xMax, yMin, yMax)
  drawFxAxes(fxCtx, fx)
  drawFxPoints(fxCtx, fx)

  const fx2 = new DerivativeFx(func, resolution, xMin, xMax, yMin2, yMax2)
  drawFxAxes(fxCtx2, fx2)

  const startAnimationBtn: HTMLButtonElement = document.querySelector('#start')!
  startAnimationBtn.disabled = true

  const fxCanvas: HTMLCanvasElement = document.querySelector('#fx')!
  fxCanvas.removeEventListener('mousemove', getCoordinatesAndDrawInteraction, true)
  fxCanvas.removeEventListener('mousedown', getCoordinatesAndDrawInteraction, true)
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
  {
    const fx2Canvas: HTMLCanvasElement = document.querySelector('#fx2')!
    const fx2Ctx = fx2Canvas.getContext('2d')!

    const animCanvas: HTMLCanvasElement = document.querySelector('#animation')!
    const bufferCanvas: HTMLCanvasElement = document.querySelector('#buffer')!

    // To prevent flickering draw the frame on an invisible canvas and
    // switch visibility when frame is completed.
    let ctx: CanvasRenderingContext2D
    if (animCanvas.classList.contains('invisible')) {
      ctx = animCanvas.getContext('2d')!
    } else {
      ctx = bufferCanvas.getContext('2d')!
    }

    const { fx, fx2 } = window

    const framePx = frame + fx.XToPx(fx.domain[0]!.from)
    if (framePx >= fx.XToPx(fx.domain![fx.domain!.length - 1]!.to)) {
      const startAnimationBtn: HTMLButtonElement = document.querySelector('#start')!
      startAnimationBtn.disabled = false

      const fxCanvas: HTMLCanvasElement = document.querySelector('#fx')!
      fxCanvas.addEventListener('mousemove', getCoordinatesAndDrawInteraction, true)
      fxCanvas.addEventListener('mousedown', getCoordinatesAndDrawInteraction, true)
      return
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    let r = Math.round((framePx / ctx.canvas.width) * 255)
    const color = `rgb(${r}, 10, 100)`

    const [x, y] = fx2.points[framePx]!

    // Draw tangent line to fx at x
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    const m = y
    const q = evaluate(fx.fx, { x }) - y * x
    ctx.moveTo(fx.XToPx((fx.yMin - q) / m), ctx.canvas.height)
    ctx.lineTo(fx.XToPx((fx.yMax - q) / m), 0)
    ctx.stroke()
    // Draw fx(x)
    drawFxPoint(ctx, fx, x, fx.points![framePx]![1]!, { radius: 6 })

    // Draw fx'(x)
    drawLineSegment(fx2Ctx, fx2, fx2.points[framePx - 1] || [NaN, NaN], [x, y], { color })

    animCanvas.classList.toggle('invisible')
    bufferCanvas.classList.toggle('invisible')
  }
}

function drawInteraction(x_px: number) {
  const int2Canv: HTMLCanvasElement = document.querySelector('#interaction2')!
  const int2Ctx = int2Canv.getContext('2d')!
  const buffCanvas: HTMLCanvasElement = document.querySelector('#buffer')!
  const animCanvas: HTMLCanvasElement = document.querySelector('#animation')!

  let { fx, fx2 } = window

  let ctx: CanvasRenderingContext2D
  if (animCanvas.classList.contains('invisible')) {
    ctx = buffCanvas.getContext('2d')!
  } else {
    ctx = animCanvas.getContext('2d')!
  }
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  int2Ctx.clearRect(0, 0, int2Ctx.canvas.width, int2Ctx.canvas.height)

  const r = Math.round((x_px / ctx.canvas.width) * 255)
  const color = `rgb(${r}, 10, 100)`

  const [x, y] = fx2.points[x_px]!

  // Draw tangent line to fx at x
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  const m = y
  const q = evaluate(fx.fx, { x }) - y * x
  ctx.moveTo(fx.XToPx((fx.yMin - q) / m), ctx.canvas.height)
  ctx.lineTo(fx.XToPx((fx.yMax - q) / m), 0)
  ctx.stroke()

  // Draw fx(x)
  drawFxPoint(ctx, fx, x, fx.points![x_px]![1]!, { radius: 6 })

  // Draw fx'(x)
  drawFxPoint(int2Ctx, fx2, x, y, { color, radius: 6 })
}
