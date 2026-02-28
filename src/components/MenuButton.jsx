import { useState, useRef, useEffect } from 'react'
import './MenuButton.css'

export default function MenuButton({ options, activeValue, onSelect, side = 'left' }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])

  const handleSelect = (value) => {
    onSelect(value)
    setIsOpen(false)
  }

  const activeLabel = options.find((o) => o.value === activeValue)?.label ?? ''

  return (
    <div className={`menu-button menu-button--${side}`} ref={menuRef}>
      <button
        type="button"
        className="menu-button__trigger"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Menü öffnen"
        aria-expanded={isOpen}
      >
        <svg
          className="menu-button__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>
      {activeLabel && (
        <span className="menu-button__label">{activeLabel}</span>
      )}
      {isOpen && (
        <div className="menu-button__dropdown">
          {options.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`menu-button__option ${activeValue === value ? 'menu-button__option--active' : ''}`}
              onClick={() => handleSelect(value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
