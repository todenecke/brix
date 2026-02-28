import { SCAN_CONFIG } from '../config/brixConfig'

const MAX_WIDTH = 640
const MAX_HEIGHT = 480
const OUTPUT_SIZE = Math.min(MAX_WIDTH, MAX_HEIGHT)

const STRIP_WIDTH = SCAN_CONFIG.stripWidth
const STRIP_HEIGHT = SCAN_CONFIG.stripHeight

export type CaptureMode = 'square' | 'strip'

let canvasSquare: OffscreenCanvas | null = null
let canvasStrip: OffscreenCanvas | null = null

function getContextSquare(): OffscreenCanvasRenderingContext2D {
  if (!canvasSquare) {
    canvasSquare = new OffscreenCanvas(OUTPUT_SIZE, OUTPUT_SIZE)
  }
  return canvasSquare.getContext('2d', { willReadFrequently: true })!
}

function getContextStrip(): OffscreenCanvasRenderingContext2D {
  if (!canvasStrip) {
    canvasStrip = new OffscreenCanvas(STRIP_WIDTH, STRIP_HEIGHT)
  }
  return canvasStrip.getContext('2d', { willReadFrequently: true })!
}

export function captureFrame(
  video: HTMLVideoElement,
  mode: CaptureMode = 'square'
): ImageData {
  const { videoWidth, videoHeight } = video

  if (mode === 'strip') {
    const context = getContextStrip()
    const srcHeight = videoHeight
    const srcWidth = videoHeight * (STRIP_WIDTH / STRIP_HEIGHT)
    const sx = (videoWidth - srcWidth) / 2
    const sy = 0
    context.drawImage(video, sx, sy, srcWidth, srcHeight, 0, 0, STRIP_WIDTH, STRIP_HEIGHT)
    return context.getImageData(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
  }

  const context = getContextSquare()
  const size = Math.min(videoWidth, videoHeight)
  const sx = (videoWidth - size) / 2
  const sy = (videoHeight - size) / 2
  context.drawImage(video, sx, sy, size, size, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
  return context.getImageData(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
}

export const CAPTURE_STRIP_DIMS = { width: STRIP_WIDTH, height: STRIP_HEIGHT }
