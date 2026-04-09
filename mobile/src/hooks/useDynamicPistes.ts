import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/api/client'

/**
 * Hook for dynamically loading ski piste data based on map region
 *
 * DEBUG: Test locations with known OSM piste data:
 * - Paris (48.8566, 2.3522) — ski parks with rich data
 * - Grenoble (45.1885, 5.7245) — close to Alps
 * - Annecy (45.9092, 6.6344) — lake + mountains
 * - Tignes (45.4654, 6.5356) — high altitude ski resort
 * - Avoriaz (46.0223, 6.7249) — 3 Vallées
 *
 * To test with specific location:
 * Set EXPO_PUBLIC_FORCE_LOCATION=48.8566,2.3522 in .env.local
 *
 * Check mobile console logs starting with [Pistes] for detailed debugging
 */

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
        console.log(
          `[Pistes] Insignificant movement: latDiff=${latDiff.toFixed(5)}, lngDiff=${lngDiff.toFixed(5)} — skipping`
        )
        return
      }
    }

    // Clear previous timer
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    // Debounce 500ms to avoid spam during rapid pan/zoom
    debounceTimerRef.current = setTimeout(async () => {
      const startTime = Date.now()
      try {
        setLoading(true)
        setError(null)

        const bbox = calculateBBox(region)
        console.log(
          `[Pistes] Bbox calculated: south=${bbox.south.toFixed(4)}, west=${bbox.west.toFixed(4)}, north=${bbox.north.toFixed(4)}, east=${bbox.east.toFixed(4)}`
        )
        console.log(
          `[Pistes] Fetching for region: lat=${region.latitude.toFixed(4)}, lng=${region.longitude.toFixed(4)}`
        )

        const response = await api.getPistes(
          bbox.south,
          bbox.west,
          bbox.north,
          bbox.east
        )

        const duration = Date.now() - startTime
        const featureCount = response.data?.features?.length || 0
        const lineStringCount = response.data?.features?.filter(
          (f: any) => f.geometry?.type === 'LineString'
        ).length || 0
        const otherCount = featureCount - lineStringCount

        console.log(
          `[Pistes] Response received in ${duration}ms: ${featureCount} total features (${lineStringCount} LineStrings, ${otherCount} other)`
        )

        // Log feature details for debugging
        if (featureCount > 0) {
          const difficulties = response.data.features
            .map((f: any) => f.properties?.difficulty)
            .filter(Boolean)
          const uniqueDifficulties = [...new Set(difficulties)]
          console.log(
            `[Pistes] Difficulty levels found: ${uniqueDifficulties.length > 0 ? uniqueDifficulties.join(', ') : 'none'}`
          )
        }

        setPistes(response.data)
        lastRegionRef.current = region
      } catch (err) {
        const duration = Date.now() - startTime
        const error = err instanceof Error ? err : new Error(String(err))
        const statusCode = (err as any)?.response?.status || 'unknown'
        setError(error)
        console.error(
          `[Pistes] Error after ${duration}ms (status: ${statusCode}):`,
          error.message
        )
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
