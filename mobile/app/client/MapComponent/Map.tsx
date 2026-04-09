import React, { ReactElement, useMemo, useRef } from 'react'
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useWindowDimensions } from 'react-native'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import MapLibreGL, { type CameraRef } from '@maplibre/maplibre-react-native'
import { useSocket } from '@/hooks/useSocket'
import { usePositionsStore } from '@/store/usePositionsStore'
import { useOrderStore } from '@/store/useOrderStore'
import { useMapInitialization } from '@/hooks/useMapInitialization'
import { useDynamicPistes } from '@/hooks/useDynamicPistes'
import { mapScreenStyles } from './Map.styles'
import { MapContainer } from '../MapContainer'
import { MapBottomSheet } from '../MapBottomSheet/MapBottomSheet'
import { RecenterButton } from './RecenterButton'

export function Map(): ReactElement {
  const router = useRouter()
  const { height: screenHeight } = useWindowDimensions()

  const agents = usePositionsStore((state) => state.agents)
  const activeOrder = useOrderStore((state) => state.activeOrder)
  const bottomSheetRef = useRef<BottomSheet>(null)
  const cameraRef = useRef<CameraRef>(null)
  const animatedPosition = useSharedValue(0)
  const snapPoints = useMemo(() => ['12%', '45%'], [])

  const { userLocation, loading: initialLoading } = useMapInitialization()
  const { pistes, loading: pistesLoading, onRegionChange } = useDynamicPistes()

  // Initialize Socket.io connection for real-time positions
  useSocket()

  const handleRecenter = () => {
    if (!userLocation) return
    cameraRef.current?.setCamera({
      centerCoordinate: [userLocation.lng, userLocation.lat],
      zoomLevel: 14,
      animationDuration: 500,
    })
  }

  const isTracking = activeOrder?.status === 'en_route'
  const meetingPoint = isTracking
    ? { lat: activeOrder.meetLat, lng: activeOrder.meetLng }
    : null

  if (initialLoading) {
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
      {/* Carte plein écran */}
      <MapContainer
        userLocation={userLocation}
        pistes={pistes}
        agents={agents}
        meetingPoint={meetingPoint}
        onMapReady={(ref) => {
          cameraRef.current = ref.current
        }}
        onRegionChangeComplete={onRegionChange}
      />

      {/* Bouton recentrer animé */}
      <RecenterButton onPress={handleRecenter} animatedPosition={animatedPosition} screenHeight={screenHeight} />

      {/* Bottom sheet */}
      <BottomSheet ref={bottomSheetRef} index={0} snapPoints={snapPoints} animatedPosition={animatedPosition}>
        <BottomSheetView>
          <MapBottomSheet agents={agents} userLocation={userLocation} />
        </BottomSheetView>
      </BottomSheet>

      {/* Overlay de suivi — affiche seulement si en_route */}
      {isTracking && activeOrder && (
        <View style={mapScreenStyles.trackingOverlay}>
          <Text style={mapScreenStyles.trackingLabel}>
            🚚 Ravitailleur en route
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/client/order/tracking?id=${activeOrder.id}`)}
          >
            <Text style={mapScreenStyles.trackingLink}>{'< Suivi'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
