import { useCallback, useEffect, useState } from 'react'
import GamePage from './components/GamePage'
import GameScreen from './components/GameScreen'
import MenuButton from './components/MenuButton'
import { lockOrientationLandscape } from './utils/orientationLock'
import './App.css'

const MENU_OPTIONS = [
  { value: 'farben-stapeln', label: 'Farben stapeln', type: 'game' },
  { value: 'debug', label: 'Debug', type: 'debug' },
]

const ROTATION_STEPS = [0, 90, 180, 270]
const ROTATION_STORAGE_KEY = 'brix-rotation'

function App() {
  const [activePage, setActivePage] = useState('farben-stapeln')
  const [rotation, setRotation] = useState(() => {
    try {
      const stored = localStorage.getItem(ROTATION_STORAGE_KEY)
      const val = stored ? parseInt(stored, 10) : 0
      return ROTATION_STEPS.includes(val) ? val : 0
    } catch {
      return 0
    }
  })
  const [useNativeLock, setUseNativeLock] = useState(false)

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setUseNativeLock(false)
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', onFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
    }
  }, [])

  const handleOrientationFix = useCallback(async () => {
    const ok = await lockOrientationLandscape()
    if (ok) {
      setUseNativeLock(true)
      setRotation(0)
      try {
        localStorage.setItem(ROTATION_STORAGE_KEY, '0')
      } catch {}
    } else {
      setUseNativeLock(false)
      setRotation((prev) => {
        const i = ROTATION_STEPS.indexOf(prev)
        const next = ROTATION_STEPS[(i + 1) % ROTATION_STEPS.length]
        try {
          localStorage.setItem(ROTATION_STORAGE_KEY, String(next))
        } catch {}
        return next
      })
    }
  }, [])

  return (
    <div className="app-rotate" style={{ '--app-rotation': useNativeLock ? '0deg' : `${rotation}deg` }}>
      <main className="app">
        <nav className="app__nav">
          <MenuButton
            options={MENU_OPTIONS}
            activeValue={activePage}
            onSelect={setActivePage}
          />
          {activePage === 'farben-stapeln' && (
            <div id="nav-game-slot" className="app__nav-slot" />
          )}
        </nav>
        <div className="app__content">
          {activePage === 'farben-stapeln' && (
          <GamePage onOrientationFix={handleOrientationFix} />
        )}
          {activePage === 'debug' && <GameScreen />}
        </div>
      </main>
    </div>
  )
}

export default App