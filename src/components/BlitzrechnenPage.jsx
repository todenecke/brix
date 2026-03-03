import { useState, useCallback, useEffect, useRef } from 'react'
import CameraView from './CameraView'
import LiveViewTagInfo from './LiveViewTagInfo'
import { useAprilDetection } from '../hooks/useAprilDetection'
import { useProcessedTagTracker } from '../hooks/useProcessedTagTracker'
import { CAMERA_CONFIG, STEINE_CONFIG } from '../config/brixConfig'
import { useDebugMode } from '../contexts/DebugModeContext'
import { ANZAHL_AUFGABEN, MAX_FEHLVERSUCHE, TAG_ID_GRUEN, TAG_ID_ROT } from '../config/blitzrechnenConfig'
import { generateMathProblems } from '../services/mathProblemService'
import './BlitzrechnenPage.css'

const GRUEN = STEINE_CONFIG.find((s) => s.tagId === TAG_ID_GRUEN)
const ROT = STEINE_CONFIG.find((s) => s.tagId === TAG_ID_ROT)

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function BlitzrechnenPage({
  onRotateContent,
  onRotateLiveView,
  rotationContent = 0,
  rotationLiveView = 0,
}) {
  const [video, setVideo] = useState(null)
  const [gameState, setGameState] = useState('idle')
  const [problems, setProblems] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [showOkFeedback, setShowOkFeedback] = useState(false)
  const [showWrongFeedback, setShowWrongFeedback] = useState(false)
  const [lastAddedType, setLastAddedType] = useState(null)
  const timerRef = useRef(null)
  const lastDetectedTagRef = useRef(null)

  const liveView = CAMERA_CONFIG.liveView ?? 'config'
  const captureMode = liveView === 'full' ? 'full' : 'strip'
  const scanMode = liveView === 'full' ? 'full' : 'strip'

  const { detectedTags, captureDims, isRunning, start, stop } = useAprilDetection(video, {
    captureMode,
  })
  const { shouldProcess, markProcessed, reset: resetTracker } = useProcessedTagTracker(detectedTags)
  const { debugMode } = useDebugMode()

  const startGame = useCallback(() => {
    setProblems(generateMathProblems(ANZAHL_AUFGABEN))
    setCurrentIndex(0)
    setCorrectCount(0)
    setWrongCount(0)
    setSecondsElapsed(0)
    setGameState('playing')
    setShowOkFeedback(false)
    setShowWrongFeedback(false)
    setLastAddedType(null)
    resetTracker()
  }, [resetTracker])

  useEffect(() => {
    if (gameState === 'playing' && video) {
      start()
    }
  }, [gameState, video, start])

  useEffect(() => {
    if (gameState !== 'playing') return

    timerRef.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState])

  useEffect(() => {
    if (gameState !== 'playing' || currentIndex >= problems.length || !detectedTags.length) return

    const currentProblem = problems[currentIndex]
    const expectedCorrect = currentProblem.isCorrect
    const detected = detectedTags.find((t) => t.tagId === TAG_ID_GRUEN || t.tagId === TAG_ID_ROT)

    if (!detected || !shouldProcess(detected.tagId)) return

    markProcessed(detected.tagId)
    const userSaidCorrect = detected.tagId === TAG_ID_GRUEN
    const isRightAnswer = userSaidCorrect === expectedCorrect

    if (isRightAnswer) {
      setShowOkFeedback(true)
      setTimeout(() => setShowOkFeedback(false), 400)
      setLastAddedType('correct')
      setCorrectCount((c) => c + 1)
      if (currentIndex + 1 >= problems.length) {
        stop()
        setGameState('won')
      } else {
        setCurrentIndex((i) => i + 1)
      }
    } else {
      setShowWrongFeedback(true)
      setTimeout(() => setShowWrongFeedback(false), 400)
      setLastAddedType('wrong')
      const nextWrong = wrongCount + 1
      setWrongCount(nextWrong)
      if (nextWrong >= MAX_FEHLVERSUCHE) {
        stop()
        setGameState('lost')
      } else {
        setCurrentIndex((i) => i + 1)
      }
    }
  }, [gameState, currentIndex, problems, detectedTags, wrongCount, stop, shouldProcess, markProcessed])

  const resetGame = useCallback(() => {
    stop()
    setGameState('idle')
    setProblems([])
  }, [stop])

  const handleVideoReady = useCallback((videoEl) => setVideo(videoEl), [])
  const handleStreamStopped = useCallback(() => {
    setVideo(null)
    stop()
  }, [stop])

  const isPlaying = gameState === 'playing'
  const currentProblem = problems[currentIndex]

  return (
    <div className="blitzrechnen">
      <aside
        className="blitzrechnen__overlay"
        style={rotationContent ? { transform: `rotate(${rotationContent}deg)` } : undefined}
      >
        {gameState === 'idle' && (
          <div className="blitzrechnen__anleitung">
            <h2 className="blitzrechnen__anleitung-ueberschrift">Anleitung</h2>
            <p className="blitzrechnen__anleitung-text">
              Rechnung stimmt?
              <br />Grün = richtig
              <br />Rot = falsch.
            </p>
            <div className="blitzrechnen__anleitung-beispiel">
              <p className="blitzrechnen__anleitung-beispiel-label">7 + 8 = 15 → grün</p>
              <div className="blitzrechnen__anleitung-steine">
                <div className="blitzrechnen__stein blitzrechnen__stein--anleitung" style={{ '--stein-farbe': GRUEN?.hex }}>
                  <span className="blitzrechnen__stein-label">richtig</span>
                </div>
                <div className="blitzrechnen__stein blitzrechnen__stein--anleitung" style={{ '--stein-farbe': ROT?.hex }}>
                  <span className="blitzrechnen__stein-label">falsch</span>
                </div>
              </div>
            </div>
            <div className="blitzrechnen__anleitung-hinweis-row">
              <p className="blitzrechnen__anleitung-hinweis">Frontkamera muss unten sein</p>
              {onRotateContent && (
                <button
                  type="button"
                  className="blitzrechnen__orient-btn blitzrechnen__orient-btn--content"
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

        {isPlaying && (
          <>
            <div className="blitzrechnen__game-controls">
              <span className="blitzrechnen__timer">{formatTime(secondsElapsed)}</span>
              <div className="blitzrechnen__stein-hinweis">
                <div className="blitzrechnen__stein blitzrechnen__stein--anleitung" style={{ '--stein-farbe': GRUEN?.hex }}>
                  <span className="blitzrechnen__stein-label">richtig</span>
                </div>
                <div className="blitzrechnen__stein blitzrechnen__stein--anleitung" style={{ '--stein-farbe': ROT?.hex }}>
                  <span className="blitzrechnen__stein-label">falsch</span>
                </div>
              </div>
              <div className="blitzrechnen__stacks">
                <div className="blitzrechnen__stack">
                  <span className="blitzrechnen__stack-label">{correctCount}</span>
                  <div className="blitzrechnen__stack-steine">
                    {Array.from({ length: correctCount }, (_, i) => (
                      <div
                        key={`correct-${i}`}
                        className={`blitzrechnen__stein-row ${lastAddedType === 'correct' && i === correctCount - 1 ? 'blitzrechnen__stein-row--fall' : ''}`}
                      >
                        <div
                          className="blitzrechnen__stein blitzrechnen__stein--erledigt"
                          style={{ '--stein-farbe': GRUEN?.hex }}
                        >
                          <svg className="blitzrechnen__stein-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="blitzrechnen__stack">
                  <span className="blitzrechnen__stack-label">{wrongCount}</span>
                  <div className="blitzrechnen__stack-steine">
                    {Array.from({ length: wrongCount }, (_, i) => (
                      <div
                        key={`wrong-${i}`}
                        className={`blitzrechnen__stein-row ${lastAddedType === 'wrong' && i === wrongCount - 1 ? 'blitzrechnen__stein-row--fall' : ''}`}
                      >
                        <div
                          className="blitzrechnen__stein blitzrechnen__stein--erledigt"
                          style={{ '--stein-farbe': ROT?.hex }}
                        >
                          <span className="blitzrechnen__stein-label">✗</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <span className="blitzrechnen__fehler-hinweis">
                {wrongCount}/{MAX_FEHLVERSUCHE} Fehler
              </span>
            </div>
          </>
        )}

        {(gameState === 'won' || gameState === 'lost') && (
          <div className="blitzrechnen__result">
            <p
              className={`blitzrechnen__message-end ${
                gameState === 'won'
                  ? 'blitzrechnen__message-end--erfolg'
                  : 'blitzrechnen__message-end--niederlage'
              }`}
            >
              {gameState === 'won'
                ? `Super! ${correctCount}/${ANZAHL_AUFGABEN} richtig in ${formatTime(secondsElapsed)}`
                : `Leider nicht – 3 Fehlversuche. ${correctCount} richtig.`}
            </p>
            <button type="button" className="blitzrechnen__btn blitzrechnen__btn--secondary" onClick={resetGame}>
              Nochmal
            </button>
          </div>
        )}
      </aside>

      <div
        className="blitzrechnen__camera-wrap"
        style={rotationLiveView ? { transform: `rotate(${rotationLiveView}deg)` } : undefined}
      >
        {gameState === 'idle' && (
          <div className="blitzrechnen__liveview-idle-controls">
            <button
              type="button"
              className="blitzrechnen__btn blitzrechnen__btn--play blitzrechnen__btn--liveview"
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
                className="blitzrechnen__orient-btn blitzrechnen__orient-btn--center blitzrechnen__orient-btn--liveview"
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
        {isPlaying && currentProblem && (
          <div className="blitzrechnen__live-aufgabe" aria-live="polite">
            {currentProblem.text.split(' = ').map((part, i) => (
              <div key={i} className="blitzrechnen__live-aufgabe-line">
                {i === 1 ? `= ${part}` : part}
              </div>
            ))}
          </div>
        )}
        {showOkFeedback && (
          <div className="blitzrechnen__ok-feedback" aria-live="polite">
            ✓ Richtig
          </div>
        )}
        {showWrongFeedback && (
          <div className="blitzrechnen__wrong-feedback" aria-live="polite">
            Leider falsch
          </div>
        )}
      </div>
    </div>
  )
}
