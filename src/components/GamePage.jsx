import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import CameraView from './CameraView'
import { useAprilDetection } from '../hooks/useAprilDetection'
import { CAMERA_CONFIG, STEINE_CONFIG } from '../config/brixConfig'
import { shuffleSteine } from '../services/steineService'
import './GamePage.css'

const INITIAL_SECONDS = 60

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function GamePage({ onOrientationFix }) {
  const [video, setVideo] = useState(null)
  const [gameState, setGameState] = useState('idle')
  const [sequence, setSequence] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS)
  const [showOkFeedback, setShowOkFeedback] = useState(false)
  const timerRef = useRef(null)
  const lastDetectedTagRef = useRef(null)

  const liveView = CAMERA_CONFIG.liveView ?? 'config'
  const captureMode = liveView === 'full' ? 'full' : 'strip'
  const scanMode = liveView === 'full' ? 'full' : 'strip'

  const { detectedTags, captureDims, isRunning, start, stop } = useAprilDetection(video, {
    captureMode,
  })

  const startGame = useCallback(() => {
    setSequence(shuffleSteine())
    setCurrentIndex(0)
    setSecondsLeft(INITIAL_SECONDS)
    setGameState('playing')
    setShowOkFeedback(false)
    lastDetectedTagRef.current = null
  }, [])

  useEffect(() => {
    if (gameState === 'playing' && video) {
      start()
    }
  }, [gameState, video, start])

  const resetGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    stop()
    setGameState('idle')
    setSequence([])
  }, [stop])

  useEffect(() => {
    if (gameState !== 'playing') return

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setGameState('lost')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState])

  useEffect(() => {
    if (gameState !== 'playing' || currentIndex >= sequence.length || !detectedTags.length)
      return

    const expectedStein = sequence[currentIndex]
    const expectedTagId = expectedStein?.tagId
    const detected = detectedTags.find((t) => t.tagId === expectedTagId)

    if (detected && lastDetectedTagRef.current !== expectedTagId) {
      lastDetectedTagRef.current = expectedTagId
      setShowOkFeedback(true)
      setTimeout(() => setShowOkFeedback(false), 400)

      if (currentIndex + 1 >= sequence.length) {
        if (timerRef.current) clearInterval(timerRef.current)
        setGameState('won')
      } else {
        setCurrentIndex((i) => i + 1)
      }
    }
  }, [gameState, currentIndex, sequence, detectedTags])

  const handleVideoReady = useCallback((videoEl) => setVideo(videoEl), [])
  const handleStreamStopped = useCallback(() => {
    setVideo(null)
    stop()
  }, [stop])

  const isPlaying = gameState === 'playing'

  const navSlot = typeof document !== 'undefined' ? document.getElementById('nav-game-slot') : null
  const navControls = navSlot && (
    <div className="farben-stapeln__nav-controls">
      {gameState === 'idle' ? (
        <div className="farben-stapeln__nav-start">
          <button
            type="button"
            className="farben-stapeln__btn farben-stapeln__btn--primary"
            onClick={startGame}
          >
            Start
          </button>
          {onOrientationFix && (
            <button
              type="button"
              className="farben-stapeln__orient-btn"
              onClick={onOrientationFix}
              aria-label="Ausrichtung einstellen – Frontkamera nach unten"
              title="Ausrichtung einstellen – Frontkamera nach unten"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div className="farben-stapeln__nav-playing">
          <span className="farben-stapeln__timer">{formatTime(secondsLeft)}</span>
          {gameState === 'playing' && (
            <button
              type="button"
              className="farben-stapeln__btn farben-stapeln__btn--stop"
              onClick={resetGame}
            >
              Stop
            </button>
          )}
          {onOrientationFix && (
            <button
              type="button"
              className="farben-stapeln__orient-btn"
              onClick={onOrientationFix}
              aria-label="Ausrichtung einstellen – Frontkamera nach unten"
              title="Ausrichtung einstellen – Frontkamera nach unten"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      {navSlot && createPortal(navControls, navSlot)}
      <div className="farben-stapeln">
        <aside className="farben-stapeln__overlay">
          {gameState === 'idle' && (
            <div className="farben-stapeln__anleitung">
              <h2 className="farben-stapeln__anleitung-ueberschrift">Anleitung</h2>
              <p className="farben-stapeln__anleitung-text">
                Staple die farbigen Steine in der Reihenfolge, die oben erscheint. Halte jeden Stein in den Rahmen.
              </p>
              <div className="farben-stapeln__anleitung-steine">
                {STEINE_CONFIG.map((stein, i) => (
                  <div
                    key={stein.farbe}
                    className="farben-stapeln__stein farben-stapeln__stein--anleitung"
                    style={{ '--stein-farbe': stein.hex }}
                  >
                    <span className="farben-stapeln__stein-label">{stein.farbe}</span>
                  </div>
                ))}
              </div>
              <p className="farben-stapeln__anleitung-hinweis">
                📷 Frontkamera muss unten sein
              </p>
            </div>
          )}
          {isPlaying && (
          <div className="farben-stapeln__steine">
            {sequence
              .slice(0, currentIndex + 1)
              .map((stein, i) => {
                const origIndex = i
                const isErledigt = origIndex < currentIndex
                return (
                  <div key={`${stein.farbe}-${origIndex}`} className="farben-stapeln__stein-row">
                    <div
                      className={`farben-stapeln__stein ${
                        origIndex === currentIndex ? 'farben-stapeln__stein--aktuell' : ''
                      } ${isErledigt ? 'farben-stapeln__stein--erledigt' : ''}`}
                      style={{ '--stein-farbe': stein.hex }}
                    >
                      <span className="farben-stapeln__stein-label">{stein.farbe}</span>
                    </div>
                    <div className={`farben-stapeln__check-slot ${isErledigt ? 'farben-stapeln__check-slot--visible' : ''}`} aria-hidden="true">
                      {isErledigt && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {(gameState === 'won' || gameState === 'lost') && (
          <div className="farben-stapeln__result">
            <p
              className={`farben-stapeln__message ${
                gameState === 'won'
                  ? 'farben-stapeln__message--erfolg'
                  : 'farben-stapeln__message--niederlage'
              }`}
            >
              {gameState === 'won' ? 'Super, geschafft!' : "Versuch's nochmal"}
            </p>
            <button
              type="button"
              className="farben-stapeln__btn farben-stapeln__btn--secondary"
              onClick={resetGame}
            >
              Nochmal
            </button>
          </div>
          )}
        </aside>

        <div className="farben-stapeln__camera-wrap">
        <CameraView
          onVideoReady={handleVideoReady}
          onStreamStopped={handleStreamStopped}
          detectedTags={isPlaying ? detectedTags : []}
          captureDims={captureDims}
          autoStart
          embedded
          scanMode={scanMode}
        />
        {showOkFeedback && (
          <div className="farben-stapeln__ok-feedback" aria-live="polite">
            ✓ OK
          </div>
        )}
        </div>
      </div>
    </>
  )
}
