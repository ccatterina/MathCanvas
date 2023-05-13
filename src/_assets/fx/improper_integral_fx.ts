import { evaluate } from 'mathjs'
import { FxChart, Point } from './fx'

export class ImproperIntegralFxChart extends FxChart {
  protected override evaluate(options: Record<string, any>): Point[] {
    const speed = options?.['speed'] || 'a=-b'
    const points: Point[] = []
    let area = 0
    for (let x_px = this.resolution[0] / 2; x_px <= this.resolution[0]; x_px++) {
      const x = this.XFromPx(x_px)
      const yForward = evaluate(this.fx, { x })
      if (!isNaN(yForward)) {
        // https://en.wikipedia.org/wiki/Riemann_sum
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
        // https://en.wikipedia.org/wiki/Riemann_sum
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
