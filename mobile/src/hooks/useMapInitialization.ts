import { useState, useEffect } from 'react'
import * as Location from 'expo-location'

interface UserLocation {
  lat: number
  lng: number
  alt: number
}

interface MapInitializationResult {
  userLocation: UserLocation | null
  loading: boolean
}

/**
 * Parse forced location from env variable (format: "lat,lng")
 * Used for development/testing without GPS
 */
function parseForcedLocation(): UserLocation | null {
  const forcedLocation = process.env.EXPO_PUBLIC_FORCE_LOCATION
  if (!forcedLocation) return null

  const [latStr, lngStr] = forcedLocation.split(',')
  const lat = parseFloat(latStr)
  const lng = parseFloat(lngStr)

  if (isNaN(lat) || isNaN(lng)) {
    console.warn(`[Dev] Invalid EXPO_PUBLIC_FORCE_LOCATION format: "${forcedLocation}"`)
    return null
  }

  console.log(`[Dev] Using forced location: ${lat}, ${lng}`)
  return { lat, lng, alt: 0 }
}

export function useMapInitialization(): MapInitializationResult {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const initializeMap = async () => {
      try {
        // Check if dev forced location is set
        const forcedLocation = parseForcedLocation()
        if (forcedLocation) {
          if (isMounted) {
            setUserLocation(forcedLocation)
            setLoading(false)
          }
          return
        }

        // Otherwise, request GPS location
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          console.warn('Location permission denied')
          if (isMounted) setLoading(false)
          return
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })
        if (!isMounted) return

        const lat = location.coords.latitude
        const lng = location.coords.longitude
        const alt = location.coords.altitude ?? 0

        if (isMounted) {
          setUserLocation({ lat, lng, alt })
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to get location:', error)
        if (isMounted) setLoading(false)
      }
    }

    initializeMap()

    return () => {
      isMounted = false
    }
  }, [])

  return { userLocation, loading }
}
