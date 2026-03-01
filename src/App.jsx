import { useEffect, useState } from 'react'
import GamePage from './components/GamePage'
import GameScreen from './components/GameScreen'
import MenuButton from './components/MenuButton'
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

  useEffect(() => {
    try {
      localStorage.setItem(ROTATION_STORAGE_KEY, String(rotation))
    } catch {}
  }, [rotation])

  const cycleRotation = () => {
    setRotation((prev) => {
      const i = ROTATION_STEPS.indexOf(prev)
      return ROTATION_STEPS[(i + 1) % ROTATION_STEPS.length]
    })
  }

  return (
    <div className="app-rotate" style={{ '--app-rotation': `${rotation}deg` }}>
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
          <GamePage onRotate={cycleRotation} />
        )}
          {activePage === 'debug' && <GameScreen />}
        </div>
      </main>
    </div>
  )
}

export default App