/**
 * Mapping: Spielstein-Farben zu AprilTag IDs
 * Die 6 magnetischen Spielsteine haben je einen AprilTag mit fester ID.
 * Hier kannst du die IDs an deine physischen Tags anpassen.
 */
export const STEINE_CONFIG = [
  { farbe: 'blau', tagId: 0, hex: '#3b82f6' },
  { farbe: 'rot', tagId: 5, hex: '#ef4444' },
  { farbe: 'orange', tagId: 13, hex: '#f97316' },
  { farbe: 'grün', tagId: 34, hex: '#22c55e' },
  { farbe: 'gelb', tagId: 42, hex: '#eab308' },
  { farbe: 'rosa', tagId: 21, hex: '#ec4899' },
]

export function getSteinByTagId(tagId) {
  return STEINE_CONFIG.find((s) => s.tagId === tagId)
}

export function getTagIdByFarbe(farbe) {
  return STEINE_CONFIG.find((s) => s.farbe === farbe)?.tagId
}

export function shuffleSteine() {
  const arr = [...STEINE_CONFIG]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
