import { useState, useCallback } from 'react'
import CameraView from './CameraView'
import LiveViewTagInfo from './LiveViewTagInfo'
import { useAprilDetection } from '../hooks/useAprilDetection'
import { useDebugMode } from '../contexts/DebugModeContext'
import { captureFrame } from '../services/frameCapture'
import { detectPhoto } from '../services/photoDetection'
import './GameScreen.css'

export default function GameScreen() {
  const [video, setVideo] = useState(null)
  const [showTagFrames, setShowTagFrames] = useState(false)
  const [photoMode, setPhotoMode] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState(null)
  const [photoDetections, setPhotoDetections] = useState([])
  const [photoLoading, setPhotoLoading] = useState(false)

  const { debugMode } = useDebugMode()
  const { detectedTags, accumulatedTagIds, isRunning, start, stop, reset } =
    useAprilDetection(video)

  const handleVideoReady = useCallback((videoElement) => {
    setVideo(videoElement)
  }, [])

  const handleStreamStopped = useCallback(() => {
    setVideo(null)
    stop()
  }, [stop])

  const handleFoto = useCallback(async () => {
    if (!video) return
    setPhotoLoading(true)
    try {
      const imageData = captureFrame(video)
      const canvas = document.createElement('canvas')
      canvas.width = imageData.width
      canvas.height = imageData.height
      const ctx = canvas.getContext('2d')
      ctx.putImageData(imageData, 0, 0)
      setPhotoDataUrl(canvas.toDataURL('image/jpeg'))
      console.log('1. Foto gemacht')

      const detections = await detectPhoto(imageData)
      console.log(
        '2. Erkannte Tags:',
        detections.length > 0
          ? detections.map((t) => `ID ${t.tagId}`).join(', ')
          : '(keine)',
        detections
      )
      setPhotoDetections(detections)
      setPhotoMode(true)
    } catch (err) {
      console.error('Foto/Erkennung fehlgeschlagen:', err)
      setPhotoLoading(false)
    } finally {
      setPhotoLoading(false)
    }
  }, [video])

  const handleBackToLive = useCallback(() => {
    setPhotoMode(false)
    setPhotoDataUrl(null)
    setPhotoDetections([])
  }, [])

  return (
    <div className="game-screen">
      <div className="game-screen__options">
        <label className="game-screen__checkbox">
          <input
            type="checkbox"
            checked={showTagFrames}
            onChange={(e) => setShowTagFrames(e.target.checked)}
          />
          <span>Tags live Rahmen</span>
        </label>
      </div>
      <div className="game-screen__live-wrap">
        <CameraView
          onVideoReady={handleVideoReady}
          onStreamStopped={handleStreamStopped}
          detectedTags={showTagFrames ? detectedTags : []}
        />
        {debugMode && isRunning && (
          <LiveViewTagInfo detectedTags={detectedTags} />
        )}
      </div>
      {photoMode && photoDataUrl && (
        <div className="game-screen__photo-overlay">
          <div className="game-screen__photo-container">
            <img
              src={photoDataUrl}
              alt="Aufnahme"
              className="game-screen__photo"
            />
            <svg
              className="game-screen__photo-svg"
              viewBox="0 0 480 480"
              preserveAspectRatio="none"
            >
              {photoDetections
                .filter((tag) => Array.isArray(tag.corners) && tag.corners.length >= 3)
                .map((tag, i) => (
                  <g key={`${tag.tagId}-${i}`}>
                    <polygon
                      points={tag.corners.map((c) => `${c.x},${c.y}`).join(' ')}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                    />
                    <text
                      x={tag.center?.x ?? tag.corners[0]?.x ?? 0}
                      y={(tag.center?.y ?? tag.corners[0]?.y ?? 0) - 8}
                      textAnchor="middle"
                      fill="#22c55e"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      {tag.tagId}
                    </text>
                  </g>
                ))}
            </svg>
          </div>
          <button
            type="button"
            className="game-screen__btn game-screen__btn--primary game-screen__photo-back"
            onClick={handleBackToLive}
          >
            Zurück zur Live
          </button>
        </div>
      )}
      <div className="game-screen__hud">
        <div className="game-screen__stat">
          <span className="game-screen__label">Aktuell erkannt</span>
          <div className="game-screen__value game-screen__value--lines">
            {detectedTags.length > 0 ? (
              [...detectedTags]
                .sort((a, b) => (a.center?.y ?? 0) - (b.center?.y ?? 0))
                .map((t) => (
                  <span key={t.tagId} className="game-screen__tag-line">
                    {t.tagId}
                  </span>
                ))
            ) : (
              <span>–</span>
            )}
          </div>
        </div>
        <div className="game-screen__stat">
          <span className="game-screen__label">Erkannte Tags</span>
          <span className="game-screen__value">
            {accumulatedTagIds.length > 0
              ? accumulatedTagIds.join(', ')
              : '–'}
          </span>
        </div>
        <div className="game-screen__actions">
          {!isRunning && (
            <button
              type="button"
              className="game-screen__btn game-screen__btn--primary"
              onClick={start}
              disabled={!video}
            >
              Erkennung starten
            </button>
          )}
          <button
            type="button"
            className="game-screen__btn game-screen__btn--secondary"
            onClick={handleFoto}
            disabled={!video || photoLoading}
          >
            {photoLoading ? 'Analyse…' : 'Foto'}
          </button>
          <button
            type="button"
            className="game-screen__btn game-screen__btn--secondary"
            onClick={reset}
          >
            Tags zurücksetzen
          </button>
        </div>
      </div>
    </div>
  )
}
