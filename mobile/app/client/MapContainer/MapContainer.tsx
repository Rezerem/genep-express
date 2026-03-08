import React, { ReactElement, useMemo, useRef } from 'react'
import { View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { mapContainerStyles } from './MapContainer.styles'
import type { AgentPosition } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Carte Google Maps Native — pas de WebView, pas de flickering
// ─────────────────────────────────────────────────────────────────────────────

interface MapContainerProps {
  userLocation: { lat: number; lng: number; alt: number } | null
  pistes: any
  agents: AgentPosition[]
}

export function MapContainer({ userLocation, pistes, agents }: MapContainerProps): ReactElement {
  const mapRef = useRef(null)

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
      >
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
      </MapView>
    </View>
  )
}
