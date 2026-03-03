import { useCallback, useEffect, useRef, useState } from 'react'
import { captureFrame, type CaptureMode } from '../services/frameCapture'
import type { AprilTagDetection } from '../services/aprilTagService'

export interface UseAprilDetectionOptions {
  captureMode?: CaptureMode
}

const FPS_ACTIVE = 12
const FPS_IDLE = 4
const FRAME_INTERVAL_ACTIVE_MS = 1000 / FPS_ACTIVE
const FRAME_INTERVAL_IDLE_MS = 1000 / FPS_IDLE

export function useAprilDetection(
  video: HTMLVideoElement | null,
  options: UseAprilDetectionOptions = {}
) {
  const captureModeRef = useRef<CaptureMode>(options.captureMode ?? 'square')
  captureModeRef.current = options.captureMode ?? 'square'
  const [currentFrameTags, setCurrentFrameTags] = useState<AprilTagDetection[]>([])
  const [captureDims, setCaptureDims] = useState<{ width: number; height: number } | null>(null)
  const [accumulatedTagIds, setAccumulatedTagIds] = useState<number[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const workerRef = useRef<Worker | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const pendingRef = useRef<boolean>(false)
  const nextDetectIdRef = useRef<number>(0)
  const isMountedRef = useRef<boolean>(true)
  const videoRef = useRef<HTMLVideoElement | null>(video)
  const lastHadTagsRef = useRef<boolean>(false)

  videoRef.current = video

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    pendingRef.current = false
  }, [])

  const loop = useCallback(() => {
    const currentVideo = videoRef.current
    if (!isMountedRef.current || !workerRef.current || !currentVideo) return

    const now = performance.now()
    const elapsed = now - lastFrameTimeRef.current
    const intervalMs = lastHadTagsRef.current
      ? FRAME_INTERVAL_ACTIVE_MS
      : FRAME_INTERVAL_IDLE_MS

    if (elapsed >= intervalMs && !pendingRef.current) {
      try {
        const imageData = captureFrame(currentVideo, captureModeRef.current)
        const id = nextDetectIdRef.current++
        const buffer = imageData.data.buffer

        pendingRef.current = true
        lastFrameTimeRef.current = now

        workerRef.current.postMessage(
          {
            type: 'detect',
            id,
            buffer,
            width: imageData.width,
            height: imageData.height,
          },
          [buffer]
        )
      } catch {
        pendingRef.current = false
      }
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [])

  const handleWorkerMessage = useCallback(
    (e: MessageEvent<{ type: string; id?: number; detections?: AprilTagDetection[]; width?: number; height?: number }>) => {
      const msg = e.data

      if (msg.type === 'result' && msg.detections !== undefined) {
        pendingRef.current = false
        lastHadTagsRef.current = msg.detections.length > 0
        if (isMountedRef.current) {
          setCurrentFrameTags(msg.detections)
          if (msg.width != null && msg.height != null) {
            setCaptureDims({ width: msg.width, height: msg.height })
          }
          if (msg.detections.length > 0) {
            setAccumulatedTagIds((prev) => {
              const existing = new Set(prev)
              const newIds = msg.detections!.map((t) => t.tagId).filter((id) => !existing.has(id))
              return newIds.length > 0 ? [...prev, ...newIds] : prev
            })
          }
        }
      }
    },
    []
  )

  const start = useCallback(() => {
    if (!video || isRunning) return

    setAccumulatedTagIds([])

    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/aprilTagWorker.ts', import.meta.url),
        { type: 'module' }
      )
      workerRef.current.onmessage = handleWorkerMessage
      workerRef.current.postMessage({ type: 'init' })
    }

    setIsRunning(true)
    lastFrameTimeRef.current = 0

    const onReady = (e: MessageEvent<{ type: string }>) => {
      if (e.data.type === 'ready') {
        workerRef.current?.removeEventListener('message', onReady)
        rafRef.current = requestAnimationFrame(loop)
      }
    }

    workerRef.current.addEventListener('message', onReady)
  }, [video, isRunning, loop, handleWorkerMessage])

  const stop = useCallback(() => {
    setIsRunning(false)
    setAccumulatedTagIds([])
    cleanup()
  }, [cleanup])

  const reset = useCallback(() => {
    setAccumulatedTagIds([])
  }, [])

  const startRef = useRef(start)
  startRef.current = start

  const restart = useCallback(() => {
    stop()
    setTimeout(() => startRef.current(), 0)
  }, [stop])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    detectedTags: currentFrameTags,
    captureDims,
    accumulatedTagIds,
    isRunning,
    start,
    stop,
    reset,
    restart,
  }
}
