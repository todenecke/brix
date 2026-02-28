const WASM_BASE = '/apriltag'

interface Point2D {
  x: number
  y: number
}

interface AprilTagDetection {
  tagId: number
  corners: Point2D[]
  center: Point2D
}

interface RawDetection {
  id: number
  corners: Point2D[]
  center: Point2D
}

interface WasmModule {
  cwrap: (
    name: string,
    returnType: string,
    argTypes: string[]
  ) => (...args: unknown[]) => number
  HEAPU8: Uint8Array
  getValue: (ptr: number, type: string) => number
}

type InMessage =
  | { type: 'detect'; id: number; buffer: ArrayBuffer; width: number; height: number }
  | { type: 'init' }

type OutMessage =
  | { type: 'ready' }
  | { type: 'error'; message: string }
  | { type: 'result'; id: number; detections: AprilTagDetection[] }

let detectFn: ((
  grayscale: Uint8Array,
  width: number,
  height: number
) => RawDetection[]) | null = null
let moduleRef: WasmModule | null = null

function imageDataToGrayscale(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const grayscale = new Uint8Array(width * height)
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    grayscale[j] = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3)
  }
  return grayscale
}

function initDetector(Module: WasmModule): void {
  const init = Module.cwrap('atagjs_init', 'number', [])
  const setImgBuffer = Module.cwrap('atagjs_set_img_buffer', 'number', [
    'number',
    'number',
    'number',
  ])
  const setDetectorOptions = Module.cwrap(
    'atagjs_set_detector_options',
    'number',
    ['number', 'number', 'number', 'number', 'number', 'number', 'number']
  )
  const detect = Module.cwrap('atagjs_detect', 'number', [])

  init()
  setDetectorOptions(2.0, 0.0, 1, 1, 0, 0, 0)

  detectFn = (
    grayscale: Uint8Array,
    width: number,
    height: number
  ): RawDetection[] => {
    const imgBuffer = setImgBuffer(width, height, width)
    if (width * height < grayscale.length) return []
    Module.HEAPU8.set(grayscale, imgBuffer)

    const strJsonPtr = detect()
    const strJsonLen = Module.getValue(strJsonPtr, 'i32')
    if (strJsonLen === 0) return []

    const strJsonStrPtr = Module.getValue(strJsonPtr + 4, 'i32')
    const strJsonView = new Uint8Array(
      Module.HEAPU8.buffer,
      strJsonStrPtr,
      strJsonLen
    )
    let detectionsJson = ''
    for (let i = 0; i < strJsonLen; i++) {
      detectionsJson += String.fromCharCode(strJsonView[i])
    }
    return JSON.parse(detectionsJson) as RawDetection[]
  }
}

async function loadWasm(): Promise<void> {
  const res = await fetch(`${WASM_BASE}/apriltag_wasm.js`)
  const code = await res.text()
  const fn = new Function(`${code}; return typeof AprilTagWasm !== 'undefined' ? AprilTagWasm : null`)
  const AprilTagWasm = fn()

  if (!AprilTagWasm) {
    throw new Error('AprilTagWasm not found')
  }

  const Module = await AprilTagWasm({
    locateFile: (path: string) => `${WASM_BASE}/${path}`,
  })

  moduleRef = Module
  initDetector(Module)
}

function runDetection(
  buffer: ArrayBuffer,
  width: number,
  height: number
): AprilTagDetection[] {
  if (!detectFn || !moduleRef) return []

  const data = new Uint8ClampedArray(buffer)
  const grayscale = imageDataToGrayscale(data, width, height)
  const raw = detectFn(grayscale, width, height)

  if (!Array.isArray(raw)) return []
  const valid = raw.filter(
    (d): d is RawDetection =>
      typeof d?.id === 'number' && Array.isArray(d.corners)
  )

  return valid.map((d) => ({
    tagId: d.id,
    corners: d.corners ?? [],
    center: d.center ?? { x: 0, y: 0 },
  }))
}

async function handleInit(): Promise<void> {
  if (moduleRef) {
    self.postMessage({ type: 'ready' } as OutMessage)
    return
  }

  try {
    await loadWasm()
    self.postMessage({ type: 'ready' } as OutMessage)
  } catch (err) {
    self.postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : 'WASM initialization failed',
    } as OutMessage)
  }
}

function handleDetect(msg: Extract<InMessage, { type: 'detect' }>): void {
  const { id, buffer, width, height } = msg

  if (!moduleRef || !detectFn) {
    self.postMessage({ type: 'result', id, detections: [] } as OutMessage)
    return
  }

  const detections = runDetection(buffer, width, height)
  self.postMessage({ type: 'result', id, detections } as OutMessage)
}

self.onmessage = (e: MessageEvent<InMessage>) => {
  const msg = e.data

  if (msg.type === 'init') {
    handleInit()
    return
  }

  if (msg.type === 'detect') {
    handleDetect(msg)
  }
}
