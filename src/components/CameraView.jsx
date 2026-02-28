import { useRef, useCallback, useEffect, useState } from 'react'
import './CameraView.css'

const SCAN_AREA_SIZE = 'min(70vw, 70vh)'

export default function CameraView({
  onVideoReady,
  onStreamStopped,
  detectedTags = [],
}) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState(null)

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { max: 640 },
        },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        onVideoReady?.(videoRef.current)
      }
      setIsActive(true)
    } catch (err) {
      setError(err.message || 'Kamera konnte nicht gestartet werden.')
    }
  }, [onVideoReady])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsActive(false)
    setError(null)
    onStreamStopped?.()
  }, [onStreamStopped])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && streamRef.current) {
        stopCamera()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div className="camera-view">
      <video ref={videoRef} className="camera-view__video" playsInline muted />
      <div
        className="camera-view__overlay"
        style={{ '--scan-size': SCAN_AREA_SIZE }}
      >
        <div className="camera-view__scan-container">
          <div className="camera-view__scan-area" />
          <svg
            className="camera-view__tag-overlay"
            viewBox="0 0 480 480"
            preserveAspectRatio="none"
          >
            {detectedTags
              .filter((tag) => Array.isArray(tag.corners) && tag.corners.length >= 3)
              .map((tag, i) => (
              <polygon
                key={`${tag.tagId}-${i}`}
                points={tag.corners.map((c) => `${c.x},${c.y}`).join(' ')}
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
              />
            ))
            }
          </svg>
        </div>
      </div>
      {!isActive && (
        <div className="camera-view__controls">
          <button
            type="button"
            className="camera-view__btn"
            onClick={startCamera}
            disabled={!!error}
          >
            Kamera starten
          </button>
          {error && <p className="camera-view__error">{error}</p>}
        </div>
      )}
    </div>
  )
}
