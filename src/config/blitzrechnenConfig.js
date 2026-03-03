/**
 * Blitzrechnen – Konfiguration
 * Tag-IDs aus brixConfig.STEINE_CONFIG (grün=richtig, rot=falsch)
 */

import { STEINE_CONFIG } from './brixConfig'

export const ANZAHL_AUFGABEN = 10
export const MAX_FEHLVERSUCHE = 3
export const ZAHLENRAUM = 100

const gruenStein = STEINE_CONFIG.find((s) => s.farbe === 'grün')
const rotStein = STEINE_CONFIG.find((s) => s.farbe === 'rot')
export const TAG_ID_GRUEN = gruenStein?.tagId ?? 34  // richtig
export const TAG_ID_ROT = rotStein?.tagId ?? 5      // falsch
