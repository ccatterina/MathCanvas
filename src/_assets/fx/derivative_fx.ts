import { evaluate } from 'mathjs'
import { FxChart, Point } from './fx'

export class DerivativeFxChart extends FxChart {
  protected override evaluate(_options: Record<string, any>): Point[] {
    const points: Point[] = []
    const eps = this.xInterval * 1e-10
    for (let x_px = 0; x_px <= this.resolution[0]; x_px++) {
      const x = this.XFromPx(x_px)
      // https://en.wikipedia.org/wiki/Difference_quotient
      const y = (evaluate(this.fx, { x: x + eps }) - evaluate(this.fx, { x })) / eps

      points.push([x, y])
    }
    return points
  }
}
