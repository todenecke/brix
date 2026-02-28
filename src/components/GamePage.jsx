import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import CameraView from './CameraView'
import { useAprilDetection } from '../hooks/useAprilDetection'
import { shuffleSteine } from '../config/steineConfig'
import './GamePage.css'

const INITIAL_SECONDS = 60

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function GamePage() {
  const [video, setVideo] = useState(null)
  const [gameState, setGameState] = useState('idle')
  const [sequence, setSequence] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS)
  const [showOkFeedback, setShowOkFeedback] = useState(false)
  const timerRef = useRef(null)
  const lastDetectedTagRef = useRef(null)

  const { detectedTags, isRunning, start, stop } = useAprilDetection(video, {
    captureMode: 'strip',
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
        <button
          type="button"
          className="farben-stapeln__btn farben-stapeln__btn--primary"
          onClick={startGame}
        >
          Start
        </button>
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
        </div>
      )}
    </div>
  )

  return (
    <>
      {navSlot && createPortal(navControls, navSlot)}
      <div className="farben-stapeln">
        <aside className="farben-stapeln__overlay">
          {isPlaying && (
          <div className="farben-stapeln__steine">
            {[...sequence].reverse().map((stein, i) => {
              const origIndex = sequence.length - 1 - i
              return (
              <div
                key={`${stein.farbe}-${origIndex}`}
                className={`farben-stapeln__stein ${
                  origIndex === currentIndex ? 'farben-stapeln__stein--aktuell' : ''
                } ${origIndex < currentIndex ? 'farben-stapeln__stein--erledigt' : ''}`}
                style={{ '--stein-farbe': stein.hex }}
              >
                <span className="farben-stapeln__stein-label">{stein.farbe}</span>
              </div>
              );
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
          autoStart
          embedded
          scanMode="strip"
        />
        {gameState === 'idle' && (
          <div className="farben-stapeln__camera-placeholder">
            <p>Klicke Start, um zu beginnen</p>
          </div>
        )}
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
