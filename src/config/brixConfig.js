/**
 * Brix – zentrale Konfiguration
 */

// ============ Spielsteine ============
/**
 * Mapping: Spielstein-Farben zu AprilTag IDs
 * Die 6 magnetischen Spielsteine haben je einen AprilTag mit fester ID.
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
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ============ Kamera ============
/**
 * displayOffsetX: Horizontaler Versatz des Live-Views in Pixel.
 * Durch die Kameraposition (z.B. seitlich im Notch) kann das Bild
 * gegenüber der Displaymitte versetzt wirken.
 * Positiv = nach rechts, Negativ = nach links.
 */
export const CAMERA_CONFIG = {
  displayOffsetX: 20,
}

// ============ Scan-Bereich ============
/**
 * Erkennungsbereich für AprilTag (weißer Rahmen in der Live-View).
 * stripWidth: Breite des Streifens in Pixel (volle Höhe).
 * stripHeight: Ausgabehöhe für die Erkennung (interne Auflösung).
 * stripPosition: "left" | "center" | "right" – horizontale Position.
 * stripOffsetX: Zusatzversatz in Pixel (positiv = rechts, negativ = links).
 */
export const SCAN_CONFIG = {
  stripWidth: 200,
  stripHeight: 480,
  stripPosition: 'center',
  stripOffsetX: 0,
}
