const WASM_BASE = '/apriltag'

export interface Point2D {
  x: number
  y: number
}

export interface AprilTagDetection {
  tagId: number
  corners: Point2D[]
  center: Point2D
}

type InitStatus = 'idle' | 'loading' | 'ready' | 'error'

interface WasmModule {
  cwrap: (
    name: string,
    returnType: string,
    argTypes: string[]
  ) => (...args: unknown[]) => number
  HEAPU8: Uint8Array
  HEAP32: Int32Array
  getValue: (ptr: number, type: string) => number
}

interface RawDetection {
  id: number
  corners: Point2D[]
  center: Point2D
}

let status: InitStatus = 'idle'
let initPromise: Promise<void> | null = null
let detectFn: (grayscale: Uint8Array, width: number, height: number) => RawDetection[] = () => []
let moduleRef: WasmModule | null = null

function imageDataToGrayscale(imageData: ImageData): Uint8Array {
  const { data, width, height } = imageData
  const grayscale = new Uint8Array(width * height)
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    grayscale[j] = Math.round(
      (data[i] + data[i + 1] + data[i + 2]) / 3
    )
  }
  return grayscale
}

function loadWasmScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document not available'))
      return
    }
    const existing = document.querySelector(
      'script[src*="apriltag_wasm.js"]'
    )
    if (existing) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = `${WASM_BASE}/apriltag_wasm.js`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load AprilTag WASM script'))
    document.head.appendChild(script)
  })
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
    const strJsonView = new Uint8Array(Module.HEAPU8.buffer, strJsonStrPtr, strJsonLen)
    let detectionsJson = ''
    for (let i = 0; i < strJsonLen; i++) {
      detectionsJson += String.fromCharCode(strJsonView[i])
    }
    return JSON.parse(detectionsJson) as RawDetection[]
  }
}

async function doInit(): Promise<void> {
  if (status === 'ready' && moduleRef) return
  if (status === 'loading' && initPromise) {
    await initPromise
    return
  }

  status = 'loading'
  initPromise = (async () => {
    try {
      await loadWasmScript()
      const AprilTagWasm = (window as unknown as { AprilTagWasm?: (cfg: object) => Promise<WasmModule> }).AprilTagWasm
      if (!AprilTagWasm) {
        throw new Error('AprilTagWasm not found')
      }
      const Module = await AprilTagWasm({
        locateFile: (path: string) => `${WASM_BASE}/${path}`,
      })
      moduleRef = Module
      initDetector(Module)
      status = 'ready'
    } catch (err) {
      status = 'error'
      initPromise = null
      throw err
    }
  })()

  await initPromise
}

export async function init(): Promise<void> {
  await doInit()
}

export function getStatus(): InitStatus {
  return status
}

export function isReady(): boolean {
  return status === 'ready'
}

export function detect(imageData: ImageData): AprilTagDetection[] {
  if (status !== 'ready' || !detectFn) {
    return []
  }

  const grayscale = imageDataToGrayscale(imageData)
  const raw = detectFn(grayscale, imageData.width, imageData.height)

  if (!Array.isArray(raw)) return []
  const valid = raw.filter(
    (d): d is RawDetection => typeof d?.id === 'number' && Array.isArray(d.corners)
  )

  return valid.map((d) => ({
    tagId: d.id,
    corners: d.corners ?? [],
    center: d.center ?? { x: 0, y: 0 },
  }))
}
