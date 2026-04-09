import React, { ReactElement, useRef } from 'react'
import { View } from 'react-native'
import MapLibreGL, { type CameraRef } from '@maplibre/maplibre-react-native'
import { mapContainerStyles } from './MapContainer.styles'
import type { AgentPosition } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Carte MapLibre — fond OpenFreeMap liberty (OSM, gratuit, sans clé API)
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

interface Region {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

interface MapContainerProps {
  userLocation: { lat: number; lng: number; alt: number } | null
  pistes: any
  agents: AgentPosition[]
  meetingPoint?: { lat: number; lng: number } | null
  onMapReady?: (cameraRef: React.RefObject<CameraRef | null>) => void
  onRegionChangeComplete?: (region: Region) => void
}

export function MapContainer({
  userLocation,
  pistes,
  agents,
  meetingPoint,
  onMapReady,
  onRegionChangeComplete,
}: MapContainerProps): ReactElement {
  const cameraRef = useRef<CameraRef>(null)
  const hasInitialized = useRef(false)

  const handleStyleLoaded = () => {
    if (!hasInitialized.current && userLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.lng, userLocation.lat],
        zoomLevel: 13,
        animationDuration: 0,
      })
      hasInitialized.current = true
    }
    onMapReady?.(cameraRef)
  }

  if (!userLocation) {
    return <View style={mapContainerStyles.map} />
  }

  return (
    <MapLibreGL.MapView
      style={mapContainerStyles.map}
      mapStyle={STYLE_URL}
      onDidFinishLoadingStyle={handleStyleLoaded}
      onRegionDidChange={(feature: any) => {
        if (!onRegionChangeComplete) return
        const [ne, sw] = feature.properties.visibleBounds
        const region: Region = {
          latitude: (ne[1] + sw[1]) / 2,
          longitude: (ne[0] + sw[0]) / 2,
          latitudeDelta: ne[1] - sw[1],
          longitudeDelta: ne[0] - sw[0],
        }
        onRegionChangeComplete(region)
      }}
    >
      <MapLibreGL.Camera ref={cameraRef} />

      {/* Pistes — data-driven LineLayer */}
      {pistes?.features?.length > 0 && (
        <MapLibreGL.ShapeSource id="pistes" shape={pistes}>
          <MapLibreGL.LineLayer
            id="pistes-layer"
            style={{
              lineColor: [
                'match',
                ['get', 'difficulty'],
                'novice', '#4ade80',
                'easy', '#4ade80',
                'intermediate', '#3b82f6',
                'advanced', '#f97316',
                'expert', '#000000',
                '#6366f1',
              ],
              lineWidth: 3,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </MapLibreGL.ShapeSource>
      )}

      {/* Position utilisateur */}
      <MapLibreGL.PointAnnotation
        id="user-location"
        coordinate={[userLocation.lng, userLocation.lat]}
      >
        <View style={mapContainerStyles.userDot} />
      </MapLibreGL.PointAnnotation>

      {/* Agents */}
      {agents.map((agent) => (
        <MapLibreGL.PointAnnotation
          key={agent.id}
          id={agent.id}
          coordinate={[agent.lng, agent.lat]}
        >
          <View
            style={
              agent.available
                ? mapContainerStyles.agentAvailable
                : mapContainerStyles.agentBusy
            }
          />
        </MapLibreGL.PointAnnotation>
      ))}

      {/* Point de rendez-vous */}
      {meetingPoint && (
        <MapLibreGL.PointAnnotation
          id="meeting-point"
          coordinate={[meetingPoint.lng, meetingPoint.lat]}
        >
          <View style={mapContainerStyles.meetingDot} />
        </MapLibreGL.PointAnnotation>
      )}
    </MapLibreGL.MapView>
  )
}
