import { evaluate } from 'mathjs'

export type Domain = { from: number; to: number }[]

export class Fx {
  private _fx: string
  private _xMin: number
  private _xMax: number
  private _yMin: number
  private _yMax: number
  private _xInterval: number
  private _yInterval: number
  private _resolution: [number, number]
  private _domain: Domain
  private _isLimited: Boolean
  private _points: [number, number][]

  get fx() {
    return this._fx
  }

  get xMin() {
    return this._xMin
  }

  get xMax() {
    return this._xMax
  }

  get yMin() {
    return this._yMin
  }

  get yMax() {
    return this._yMax
  }

  get xInterval() {
    return this._xInterval
  }

  get yInterval() {
    return this._yInterval
  }

  get domain() {
    return this._domain
  }

  get isLimited() {
    return this._isLimited
  }

  get points() {
    return this._points
  }

  get resolution() {
    return this._resolution
  }

  get X0_px() {
    return this.xMax > 0 && this.xMin < 0 ? this.XToPx(0) : null
  }

  get Y0_px() {
    return this.yMax > 0 && this.yMin < 0 ? this.YToPx(0) : null
  }

  constructor(
    fx: string,
    resolution: [number, number],
    xMin: number,
    xMax: number,
    yMin: number | undefined = undefined,
    yMax: number | undefined = undefined,
    evaluateOptions: Record<string, any> = {}
  ) {
    this._fx = fx
    this._xMin = xMin
    this._xMax = xMax
    this._xInterval = xMax - xMin
    this._resolution = resolution

    this._points = this.evaluate(evaluateOptions)

    this._isLimited = this.points.every(([_, y]) => isNaN(y) || isFinite(y))
    this._domain = this.points.reduce((domain: Domain, [x, y]) => {
      if (!isNaN(y)) {
        if (!domain[domain.length - 1]) {
          domain.push({ from: x, to: x })
        }
        domain[domain.length - 1]!.to = x
      }
      return domain
    }, [])

    if (yMax != undefined && yMin != undefined) {
      this._yMin = yMin
      this._yMax = yMax
    } else {
      const points = this.points.map(([_, y]) => y).filter((y) => !isNaN(y) && isFinite(y))
      const min = Math.min(...points)
      const max = Math.max(...points)
      const padding = (max - min > 0 ? max - min : 1) / 2
      this._yMin = min - padding
      this._yMax = max + padding
    }
    this._yInterval = this.yMax - this.yMin
  }

  protected evaluate(_options: Record<string, any>): [number, number][] {
    const points: [number, number][] = []

    for (let x_px = 0; x_px <= this.resolution[0]; x_px++) {
      const x = this.XFromPx(x_px)
      const y = evaluate(this.fx, { x })
      points.push([x, y])
    }
    return points
  }

  /**
   * Get the x-coordinate pixel corresponding to the function
   * x-value passed by parameter.
   * @param  {number} x [X value]
   */
  XToPx(x: number) {
    return ((x - this.xMin) / this.xInterval) * this.resolution[0]
  }

  /**
   * Get the function x-value corresponding to the x-coordiante
   * in pixel passed by parameter.
   * @param  {number} x_px [X in pixel]
   */
  XFromPx(x_px: number) {
    return (x_px * this.xInterval) / this.resolution[0] + this.xMin
  }

  /**
   * Get the y-coordinate pixel corresponding to the function
   * y-value passed by parameter.
   * @param  {number} y [Y value]
   */
  YToPx(y: number) {
    return ((this.yMax - y) / this.yInterval) * this.resolution[1]
  }

  /**
   * Get the function y-value corresponding to the y-coordiante
   * in pixel passed by parameter.
   * @param  {number} y_px [Y in pixel]
   */
  YFromPx(y_px: number) {
    return this.yMax - (y_px * this.yInterval) / this.resolution[1]
  }
}

export class DerivativeFx extends Fx {
  protected override evaluate(_options: Record<string, any>): [number, number][] {
    const points: [number, number][] = []
    const eps = this.xInterval * 1e-10
    for (let x_px = 0; x_px <= this.resolution[0]; x_px++) {
      const x = this.XFromPx(x_px)
      const y = (evaluate(this.fx, { x: x + eps }) - evaluate(this.fx, { x })) / eps

      points.push([x, y])
    }
    return points
  }
}

export class IntegralFx extends Fx {
  protected override evaluate(_options: Record<string, any>): [number, number][] {
    const points: [number, number][] = []
    let area = 0
    for (let x_px = 0; x_px <= this.resolution[0]; x_px++) {
      const x = this.XFromPx(x_px)
      const y = evaluate(this.fx, { x })
      if (!isNaN(y)) {
        area += (this.xInterval / this.resolution[0]) * y
      }
      points.push([x, area])
    }
    return points
  }
}

export class ImproperIntegralFx extends Fx {
  protected override evaluate(options: Record<string, any>): [number, number][] {
    const speed = options?.['speed'] || 'a=-b'
    const points: [number, number][] = []
    let area = 0
    for (let x_px = this.resolution[0] / 2; x_px <= this.resolution[0]; x_px++) {
      const x = this.XFromPx(x_px)
      const yForward = evaluate(this.fx, { x })
      if (!isNaN(yForward)) {
        area += (this.xInterval / this.resolution[0]) * yForward
      }

      const xNextPx = this.XFromPx(x_px + 1)
      let val
      if (speed == 'a=-b^2') {
        // https://en.wikipedia.org/wiki/Trapezoidal_rule
        val =
          (Math.abs(Math.pow(x, 2) - Math.pow(xNextPx, 2)) / 2) *
          (evaluate(this.fx, { x: -Math.pow(xNextPx, 2) }) +
            evaluate(this.fx, { x: -Math.pow(x, 2) }))
      } else {
        val = (this.xInterval / this.resolution[0]) * evaluate(this.fx, { x: -x })
      }
      if (!isNaN(val)) {
        area += val
      }

      points.push([x, area])
    }
    return points
  }
}
