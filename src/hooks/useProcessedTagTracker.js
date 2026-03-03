import { useCallback, useEffect, useRef } from 'react'

/**
 * Zentrale Logik: Tag-Erkennung „debouncen“ –
 * verhindert Doppelverarbeitung, setzt zurück wenn Tag aus dem Bild geht.
 *
 * @param {Array<{ tagId: number }>} detectedTags – aktuell erkannte Tags
 * @returns {{ shouldProcess: (tagId: number) => boolean, markProcessed: (tagId: number) => void, reset: () => void }}
 */
export function useProcessedTagTracker(detectedTags) {
  const lastProcessedRef = useRef(null)

  useEffect(() => {
    const stillVisible =
      lastProcessedRef.current != null &&
      detectedTags.some((t) => t.tagId === lastProcessedRef.current)
    if (!stillVisible) {
      lastProcessedRef.current = null
    }
  }, [detectedTags])

  const shouldProcess = useCallback(
    (tagId) => {
      if (!detectedTags.some((t) => t.tagId === tagId)) return false
      if (lastProcessedRef.current === tagId) return false
      return true
    },
    [detectedTags]
  )

  const markProcessed = useCallback((tagId) => {
    lastProcessedRef.current = tagId
  }, [])

  const reset = useCallback(() => {
    lastProcessedRef.current = null
  }, [])

  return { shouldProcess, markProcessed, reset }
}
