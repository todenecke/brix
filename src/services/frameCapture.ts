const MAX_WIDTH = 640
const MAX_HEIGHT = 480
const OUTPUT_SIZE = Math.min(MAX_WIDTH, MAX_HEIGHT)

let canvas: OffscreenCanvas | null = null
let ctx: OffscreenCanvasRenderingContext2D | null = null

function getContext(): OffscreenCanvasRenderingContext2D {
  if (!canvas) {
    canvas = new OffscreenCanvas(OUTPUT_SIZE, OUTPUT_SIZE)
    ctx = canvas.getContext('2d', { willReadFrequently: true })!
  }
  return ctx!
}

export function captureFrame(video: HTMLVideoElement): ImageData {
  const context = getContext()
  const { videoWidth, videoHeight } = video
  const size = Math.min(videoWidth, videoHeight)
  const sx = (videoWidth - size) / 2
  const sy = (videoHeight - size) / 2

  context.drawImage(video, sx, sy, size, size, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
  return context.getImageData(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
}
