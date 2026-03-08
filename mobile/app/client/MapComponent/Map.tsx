import React, { ReactElement, useEffect, useState } from 'react'
import { View, ActivityIndicator, Text } from 'react-native'
import * as Location from 'expo-location'
import { useSocket } from '@/hooks/useSocket'
import { usePositionsStore } from '@/store/usePositionsStore'
import { api } from '@/api/client'
import { mapScreenStyles } from './Map.styles'
import { MapContainer } from '../MapContainer'

// ─────────────────────────────────────────────────────────────────────────────
// Écran carte — react-native-maps avec pistes (GeoJSON) et marqueurs agents temps réel
// ─────────────────────────────────────────────────────────────────────────────

export function Map(): ReactElement {
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
    alt: number
  } | null>(null)
  const [pistes, setPistes] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const agents = usePositionsStore((state) => state.agents)

  // Initialize Socket.io connection for real-time positions
  useSocket()

  // Get user location and load pistes data
  useEffect(() => {
    let isMounted = true

    const initializeMap = async () => {
      try {
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          console.warn('Location permission denied')
          setLoading(false)
          return
        }

        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })

        const lat = location.coords.latitude
        const lng = location.coords.longitude
        const alt = location.coords.altitude ?? 0

        if (isMounted) {
          setUserLocation({ lat, lng, alt })

          // Calculate bounding box ~5km around user position
          const bboxOffset = 0.045
          const bbox = {
            south: lat - bboxOffset,
            west: lng - bboxOffset,
            north: lat + bboxOffset,
            east: lng + bboxOffset,
          }

          // Fetch pistes
          const response = await api.getPistes(bbox.south, bbox.west, bbox.north, bbox.east)
          if (isMounted) {
            setPistes(response.data)
          }
        }
      } catch (error) {
        console.error('Failed to initialize map:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeMap()

    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <View style={mapScreenStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={mapScreenStyles.loadingText}>Chargement de la carte...</Text>
      </View>
    )
  }

  if (!userLocation) {
    return (
      <View style={mapScreenStyles.errorContainer}>
        <Text style={mapScreenStyles.errorText}>Position non disponible</Text>
      </View>
    )
  }

  return (
    <View style={mapScreenStyles.container}>
      <MapContainer userLocation={userLocation} pistes={pistes} agents={agents} />
    </View>
  )
}
