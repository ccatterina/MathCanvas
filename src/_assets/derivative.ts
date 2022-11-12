import { displayAlert } from './utils'
import {
  XToPx,
  drawFxAxes,
  drawFxPoints,
  XFromPx,
  drawPoint
} from './draw_utils'
import { Fx } from './fx'
import { evaluate } from 'mathjs'

declare global {
  interface Window {
    fx: Fx
    fx2: Fx
    xFixed: number
    xMoving: number
    animationTimerId: NodeJS.Timer
  }
}

function derivativeMinMax(
  fx: Fx,
  ctx: CanvasRenderingContext2D
): [number, number] {
  if (!fx.domain) {
    fx.evaluate(ctx.canvas.width)
  }

  const domPiecesMinMax: [number, number][] = fx.domain!.map((dom) => {
    let min = Infinity
    let max = -Infinity
    const fromPx = XToPx(fx, dom.from || fx.xMin, ctx)
    const toPx = XToPx(fx, dom.to || fx.xMax, ctx)
    for (let x_px = fromPx; x_px <= toPx; x_px++) {
      const x = XFromPx(fx, x_px, ctx)
      const eps = fx.xInterval * 1e-10
      // https://en.wikipedia.org/wiki/Differentiation_rules
      const d = (evaluate(fx.fx, { x: x + eps }) - evaluate(fx.fx, { x })) / eps
      min = Math.min(min, d)
      max = Math.max(max, d)
    }
    return [min, max]
  })

  return [
    Math.min(...domPiecesMinMax.map((d) => d[0])),
    Math.max(...domPiecesMinMax.map((d) => d[1]))
  ]
}

function getCoordinatesAndDrawInteraction(event: MouseEvent) {
  const animCanvas: HTMLCanvasElement = document.querySelector('#animation')!
  var rect = animCanvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  // const _y = event.clientY - rect.top
  drawInteraction(x)
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
  const intCanvas2: HTMLCanvasElement = document.querySelector('#interaction2')!

  const fxCtx = fxCanvas.getContext('2d')!
  const animCtx = animCanvas.getContext('2d')!
  const bufferCtx = bufferCanvas.getContext('2d')!
  const fxCtx2 = fxCanvas2.getContext('2d')!
  const intCtx2 = intCanvas2.getContext('2d')!

  fxCtx.clearRect(0, 0, fxCtx.canvas.width, fxCtx.canvas.height)
  animCtx.clearRect(0, 0, animCtx.canvas.width, animCtx.canvas.height)
  bufferCtx.clearRect(0, 0, bufferCtx.canvas.width, bufferCtx.canvas.height)
  fxCtx2.clearRect(0, 0, fxCtx.canvas.width, fxCtx.canvas.height)
  intCtx2.clearRect(0, 0, animCtx.canvas.width, animCtx.canvas.height)

  const fx = new Fx(func, xMin, xMax, yMin, yMax)
  fx.evaluate(fxCtx.canvas.width)

  if (!manualYAxes || !yMin2 || !yMax2) {
    const dMinMax = derivativeMinMax(fx, fxCtx2)
    yMin2 = dMinMax[0] - (dMinMax[1] - dMinMax[0]) / 2
    yMax2 = dMinMax[1] + (dMinMax[1] - dMinMax[0]) / 2
  }

  drawFxAxes(fxCtx, fx)
  drawFxPoints(fx, fxCtx)

  const fx2 = new Fx(func, xMin, xMax, yMin2, yMax2)
  drawFxAxes(fxCtx2, fx2)

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

  window.fx = fx
  window.fx2 = fx2

  let count = -1
  window.animationTimerId = setInterval(() => {
    count += 1
    drawAnimation(count)
  }, 10)
}

function drawAnimation(animationPx: number) {
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
    if (!fx.domain) {
      fx.evaluate(ctx.canvas.width)
    }

    if (
      animationPx >= (fx.domain![fx.domain!.length - 1]!.to || ctx.canvas.width)
    ) {
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

    let r = Math.round((animationPx / ctx.canvas.width) * 255)
    const color = `rgb(${r}, 10, 100)`

    const x = XFromPx(fx, animationPx, ctx)
    const eps = fx.xInterval * 1e-10
    // https://en.wikipedia.org/wiki/Differentiation_rules
    const der = (evaluate(fx.fx, { x: x + eps }) - evaluate(fx.fx, { x })) / eps

    // Draw tangent line to fx at x
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    const m = der
    const q = evaluate(fx.fx, { x }) - der * x
    ctx.moveTo(XToPx(fx, (fx.yMin - q) / m, ctx), ctx.canvas.height)
    ctx.lineTo(XToPx(fx, (fx.yMax - q) / m, ctx), 0)
    ctx.stroke()
    // Draw fx(x)
    drawPoint(fx, x, fx.points![animationPx]![1]!, ctx, { radius: 6 })

    // Draw fx'(x)
    drawPoint(fx2, x, der, fx2Ctx, { color, radius: 2 })

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

  const x = XFromPx(fx, x_px, ctx)
  const eps = fx.xInterval * 1e-10
  // https://en.wikipedia.org/wiki/Differentiation_rules
  const der = (evaluate(fx.fx, { x: x + eps }) - evaluate(fx.fx, { x })) / eps

  // Draw tangent line to fx at x
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  const m = der
  const q = evaluate(fx.fx, { x }) - der * x
  ctx.moveTo(XToPx(fx, (fx.yMin - q) / m, ctx), ctx.canvas.height)
  ctx.lineTo(XToPx(fx, (fx.yMax - q) / m, ctx), 0)
  ctx.stroke()

  // Draw fx(x)
  drawPoint(fx, x, fx.points![x_px]![1]!, ctx, { radius: 6 })

  // Draw fx'(x)
  drawPoint(fx2, x, der, int2Ctx, { color, radius: 6 })
}
