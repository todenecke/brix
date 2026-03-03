import { useCallback, useState } from 'react'
import { DebugModeProvider, useDebugMode } from './contexts/DebugModeContext'
import FarbenStapelnPage from './components/FarbenStapelnPage'
import GameScreen from './components/GameScreen'
import AufGutGlueckPage from './components/AufGutGlueckPage'
import WieWeitWegPage from './components/WieWeitWegPage'
import BlitzrechnenPage from './components/BlitzrechnenPage'
import MenuButton from './components/MenuButton'
import './App.css'

const MENU_OPTIONS_BASE = [
  { value: 'auf-gut-glueck', label: 'Auf gut Glück', type: 'slot' },
  { value: 'farben-stapeln', label: 'Farben stapeln', type: 'game' },
  { value: 'wie-weit-weg', label: 'Wie weit weg', type: 'game' },
  { value: 'blitzrechnen', label: 'Blitzrechnen', type: 'game' },
  { value: 'debug', label: 'Debug', type: 'debug' },
]

const ROTATION_DELTA = 180
const ROTATION_CONTENT_KEY = 'brix-rotation-content'
const ROTATION_LIVEVIEW_KEY = 'brix-rotation-liveview'

function loadRotation(key) {
  try {
    const stored = localStorage.getItem(key)
    const val = stored ? parseInt(stored, 10) : 0
    return Number.isFinite(val) ? val % 360 : 0
  } catch {
    return 0
  }
}

function AppDebugStrip() {
  const { debugMode, setDebugMode } = useDebugMode()
  return (
    <div className="app__debug-strip">
      <label className="app__debug-checkbox">
        <input
          type="checkbox"
          checked={debugMode}
          onChange={(e) => setDebugMode(e.target.checked)}
        />
        <span>Debug Mode (ID/Farbe in Live View)</span>
      </label>
    </div>
  )
}

function App() {
  const [activePage, setActivePage] = useState('farben-stapeln')
  const menuOptions = MENU_OPTIONS_BASE

  const [rotationContent, setRotationContent] = useState(() => loadRotation(ROTATION_CONTENT_KEY))
  const [rotationLiveView, setRotationLiveView] = useState(() => loadRotation(ROTATION_LIVEVIEW_KEY))

  const cycleRotation = useCallback((key, setter) => {
    setter((prev) => {
      const next = (prev + ROTATION_DELTA) % 360
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
    <DebugModeProvider>
    <div className="app-rotate">
      <main className="app">
        <nav className="app__nav">
          <MenuButton
            options={menuOptions}
            activeValue={activePage}
            onSelect={setActivePage}
          />
          {activePage === 'debug' && (
            <div className="app__nav-debug">
              <AppDebugStrip />
            </div>
          )}
        </nav>
        <div className="app__content">
          {activePage === 'farben-stapeln' && (
            <FarbenStapelnPage
            onRotateContent={handleRotateContent}
            onRotateLiveView={handleRotateLiveView}
            rotationContent={rotationContent}
            rotationLiveView={rotationLiveView}
            />
          )}
          {activePage === 'auf-gut-glueck' && (
            <AufGutGlueckPage onStartGame={setActivePage} />
          )}
          {activePage === 'wie-weit-weg' && (
            <WieWeitWegPage
              onRotateContent={handleRotateContent}
              onRotateLiveView={handleRotateLiveView}
              rotationContent={rotationContent}
              rotationLiveView={rotationLiveView}
            />
          )}
          {activePage === 'blitzrechnen' && (
            <BlitzrechnenPage
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
    </DebugModeProvider>
  )
}

export default App