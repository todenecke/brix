import { useEffect, useState } from 'react'
import GamePage from './components/GamePage'
import GameScreen from './components/GameScreen'
import MenuButton from './components/MenuButton'
import './App.css'

const MENU_OPTIONS = [
  { value: 'farben-stapeln', label: 'Farben stapeln', type: 'game' },
  { value: 'debug', label: 'Debug', type: 'debug' },
]

function App() {
  const [activePage, setActivePage] = useState('farben-stapeln')

  useEffect(() => {
    if (screen.orientation?.lock) {
      screen.orientation.lock('landscape').catch(() => {})
    }
  }, [])

  return (
    <main className="app">
      <nav className="app__nav">
        <MenuButton
          options={MENU_OPTIONS}
          activeValue={activePage}
          onSelect={setActivePage}
        />
      </nav>
      <div className="app__content">
        {activePage === 'farben-stapeln' && <GamePage />}
        {activePage === 'debug' && <GameScreen />}
      </div>
    </main>
  )
}

export default App