import math from 'mathjs'

export type Domain = { from: number | null; to?: number | null }[]

export class Fx {
  private _fx: string
  private _xMin: number
  private _xMax: number
  private _yMin: number
  private _yMax: number
  private _xInterval: number
  private _yInterval: number
  private _domain?: Domain | undefined
  private _isLimited?: Boolean | undefined
  private _points?: [number, number][] | undefined

  get fx() {
    return this._fx
  }
  set fx(fx: string) {
    this.resetEvaluation()
    this._fx = fx
  }

  get xMin() {
    return this._xMin
  }
  set xMin(xMin: number) {
    this.resetEvaluation()
    this._xInterval = this._xMax - xMin
    this._xMin = xMin
  }

  get xMax() {
    return this._xMax
  }
  set xMax(xMax: number) {
    this.resetEvaluation()
    this._xInterval = xMax - this.xMin
    this._xMax = xMax
  }

  get yMin() {
    return this._yMin
  }
  set yMin(yMin: number) {
    this._yInterval = this._yMax - yMin
    this._yMin = yMin
  }

  get yMax() {
    return this._yMax
  }
  set yMax(yMax: number) {
    this._yInterval = yMax - this.yMin
    this._yMax = yMax
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

  constructor(
    fx: string,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number
  ) {
    this._fx = fx
    this._xMin = xMin
    this._xMax = xMax
    this._yMin = yMin
    this._yMax = yMax
    this._xInterval = xMax - xMin
    this._yInterval = yMax - yMin
  }

  resetEvaluation() {
    this._domain = undefined
    this._isLimited = undefined
    this._points = undefined
  }

  evaluate(numPoints: number) {
    const domain: Domain = []
    const points: [number, number][] = []
    let isLimited = true

    for (let x_px = 0; x_px <= numPoints; x_px++) {
      const last_domain_part = domain[domain.length - 1]

      const x = (x_px + this.xMin) / this.xInterval
      const y = math.evaluate(this.fx, { x })

      points.push([x, y])

      if (!isFinite(y)) {
        isLimited = false
      }

      if (isNaN(y) && last_domain_part && last_domain_part.from != null) {
        last_domain_part.to = x_px === numPoints ? null : x_px
        continue
      }

      if (!last_domain_part || last_domain_part.to != null) {
        domain.push({ from: x_px === 0 ? null : x_px })
      }
    }
    this._isLimited = isLimited
    this._points = points
    this._domain = domain
  }
}
