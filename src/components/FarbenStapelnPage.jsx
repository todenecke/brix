import { useState, useCallback, useEffect, useRef } from 'react'
import CameraView from './CameraView'
import LiveViewTagInfo from './LiveViewTagInfo'
import { useAprilDetection } from '../hooks/useAprilDetection'
import { useProcessedTagTracker } from '../hooks/useProcessedTagTracker'
import { CAMERA_CONFIG, STEINE_CONFIG } from '../config/brixConfig'
import { useDebugMode } from '../contexts/DebugModeContext'
import { shuffleSteine } from '../services/steineService'
import './FarbenStapelnPage.css'

const INITIAL_SECONDS = 60

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FarbenStapelnPage({
  onRotateContent,
  onRotateLiveView,
  rotationContent = 0,
  rotationLiveView = 0,
}) {
  const [video, setVideo] = useState(null)
  const [gameState, setGameState] = useState('idle')
  const [sequence, setSequence] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS)
  const [showOkFeedback, setShowOkFeedback] = useState(false)
  const [showWrongFeedback, setShowWrongFeedback] = useState(false)
  const timerRef = useRef(null)

  const liveView = CAMERA_CONFIG.liveView ?? 'config'
  const captureMode = liveView === 'full' ? 'full' : 'strip'
  const scanMode = liveView === 'full' ? 'full' : 'strip'

  const { detectedTags, captureDims, isRunning, start, stop } = useAprilDetection(video, {
    captureMode,
  })
  const { shouldProcess, markProcessed, reset: resetTracker } = useProcessedTagTracker(detectedTags)
  const { debugMode } = useDebugMode()

  const startGame = useCallback(() => {
    setSequence(shuffleSteine())
    setCurrentIndex(0)
    setSecondsLeft(INITIAL_SECONDS)
    setGameState('playing')
    setShowOkFeedback(false)
    setShowWrongFeedback(false)
    resetTracker()
  }, [resetTracker])

  const pauseGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    stop()
    setGameState('paused')
  }, [stop])

  const resumeGame = useCallback(() => {
    setGameState('playing')
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

  const processCorrect = useCallback(() => {
    if (gameState !== 'playing' || currentIndex >= sequence.length) return
    setShowOkFeedback(true)
    setTimeout(() => setShowOkFeedback(false), 400)
    if (currentIndex + 1 >= sequence.length) {
      if (timerRef.current) clearInterval(timerRef.current)
      setGameState('won')
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }, [gameState, currentIndex, sequence.length])

  const processWrong = useCallback(() => {
    if (gameState !== 'playing') return
    setShowWrongFeedback(true)
    setTimeout(() => setShowWrongFeedback(false), 400)
  }, [gameState])

  useEffect(() => {
    if (gameState !== 'playing' || currentIndex >= sequence.length || !detectedTags.length) return

    const expectedStein = sequence[currentIndex]
    const expectedTagId = expectedStein?.tagId
    const detected = detectedTags.find((t) => t.tagId === expectedTagId)

    if (detected && shouldProcess(expectedTagId)) {
      markProcessed(expectedTagId)
      processCorrect()
    }
  }, [gameState, currentIndex, sequence, detectedTags, shouldProcess, markProcessed, processCorrect])

  const handleVideoReady = useCallback((videoEl) => setVideo(videoEl), [])
  const handleStreamStopped = useCallback(() => {
    setVideo(null)
    stop()
  }, [stop])

  const isPlaying = gameState === 'playing'
  const isPaused = gameState === 'paused'

  return (
    <div className="farben-stapeln">
        <aside
          className="farben-stapeln__overlay"
          style={rotationContent ? { transform: `rotate(${rotationContent}deg)` } : undefined}
        >
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
              <div className="farben-stapeln__anleitung-hinweis-row">
                <p className="farben-stapeln__anleitung-hinweis">
                  Frontkamera muss unten sein
                </p>
                {onRotateContent && (
                  <button
                    type="button"
                    className="farben-stapeln__orient-btn farben-stapeln__orient-btn--content"
                    onClick={onRotateContent}
                    aria-label="Rotation Content – Spielsteine, Anleitung drehen"
                    title="Rotation Content"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2v6h-6" />
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                      <path d="M3 22v-6h6" />
                      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
          {(isPlaying || isPaused) && (
          <>
            <div className="farben-stapeln__game-controls farben-stapeln__game-controls--playing">
              <span className="farben-stapeln__timer">{formatTime(secondsLeft)}</span>
              <button
                type="button"
                className={`farben-stapeln__btn farben-stapeln__btn--play-toggle ${isPlaying ? 'farben-stapeln__btn--pause' : 'farben-stapeln__btn--play'}`}
                onClick={isPlaying ? pauseGame : resumeGame}
                aria-label={isPlaying ? 'Pausieren' : 'Fortsetzen'}
                title={isPlaying ? 'Pausieren' : 'Fortsetzen'}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>
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
                      {isErledigt && (
                        <svg className="farben-stapeln__stein-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
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

        <div
          className="farben-stapeln__camera-wrap"
          style={rotationLiveView ? { transform: `rotate(${rotationLiveView}deg)` } : undefined}
        >
        {gameState === 'idle' && (
          <div className="farben-stapeln__liveview-idle-controls">
            <button
              type="button"
              className="farben-stapeln__btn farben-stapeln__btn--play farben-stapeln__btn--liveview"
              onClick={startGame}
              aria-label="Spiel starten"
              title="Spiel starten"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            {onRotateLiveView && (
              <button
                type="button"
                className="farben-stapeln__orient-btn farben-stapeln__orient-btn--center farben-stapeln__orient-btn--liveview"
                onClick={onRotateLiveView}
                aria-label="Rotation Live View – Kamerabild drehen"
                title="Rotation Live View"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
              </button>
            )}
          </div>
        )}
        <CameraView
          onVideoReady={handleVideoReady}
          onStreamStopped={handleStreamStopped}
          detectedTags={isPlaying ? detectedTags : []}
          captureDims={captureDims}
          autoStart
          embedded
          scanMode={scanMode}
        />
        {debugMode && isPlaying && (
          <>
            <LiveViewTagInfo detectedTags={detectedTags} />
            <div className="farben-stapeln__debug-buttons-overlay">
              <button
                type="button"
                className="farben-stapeln__debug-btn farben-stapeln__debug-btn--richtig"
                onClick={processCorrect}
                title="Simulieren: richtiger Stein"
              >
                ✓
              </button>
              <button
                type="button"
                className="farben-stapeln__debug-btn farben-stapeln__debug-btn--falsch"
                onClick={processWrong}
                title="Simulieren: falscher Stein"
              >
                ✗
              </button>
            </div>
          </>
        )}
        {showOkFeedback && (
          <div className="farben-stapeln__ok-feedback" aria-live="polite">
            ✓ OK
          </div>
        )}
        {showWrongFeedback && (
          <div className="farben-stapeln__wrong-feedback" aria-live="polite">
            Leider falsch
          </div>
        )}
        </div>
    </div>
  )
}
