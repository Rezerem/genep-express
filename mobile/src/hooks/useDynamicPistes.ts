import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/api/client'

interface Region {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

interface DynamicPistesResult {
  pistes: any
  loading: boolean
  error: Error | null
  onRegionChange: (region: Region, details?: any) => void
}

/**
 * Calculates bounding box from map region
 * Expands the bbox by a factor to ensure we load pistes beyond viewport edges
 */
function calculateBBox(
  region: Region,
  expansionFactor: number = 1.2
): {
  south: number
  west: number
  north: number
  east: number
} {
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region

  // Calculate expansion based on viewport size
  const latExpansion = (latitudeDelta * expansionFactor) / 2
  const lngExpansion = (longitudeDelta * expansionFactor) / 2

  return {
    south: latitude - latExpansion,
    west: longitude - lngExpansion,
    north: latitude + latExpansion,
    east: longitude + lngExpansion,
  }
}

export function useDynamicPistes(): DynamicPistesResult {
  const [pistes, setPistes] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastRegionRef = useRef<Region | null>(null)

  const onRegionChange = useCallback((region: Region, _details?: any) => {
    // Skip if region hasn't changed significantly
    if (lastRegionRef.current) {
      const prev = lastRegionRef.current
      const latDiff = Math.abs(region.latitude - prev.latitude)
      const lngDiff = Math.abs(region.longitude - prev.longitude)

      // Only reload if significant movement (more than 50% of current viewport)
      if (
        latDiff < region.latitudeDelta * 0.5 &&
        lngDiff < region.longitudeDelta * 0.5
      ) {
        return
      }
    }

    // Clear previous timer
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    // Debounce 500ms to avoid spam during rapid pan/zoom
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)

        const bbox = calculateBBox(region)
        const response = await api.getPistes(
          bbox.south,
          bbox.west,
          bbox.north,
          bbox.east
        )

        setPistes(response.data)
        lastRegionRef.current = region
        console.log(
          `[Pistes] Chargées pour région: ${region.latitude.toFixed(2)}, ${region.longitude.toFixed(2)}`
        )
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        console.warn('[Pistes] Erreur chargement:', error)
      } finally {
        setLoading(false)
      }
    }, 500)
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  return { pistes, loading, error, onRegionChange }
}
