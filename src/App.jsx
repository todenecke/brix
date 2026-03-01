import { useCallback, useState } from 'react'
import GamePage from './components/GamePage'
import GameScreen from './components/GameScreen'
import MenuButton from './components/MenuButton'
import './App.css'

const MENU_OPTIONS = [
  { value: 'farben-stapeln', label: 'Farben stapeln', type: 'game' },
  { value: 'debug', label: 'Debug', type: 'debug' },
]

const ROTATION_STEPS = [0, 90, 180, 270]
const ROTATION_CONTENT_KEY = 'brix-rotation-content'
const ROTATION_LIVEVIEW_KEY = 'brix-rotation-liveview'

function loadRotation(key) {
  try {
    const stored = localStorage.getItem(key)
    const val = stored ? parseInt(stored, 10) : 0
    return ROTATION_STEPS.includes(val) ? val : 0
  } catch {
    return 0
  }
}

function App() {
  const [activePage, setActivePage] = useState('farben-stapeln')
  const [rotationContent, setRotationContent] = useState(() => loadRotation(ROTATION_CONTENT_KEY))
  const [rotationLiveView, setRotationLiveView] = useState(() => loadRotation(ROTATION_LIVEVIEW_KEY))

  const cycleRotation = useCallback((key, setter) => {
    setter((prev) => {
      const i = ROTATION_STEPS.indexOf(prev)
      const next = ROTATION_STEPS[(i + 1) % ROTATION_STEPS.length]
      try {
        localStorage.setItem(key, String(next))
      } catch {}
      return next
    })
  }, [])

  const handleRotateContent = useCallback(() => {
    cycleRotation(ROTATION_CONTENT_KEY, setRotationContent)
  }, [cycleRotation])

  const handleRotateLiveView = useCallback(() => {
    cycleRotation(ROTATION_LIVEVIEW_KEY, setRotationLiveView)
  }, [cycleRotation])

  return (
    <div className="app-rotate">
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
          <GamePage
            onRotateContent={handleRotateContent}
            onRotateLiveView={handleRotateLiveView}
            rotationContent={rotationContent}
            rotationLiveView={rotationLiveView}
          />
        )}
          {activePage === 'debug' && <GameScreen />}
        </div>
      </main>
    </div>
  )
}

export default App