import { createContext, useContext, useState } from 'react'
import { DEBUG_MODE } from '../config/brixConfig'

const DebugModeContext = createContext(null)

export function DebugModeProvider({ children }) {
  const [debugMode, setDebugMode] = useState(DEBUG_MODE)
  return (
    <DebugModeContext.Provider value={{ debugMode, setDebugMode }}>
      {children}
    </DebugModeContext.Provider>
  )
}

export function useDebugMode() {
  const ctx = useContext(DebugModeContext)
  if (!ctx) {
    return { debugMode: DEBUG_MODE, setDebugMode: () => {} }
  }
  return ctx
}
