import { evaluate } from 'mathjs'
import { FxChart, Point } from './fx'

export class IntegralFxChart extends FxChart {
  protected override evaluate(_options: Record<string, string>): Point[] {
    const points: Point[] = []
    let area = 0
    for (let x_px = 0; x_px <= this.resolution[0]; x_px++) {
      const x = this.XFromPx(x_px)
      const y = evaluate(this.fx, { x })
      if (!isNaN(y)) {
        // https://en.wikipedia.org/wiki/Riemann_sum
        area += (this.xInterval / this.resolution[0]) * y
      }
      points.push([x, area])
    }
    return points
  }
}
