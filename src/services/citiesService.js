import { CITIES_DATA } from '../config/wieWeitWegConfig'
import { STEINE_CONFIG } from '../config/brixConfig'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Wählt 3 deutsche + 3 ausländische Städte (aus CITIES_DATA) und ordnet sie den Steinen zu. Reihenfolge = sortiert nach Distanz. */
export function pickCitiesForGame() {
  const deutsche = CITIES_DATA.filter((c) => c.land === 'Deutschland')
  const auslaendische = CITIES_DATA.filter((c) => c.land !== 'Deutschland')
  const dreiDeutsch = shuffle(deutsche).slice(0, 3)
  const dreiAusland = shuffle(auslaendische).slice(0, 6 - dreiDeutsch.length)
  const selected = [...dreiDeutsch, ...dreiAusland].sort((a, b) => a.distanz_km - b.distanz_km)
  const steine = [...STEINE_CONFIG].sort(() => Math.random() - 0.5)
  const tagIdToCity = {}
  selected.forEach((city, i) => {
    tagIdToCity[steine[i].tagId] = { ...city, stein: steine[i] }
  })
  return {
    sequence: selected,
    tagIdToCity,
  }
}
