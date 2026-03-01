/**
 * Versucht, die Bildschirmausrichtung auf Querformat zu sperren.
 * Der Nutzer muss das Gerät so drehen, dass die Frontkamera unten ist.
 *
 * Bei PWA („auf Bildschirm installiert“) funktioniert der Lock oft ohne Vollbild.
 * Nur bei Fehlschlag wird Vollbild angefordert und erneut versucht.
 *
 * @returns {Promise<boolean>} true bei Erfolg, false wenn nicht unterstützt/abgelehnt
 */
export async function lockOrientationLandscape() {
  if (!screen.orientation?.lock) return false

  const tryLock = () => screen.orientation.lock('landscape')

  try {
    // Erst direkt versuchen (funktioniert oft bei installierter PWA)
    await tryLock()
    return true
  } catch {
    // Fallback: Vollbild anfordern, dann erneut sperren
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const el = document.documentElement
        if (el.requestFullscreen) {
          await el.requestFullscreen()
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen()
        } else {
          return false
        }
      }
      await tryLock()
      return true
    } catch {
      return false
    }
  }
}
