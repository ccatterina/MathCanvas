/**
 * Creates an offscreen canvas and passes its context to the draw
 * callback, then draw the content of the offscreen canvas
 * into the `destinationCtx`.
 * @param  {CanvasRenderingContext2D} destinationCtx [Canvas context]
 * @param  {Function} drawCallback [callback]
 */
export function drawOffscreenAndTransferTo(
  destinationCtx: CanvasRenderingContext2D,
  drawCallback: (ctx: CanvasRenderingContext2D) => void
) {
  const offscreenCanvas = document.createElement('canvas') as HTMLCanvasElement
  offscreenCanvas.width = destinationCtx.canvas.width
  offscreenCanvas.height = destinationCtx.canvas.height
  drawCallback(offscreenCanvas.getContext('2d')!)
  destinationCtx.clearRect(0, 0, destinationCtx.canvas.width, destinationCtx.canvas.height)
  destinationCtx.drawImage(offscreenCanvas, 0, 0)
}
