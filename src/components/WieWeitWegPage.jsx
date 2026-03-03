import { useState, useCallback, useEffect, useRef } from 'react'
import CameraView from './CameraView'
import LiveViewTagInfo from './LiveViewTagInfo'
import { useAprilDetection } from '../hooks/useAprilDetection'
import { useProcessedTagTracker } from '../hooks/useProcessedTagTracker'
import { CAMERA_CONFIG, STEINE_CONFIG } from '../config/brixConfig'
import { useDebugMode } from '../contexts/DebugModeContext'
import { BEZUGSSTADT } from '../config/wieWeitWegConfig'
import { pickCitiesForGame } from '../services/citiesService'
import './WieWeitWegPage.css'

const MAX_FEHLVERSUCHE = 3

export default function WieWeitWegPage({
  onRotateContent,
  onRotateLiveView,
  rotationContent = 0,
  rotationLiveView = 0,
}) {
  const [video, setVideo] = useState(null)
  const [gameState, setGameState] = useState('idle')
  const [sequence, setSequence] = useState([])
  const [tagIdToCity, setTagIdToCity] = useState({})
  const [remainingCities, setRemainingCities] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [showOkFeedback, setShowOkFeedback] = useState(false)
  const [showWrongFeedback, setShowWrongFeedback] = useState(false)

  const liveView = CAMERA_CONFIG.liveView ?? 'config'
  const captureMode = liveView === 'full' ? 'full' : 'strip'
  const scanMode = liveView === 'full' ? 'full' : 'strip'

  const { detectedTags, captureDims, isRunning, start, stop } = useAprilDetection(video, {
    captureMode,
  })
  const { shouldProcess, markProcessed, reset: resetTracker } = useProcessedTagTracker(detectedTags)
  const { debugMode } = useDebugMode()

  const shuffle = useCallback((arr) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }, [])

  const startGame = useCallback(() => {
    const { sequence: seq, tagIdToCity: mapping } = pickCitiesForGame()
    setSequence(seq)
    setTagIdToCity(mapping)
    setRemainingCities(shuffle([...seq]))
    setCurrentIndex(0)
    setWrongAttempts(0)
    setGameState('playing')
    setShowOkFeedback(false)
    setShowWrongFeedback(false)
    resetTracker()
  }, [shuffle, resetTracker])

  const pauseGame = useCallback(() => {
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
    stop()
    setGameState('idle')
    setSequence([])
    setTagIdToCity({})
    setRemainingCities([])
  }, [stop])

  useEffect(() => {
    if (gameState !== 'playing' || currentIndex >= sequence.length || !detectedTags.length) return

    const expectedCity = sequence[currentIndex]
    const expectedTagIds = Object.entries(tagIdToCity)
      .filter(([, c]) => c.stadt === expectedCity.stadt)
      .map(([tid]) => parseInt(tid, 10))

    const detected = detectedTags.find((t) => expectedTagIds.includes(t.tagId))

    if (detected && shouldProcess(detected.tagId)) {
      markProcessed(detected.tagId)
      setShowOkFeedback(true)
      setTimeout(() => setShowOkFeedback(false), 400)

      const placedCity = sequence[currentIndex]
      setRemainingCities((prev) => prev.filter((c) => c.stadt !== placedCity.stadt))
      if (currentIndex + 1 >= sequence.length) {
        setGameState('won')
      } else {
        setCurrentIndex((i) => i + 1)
      }
      return
    }

    const wrongTag = detectedTags.find(
      (t) => Object.keys(tagIdToCity).includes(String(t.tagId)) && !expectedTagIds.includes(t.tagId)
    )
    if (wrongTag && shouldProcess(wrongTag.tagId)) {
      markProcessed(wrongTag.tagId)
      setShowWrongFeedback(true)
      setTimeout(() => setShowWrongFeedback(false), 400)

      const nextAttempts = wrongAttempts + 1
      setWrongAttempts(nextAttempts)
      if (nextAttempts >= MAX_FEHLVERSUCHE) {
        setGameState('lost')
      }
    }
  }, [gameState, currentIndex, sequence, tagIdToCity, detectedTags, wrongAttempts, shouldProcess, markProcessed])

  const handleVideoReady = useCallback((videoEl) => setVideo(videoEl), [])
  const handleStreamStopped = useCallback(() => {
    setVideo(null)
    stop()
  }, [stop])

  const isPlaying = gameState === 'playing'
  const isPaused = gameState === 'paused'
  const beispielStaedte = ['Brüssel', 'Amsterdam', 'Paris', 'Bern', 'London', 'Kopenhagen']
  const beispielSteine = beispielStaedte.map((stadt, i) => ({
    stadt,
    stein: STEINE_CONFIG[i],
  }))

  return (
    <div className="wie-weit-weg">
      <aside
        className="wie-weit-weg__overlay"
        style={rotationContent ? { transform: `rotate(${rotationContent}deg)` } : undefined}
      >
        {gameState === 'idle' && (
          <div className="wie-weit-weg__anleitung">
            <h2 className="wie-weit-weg__anleitung-ueberschrift">Anleitung</h2>
            <p className="wie-weit-weg__anleitung-text">
              Sortiere die Städte nach Distanz zu {BEZUGSSTADT}. Die nächste Stadt als erste.
              Zeige jeden Stein nacheinander in den Rahmen.
            </p>
            <div className="wie-weit-weg__anleitung-beispiel">
              <p className="wie-weit-weg__anleitung-beispiel-label">Brüssel ist am nächsten zu Köln</p>
              <div className="wie-weit-weg__anleitung-beispiel-steine">
                {beispielSteine.map(({ stadt, stein }) => (
                  <div
                    key={stadt}
                    className="wie-weit-weg__stein wie-weit-weg__stein--anleitung"
                    style={{ '--stein-farbe': stein.hex }}
                  >
                    <span className="wie-weit-weg__stein-label">{stadt}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="wie-weit-weg__anleitung-hinweis-row">
              <p className="wie-weit-weg__anleitung-hinweis">Frontkamera muss unten sein</p>
              {onRotateContent && (
                <button
                  type="button"
                  className="wie-weit-weg__orient-btn wie-weit-weg__orient-btn--content"
                  onClick={onRotateContent}
                  aria-label="Rotation Content – Anleitung drehen"
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
            <div className="wie-weit-weg__game-controls">
              <span className="wie-weit-weg__attempts">
                Fehlversuche: {wrongAttempts}/{MAX_FEHLVERSUCHE}
              </span>
              <button
                type="button"
                className={`wie-weit-weg__btn wie-weit-weg__btn--play-toggle ${isPlaying ? 'wie-weit-weg__btn--pause' : 'wie-weit-weg__btn--play'}`}
                onClick={isPlaying ? pauseGame : resumeGame}
                aria-label={isPlaying ? 'Pausieren' : 'Fortsetzen'}
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
            <p className="wie-weit-weg__message">
              Sortiere Städte nach Distanz zu {BEZUGSSTADT}. Die nächste Stadt als erste.
            </p>
            <div className="wie-weit-weg__steine-container">
              <div className="wie-weit-weg__stein-pool">
                {remainingCities.map((city) => {
                  const stein = Object.values(tagIdToCity).find((c) => c.stadt === city.stadt)?.stein
                  return (
                    <div
                      key={city.stadt}
                      className="wie-weit-weg__stein"
                      style={stein ? { '--stein-farbe': stein.hex } : undefined}
                    >
                      <span className="wie-weit-weg__stein-label">{city.stadt}</span>
                    </div>
                  )
                })}
              </div>
              <div className="wie-weit-weg__stein-result">
                {sequence.slice(0, currentIndex).map((city, i) => {
                  const stein = Object.values(tagIdToCity).find((c) => c.stadt === city.stadt)?.stein
                  const isNewlyPlaced = i === currentIndex - 1
                  return (
                    <div
                      key={`${city.stadt}-${i}`}
                      className={`wie-weit-weg__stein-row ${isNewlyPlaced ? 'wie-weit-weg__stein-row--fall' : ''}`}
                    >
                      <div
                        className="wie-weit-weg__stein wie-weit-weg__stein--erledigt"
                        style={stein ? { '--stein-farbe': stein.hex } : undefined}
                      >
                        <span className="wie-weit-weg__stein-label">{city.stadt}</span>
                        <svg className="wie-weit-weg__stein-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {(gameState === 'won' || gameState === 'lost') && (
          <div className="wie-weit-weg__result">
            <p
              className={`wie-weit-weg__message-end ${
                gameState === 'won'
                  ? 'wie-weit-weg__message-end--erfolg'
                  : 'wie-weit-weg__message-end--niederlage'
              }`}
            >
              {gameState === 'won' ? 'Super, geschafft!' : 'Leider nicht – 3 Fehlversuche.'}
            </p>
            <button type="button" className="wie-weit-weg__btn wie-weit-weg__btn--secondary" onClick={resetGame}>
              Nochmal
            </button>
          </div>
        )}
      </aside>

      <div
        className="wie-weit-weg__camera-wrap"
        style={rotationLiveView ? { transform: `rotate(${rotationLiveView}deg)` } : undefined}
      >
        {gameState === 'idle' && (
          <div className="wie-weit-weg__liveview-idle-controls">
            <button
              type="button"
              className="wie-weit-weg__btn wie-weit-weg__btn--play wie-weit-weg__btn--liveview"
              onClick={startGame}
              aria-label="Spiel starten"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            {onRotateLiveView && (
              <button
                type="button"
                className="wie-weit-weg__orient-btn wie-weit-weg__orient-btn--center wie-weit-weg__orient-btn--liveview"
                onClick={onRotateLiveView}
                aria-label="Rotation Live View – Kamerabild drehen"
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
          <LiveViewTagInfo detectedTags={detectedTags} />
        )}
        {showOkFeedback && (
          <div className="wie-weit-weg__ok-feedback" aria-live="polite">
            ✓ OK
          </div>
        )}
        {showWrongFeedback && (
          <div className="wie-weit-weg__wrong-feedback" aria-live="polite">
            Leider falsch
          </div>
        )}
      </div>
    </div>
  )
}
