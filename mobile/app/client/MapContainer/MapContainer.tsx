import React, { ReactElement, useMemo, useRef } from 'react'
import { View } from 'react-native'
import MapView, { Marker, Polyline } from 'react-native-maps'
import type { Region } from 'react-native-maps'
import { mapContainerStyles } from './MapContainer.styles'
import type { AgentPosition } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Carte Google Maps Native — pas de WebView, pas de flickering
// ─────────────────────────────────────────────────────────────────────────────

interface MapContainerProps {
  userLocation: { lat: number; lng: number; alt: number } | null
  pistes: any
  agents: AgentPosition[]
  meetingPoint?: { lat: number; lng: number } | null
  onMapReady?: (mapRef: React.RefObject<MapView | null>) => void
  onRegionChangeComplete?: (region: Region, details?: any) => void
}

export function MapContainer({ userLocation, pistes, agents, meetingPoint, onMapReady, onRegionChangeComplete }: MapContainerProps): ReactElement {
  const mapRef = useRef<MapView>(null)

  React.useEffect(() => {
    onMapReady?.(mapRef)
  }, [])
  // Memoize markers pour éviter la recréation à chaque render
  const markerElements = useMemo(
    () =>
      agents.map((agent) => (
        <Marker
          key={agent.id}
          coordinate={{
            latitude: agent.lat,
            longitude: agent.lng,
          }}
          title={agent.name}
          description={agent.available ? 'Disponible' : 'Occupé'}
          pinColor={agent.available ? '#10b981' : '#9ca3af'}
        />
      )),
    [agents]
  )

  // Memoize pistes (GeoJSON LineStrings) => Polyline components
  const pisteElements = useMemo(() => {
    if (!pistes || !pistes.features || !Array.isArray(pistes.features)) {
      return []
    }

    return pistes.features
      .filter((feature: any) => feature.geometry?.type === 'LineString')
      .map((feature: any, idx: number) => {
        const coords = feature.geometry.coordinates
        if (!Array.isArray(coords) || coords.length === 0) {
          return null
        }

        const validCoords = coords
          .filter((coord: any) => Array.isArray(coord) && coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number')
          .map((coord: any) => ({
            latitude: coord[1] as number,
            longitude: coord[0] as number,
          }))

        if (validCoords.length === 0) {
          return null
        }

        return (
          <Polyline
            key={`piste-${idx}`}
            coordinates={validCoords}
            strokeColor="#6366f1"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )
      })
      .filter((el: any) => el !== null)
  }, [pistes])

  if (!userLocation) {
    return <View style={mapContainerStyles.map} />
  }

  return (
    <View style={mapContainerStyles.map}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        {...(onRegionChangeComplete && {
          onRegionChangeComplete: (region: Region, details?: any) =>
            onRegionChangeComplete(region, details),
        })}
      >
        {/* Pistes GeoJSON */}
        {pisteElements}

        {/* Marqueur utilisateur */}
        <Marker
          key="user-location"
          coordinate={{
            latitude: userLocation.lat,
            longitude: userLocation.lng,
          }}
          title="Votre position"
          pinColor="#3b82f6"
        />

        {/* Marqueurs agents */}
        {markerElements}

        {/* Marqueur point de rendez-vous */}
        {meetingPoint && (
          <Marker
            coordinate={{
              latitude: meetingPoint.lat,
              longitude: meetingPoint.lng,
            }}
            title="Point de rendez-vous"
            pinColor="#3b82f6"
          />
        )}
      </MapView>
    </View>
  )
}
