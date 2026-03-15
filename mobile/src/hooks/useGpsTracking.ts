import { useState, useRef } from 'react'
import * as Location from 'expo-location'
import type { Socket } from 'socket.io-client'

interface LocationWatcher {
  remove: () => void
}

interface GpsTrackingResult {
  locationStatus: string
  startTracking: (socket: Socket | null) => Promise<boolean>
  stopTracking: () => void
}

export function useGpsTracking(): GpsTrackingResult {
  const [locationStatus, setLocationStatus] = useState('Localisation non initiée')
  const watcherRef = useRef<LocationWatcher | null>(null)

  const stopTracking = () => {
    watcherRef.current?.remove()
    watcherRef.current = null
    setLocationStatus('Service désactivé')
  }

  const startTracking = async (socket: Socket | null): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setLocationStatus('Permission de localisation refusée')
        return false
      }

      try {
        const watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000,
            distanceInterval: 0,
          },
          (location) => {
            const { latitude: lat, longitude: lng, altitude } = location.coords
            setLocationStatus(`Position: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`)
            if (socket?.connected) {
              socket.emit('agent:position', { lat, lng, altitude: altitude || 0 })
            }
          }
        )
        watcherRef.current = watcher
      } catch (watchErr) {
        console.warn('watchPositionAsync failed, falling back to polling:', watchErr)
        setLocationStatus('Mode de localisation dégradé (polling)')

        const pollInterval = setInterval(async () => {
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            })
            const { latitude: lat, longitude: lng, altitude } = location.coords
            setLocationStatus(`Position: ${lat.toFixed(4)}°, ${lng.toFixed(4)}° (polling)`)
            if (socket?.connected) {
              socket.emit('agent:position', { lat, lng, altitude: altitude || 0 })
            }
          } catch (err) {
            console.error('Polling error:', err)
          }
        }, 10000)

        watcherRef.current = { remove: () => clearInterval(pollInterval) }
      }
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Location tracking error'
      setLocationStatus(`Erreur GPS: ${message}`)
      console.error('Location tracking error:', err)
      return false
    }
  }

  return { locationStatus, startTracking, stopTracking }
}
