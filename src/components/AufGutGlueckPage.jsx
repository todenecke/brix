import { useState, useCallback } from 'react'
import './AufGutGlueckPage.css'

const GAMES = [
  'StapelSprint',
  'DenkTurm',
  'FarbenRang',
  'BlitzStapel',
  'ReihenMeister',
  'KopfStapel',
  'LogikTurm',
  'SchnellSortiert',
  'RangDuell',
  'TurmTest',
  'SortierSprint',
  'FarbenDuell',
  'DenkReihe',
  'TempoTurm',
  'StapelCheck',
  'ReihenRausch',
  'RangJagd',
  'TurmQuiz',
  'DenkSprint',
  'FarbenFieber',
  'Farben stapeln',
  'Wie weit weg',
  'Blitzrechnen',
]

function GameIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="auf-gut-glueck__game-icon">
      <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h18v8zM6 15h2v-2H6v2zm4 0h2V9h-2v6zm4 0h2v-4h-2v4z" />
    </svg>
  )
}

/** Mapping: Slot-Spielname → App-Seite. Bei neuen Spielen hier eintragen. */
const GAME_TO_PAGE = {
  StapelSprint: 'farben-stapeln',
  DenkTurm: 'farben-stapeln',
  FarbenRang: 'farben-stapeln',
  BlitzStapel: 'farben-stapeln',
  ReihenMeister: 'farben-stapeln',
  KopfStapel: 'farben-stapeln',
  LogikTurm: 'farben-stapeln',
  SchnellSortiert: 'farben-stapeln',
  RangDuell: 'farben-stapeln',
  TurmTest: 'farben-stapeln',
  SortierSprint: 'farben-stapeln',
  FarbenDuell: 'farben-stapeln',
  DenkReihe: 'farben-stapeln',
  TempoTurm: 'farben-stapeln',
  StapelCheck: 'farben-stapeln',
  ReihenRausch: 'farben-stapeln',
  RangJagd: 'farben-stapeln',
  TurmQuiz: 'farben-stapeln',
  DenkSprint: 'farben-stapeln',
  FarbenFieber: 'farben-stapeln',
  'Farben stapeln': 'farben-stapeln',
  'Wie weit weg': 'wie-weit-weg',
  Blitzrechnen: 'blitzrechnen',
}

const SELECTABLE_GAMES = ['Farben stapeln', 'Wie weit weg', 'Blitzrechnen']

export default function AufGutGlueckPage({ onStartGame }) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [reelOffset, setReelOffset] = useState(0)
  const [hasSpunOnce, setHasSpunOnce] = useState(false)
  const [lastSelectedGame, setLastSelectedGame] = useState(null)

  const spin = useCallback(() => {
    if (isSpinning) return

    setIsSpinning(true)
    setResult(null)
    setHasSpunOnce(true)

    const fullLoops = 5 + Math.floor(Math.random() * 3)
    const candidates = lastSelectedGame
      ? SELECTABLE_GAMES.filter((g) => g !== lastSelectedGame)
      : SELECTABLE_GAMES
    const pickFrom = candidates.length > 0 ? candidates : SELECTABLE_GAMES
    const winner = pickFrom[Math.floor(Math.random() * pickFrom.length)]
    setLastSelectedGame(winner)
    const winnerIndex = GAMES.indexOf(winner)
    const itemHeight = 280
    const startCopy = 5
    const finalOffset = (startCopy * GAMES.length + fullLoops * GAMES.length + winnerIndex) * itemHeight

    setReelOffset(finalOffset)

    setTimeout(() => {
      setIsSpinning(false)
      setResult(GAMES[winnerIndex])
    }, 3200)
  }, [isSpinning, lastSelectedGame])

  const handleStart = useCallback(() => {
    if (!result || !onStartGame) return
    const page = GAME_TO_PAGE[result] ?? 'farben-stapeln'
    onStartGame(page)
  }, [result, onStartGame])

  const displayItems = Array.from({ length: 15 }, () => GAMES).flat()

  return (
    <div className="auf-gut-glueck">
      <p className="auf-gut-glueck__label">
        Dreh das Glücksrad um Dein Spiel zu wählen
      </p>
      <div className={`auf-gut-glueck__reel-frame ${isSpinning ? 'auf-gut-glueck__reel-frame--spinning' : ''}`}>
        <div className="auf-gut-glueck__reel-window">
          <div
            className={`auf-gut-glueck__reel-strip ${isSpinning ? 'auf-gut-glueck__reel-strip--spinning' : ''}`}
            style={{ transform: `translateY(-${reelOffset}px)` }}
          >
            {displayItems.map((name, i) => (
              <div key={`${name}-${i}`} className="auf-gut-glueck__reel-item">
                <GameIcon />
                <span className="auf-gut-glueck__game-name">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auf-gut-glueck__actions">
        <button
          type="button"
          className="auf-gut-glueck__play-btn"
          onClick={spin}
          disabled={isSpinning}
          aria-label={hasSpunOnce ? 'Nochmal' : 'Drehen'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          {isSpinning ? 'Dreht…' : hasSpunOnce ? 'nochmal' : 'Drehen'}
        </button>

        {result && !isSpinning && (
          <div className="auf-gut-glueck__result-block">
            <p className="auf-gut-glueck__result">Du spielst: {result}</p>
            <button
              type="button"
              className="auf-gut-glueck__los-btn"
              onClick={handleStart}
            >
              zum Game
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
