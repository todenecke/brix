import { STEINE_CONFIG } from '../config/brixConfig'

export function getSteinByTagId(tagId) {
  return STEINE_CONFIG.find((s) => s.tagId === tagId)
}

export function getTagIdByFarbe(farbe) {
  return STEINE_CONFIG.find((s) => s.farbe === farbe)?.tagId
}

export function shuffleSteine() {
  const arr = [...STEINE_CONFIG]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
