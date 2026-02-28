import type { AprilTagDetection } from './aprilTagService'

const WORKER_URL = new URL('../workers/aprilTagWorker.ts', import.meta.url)

export function detectPhoto(imageData: ImageData): Promise<AprilTagDetection[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_URL, { type: 'module' })
    const id = 0
    const { data } = imageData
    const buffer = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength
    )

    worker.onmessage = (e: MessageEvent<{ type: string; id?: number; detections?: AprilTagDetection[]; message?: string }>) => {
      const msg = e.data
      console.log('[photoDetection] Worker message:', msg.type, msg)

      if (msg.type === 'ready') {
        worker.postMessage(
          {
            type: 'detect',
            id,
            buffer,
            width: imageData.width,
            height: imageData.height,
          },
          [buffer]
        )
        return
      }

      if (msg.type === 'error') {
        worker.terminate()
        reject(new Error(msg.message ?? 'Detection failed'))
        return
      }

      if (msg.type === 'result' && msg.id === id) {
        worker.terminate()
        const detections = msg.detections ?? []
        console.log('[photoDetection] Result:', detections.length, 'Tags', detections)
        resolve(detections)
      }
    }

    worker.onerror = (err) => {
      console.error('[photoDetection] Worker error:', err)
      worker.terminate()
      reject(err)
    }

    console.log('[photoDetection] Sending init to worker')
    worker.postMessage({ type: 'init' })
  })
}
